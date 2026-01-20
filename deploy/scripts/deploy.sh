#!/bin/bash
################################################################################
# DASHBOARD NODE.JS - AUTOMATED DEPLOYMENT SCRIPT
# Versione: 1.1.0 TESTATA E FUNZIONANTE
# Data: 20 Gennaio 2026
################################################################################

set -e
set -o pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

separator() {
    echo ""
    echo "=============================================================================="
    echo -e "${BLUE}$1${NC}"
    echo "=============================================================================="
    echo ""
}

check_root() {
    if [ "$EUID" -ne 0 ]; then 
        log_error "Questo script deve essere eseguito come root"
        exit 1
    fi
}

# Configurazione
APP_DIR="/opt/dashboard-nodejs"
NGINX_DIR="/var/www/dashboard"
BACKUP_DIR="/opt/backups"
LOG_FILE="/var/log/dashboard-deployment.log"

DB_NAME="dashboard_db"
DB_USER="dashboard_user"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

GITHUB_REPO="https://github.com/turiliffiu/dashboard-nodejs.git"
GITHUB_BRANCH="main"

SKIP_SYSTEM_UPDATE=false
for arg in "$@"; do
    case $arg in
        --skip-system-update)
            SKIP_SYSTEM_UPDATE=true
            shift
            ;;
    esac
done

step_0_prerequisites() {
    separator "STEP 0: Verifica Prerequisiti"
    check_root
    
    log_info "Controllo distribuzione Linux..."
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        log_success "OS: $NAME $VERSION"
    else
        log_error "Sistema operativo non riconosciuto"
        exit 1
    fi
    
    CONTAINER_IP=$(hostname -I | awk '{print $1}')
    if [ -z "$CONTAINER_IP" ]; then
        log_error "Impossibile recuperare indirizzo IP"
        exit 1
    fi
    log_success "Indirizzo IP container: $CONTAINER_IP"
    
    CONTAINER_HOSTNAME=$(hostname)
    log_success "Hostname: $CONTAINER_HOSTNAME"
    
    log_info "Test connettività internet..."
    if ping -c 1 8.8.8.8 &> /dev/null; then
        log_success "Connessione internet OK"
    else
        log_error "Nessuna connessione internet"
        exit 1
    fi
    
    touch "$LOG_FILE"
    echo "=== Deployment started at $(date) ===" >> "$LOG_FILE"
    log_success "Log file: $LOG_FILE"
}

step_1_system_update() {
    separator "STEP 1: Aggiornamento Sistema"
    
    if [ "$SKIP_SYSTEM_UPDATE" = true ]; then
        log_warning "Aggiornamento sistema saltato (--skip-system-update)"
        return
    fi
    
    log_info "Aggiornamento package list..."
    apt update >> "$LOG_FILE" 2>&1
    
    log_info "Aggiornamento sistema (può richiedere qualche minuto)..."
    DEBIAN_FRONTEND=noninteractive apt upgrade -y >> "$LOG_FILE" 2>&1
    
    log_info "Installazione strumenti base..."
    apt install -y curl wget git build-essential software-properties-common \
        apt-transport-https ca-certificates gnupg lsb-release ufw htop \
        vim nano unzip >> "$LOG_FILE" 2>&1
    
    log_success "Sistema aggiornato e strumenti base installati"
}

step_2_install_nodejs() {
    separator "STEP 2: Installazione Node.js 20.x"
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | tr -d 'v')
        if [ "$MAJOR_VERSION" -ge 20 ]; then
            log_success "Node.js già installato: $NODE_VERSION"
            return
        fi
    fi
    
    log_info "Download setup script Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x -o /tmp/nodesource_setup.sh >> "$LOG_FILE" 2>&1
    
    log_info "Esecuzione setup Node.js..."
    bash /tmp/nodesource_setup.sh >> "$LOG_FILE" 2>&1
    
    log_info "Installazione Node.js..."
    apt install -y nodejs >> "$LOG_FILE" 2>&1
    
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    log_success "Node.js installato: $NODE_VERSION"
    log_success "npm installato: $NPM_VERSION"
    
    log_info "Configurazione npm global directory..."
    mkdir -p /root/.npm-global
    npm config set prefix '/root/.npm-global' >> "$LOG_FILE" 2>&1
    
    export PATH=/root/.npm-global/bin:$PATH
    echo 'export PATH=/root/.npm-global/bin:$PATH' >> /root/.bashrc
    
    log_success "npm configurato e PATH aggiornato"
}

step_3_install_postgresql() {
    separator "STEP 3: Installazione PostgreSQL 16"
    
    if systemctl is-active --quiet postgresql; then
        PG_VERSION=$(psql --version 2>/dev/null | awk '{print $3}' | cut -d'.' -f1)
        if [ "$PG_VERSION" -ge 16 ] 2>/dev/null; then
            log_success "PostgreSQL già installato: versione $PG_VERSION"
            return
        fi
    fi
    
    log_info "Aggiunta repository PostgreSQL..."
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    
    log_info "Download chiave GPG PostgreSQL..."
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - >> "$LOG_FILE" 2>&1
    
    log_info "Aggiornamento package list..."
    apt update >> "$LOG_FILE" 2>&1
    
    log_info "Installazione PostgreSQL 16..."
    apt install -y postgresql-16 postgresql-contrib-16 >> "$LOG_FILE" 2>&1
    
    log_info "Avvio servizio PostgreSQL..."
    systemctl enable postgresql >> "$LOG_FILE" 2>&1
    systemctl start postgresql >> "$LOG_FILE" 2>&1
    
    if systemctl is-active --quiet postgresql; then
        log_success "PostgreSQL 16 installato e attivo"
    else
        log_error "PostgreSQL non è attivo"
        exit 1
    fi
}

step_4_configure_database() {
    separator "STEP 4: Configurazione Database"
    
    log_info "Creazione database e utente..."
    
    DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "")
    
    if [ "$DB_EXISTS" = "1" ]; then
        log_warning "Database $DB_NAME già esistente - lo elimino e ricreo"
        sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" >> "$LOG_FILE" 2>&1
        sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" >> "$LOG_FILE" 2>&1
    fi
    
    sudo -u postgres psql << EOF >> "$LOG_FILE" 2>&1
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
EOF
    
    DB_CHECK=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")
    if [ "$DB_CHECK" = "1" ]; then
        log_success "Database $DB_NAME creato"
        log_success "User: $DB_USER"
    else
        log_error "Errore nella creazione del database"
        exit 1
    fi
    
    log_info "Test connessione database..."
    if PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -c "SELECT 1;" >> "$LOG_FILE" 2>&1; then
        log_success "Connessione database OK"
    else
        log_error "Errore connessione database"
        exit 1
    fi
}

step_5_install_nginx() {
    separator "STEP 5: Installazione Nginx"
    
    if systemctl is-active --quiet nginx; then
        log_warning "Nginx già installato e attivo"
        return
    fi
    
    log_info "Installazione Nginx..."
    apt install -y nginx >> "$LOG_FILE" 2>&1
    
    log_info "Avvio servizio Nginx..."
    systemctl enable nginx >> "$LOG_FILE" 2>&1
    systemctl start nginx >> "$LOG_FILE" 2>&1
    
    if systemctl is-active --quiet nginx; then
        log_success "Nginx installato e attivo"
    else
        log_error "Nginx non è attivo"
        exit 1
    fi
}

step_6_install_pm2() {
    separator "STEP 6: Installazione PM2"
    
    export PATH=/root/.npm-global/bin:$PATH
    
    if command -v pm2 &> /dev/null; then
        PM2_VERSION=$(pm2 --version)
        log_success "PM2 già installato: v$PM2_VERSION"
        return
    fi
    
    log_info "Installazione PM2 globalmente..."
    npm install -g pm2 >> "$LOG_FILE" 2>&1
    
    if command -v pm2 &> /dev/null; then
        PM2_VERSION=$(pm2 --version)
        log_success "PM2 installato: v$PM2_VERSION"
    else
        log_error "Errore installazione PM2"
        exit 1
    fi
    
    log_info "Configurazione PM2 startup..."
    pm2 startup systemd -u root --hp /root >> "$LOG_FILE" 2>&1
    
    log_success "PM2 configurato"
}

step_7_setup_backend() {
    separator "STEP 7: Setup Backend"
    
    if [ -d "$APP_DIR" ]; then
        log_warning "Directory $APP_DIR già esistente - la elimino"
        rm -rf "$APP_DIR"
    fi
    
    log_info "Clone repository da GitHub..."
    git clone -b "$GITHUB_BRANCH" "$GITHUB_REPO" "$APP_DIR" >> "$LOG_FILE" 2>&1
    log_success "Repository clonato in $APP_DIR"
    
    cd "$APP_DIR/backend"
    
    log_info "Installazione dipendenze backend (può richiedere qualche minuto)..."
    npm install >> "$LOG_FILE" 2>&1
    npm install --save-dev sequelize-cli >> "$LOG_FILE" 2>&1
    log_success "Dipendenze backend installate"
    
    log_info "Creazione file .env backend..."
    cat > .env << EOF
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

FRONTEND_URL=http://$CONTAINER_IP
ALLOWED_ORIGINS=http://$CONTAINER_IP,http://localhost:5173,http://localhost:3000

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

MAX_FILE_SIZE=10485760

LOG_LEVEL=info
EOF
    log_success "File .env backend creato"
    
    log_info "Esecuzione migrazioni database..."
    npx sequelize-cli db:migrate --env production >> "$LOG_FILE" 2>&1
    log_success "Migrazioni database completate"
    
    log_info "Popolamento database con dati iniziali..."
    npx sequelize-cli db:seed:all --env production >> "$LOG_FILE" 2>&1
    log_success "Database popolato con dati iniziali"
    
    log_success "Backend setup completato"
}

step_8_setup_frontend() {
    separator "STEP 8: Setup Frontend"
    
    cd "$APP_DIR/frontend"
    
    log_info "Installazione dipendenze frontend (può richiedere qualche minuto)..."
    npm install >> "$LOG_FILE" 2>&1
    log_success "Dipendenze frontend installate"
    
    log_info "Creazione file .env frontend..."
    cat > .env << EOF
VITE_API_URL=/api
VITE_APP_NAME=Dashboard Procedure Operative
EOF
    log_success "File .env frontend creato"
    
    log_info "Build production frontend (può richiedere qualche minuto)..."
    npm run build >> "$LOG_FILE" 2>&1
    log_success "Build frontend completata"
    
    log_info "Deploy frontend in Nginx..."
    mkdir -p "$NGINX_DIR"
    rm -rf "$NGINX_DIR"/*
    cp -r dist/* "$NGINX_DIR/"
    chown -R www-data:www-data "$NGINX_DIR"
    
    log_success "Frontend setup completato"
}

step_9_configure_nginx() {
    separator "STEP 9: Configurazione Nginx"
    
    log_info "Creazione configurazione Nginx..."
    
    cat > /etc/nginx/sites-available/dashboard << EOF
server {
    listen 80 default_server;
    server_name $CONTAINER_IP _;
    root $NGINX_DIR;
    index index.html;

    location /api/ {
        rewrite ^/api/(.*)$ /\$1 break;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF
    
    log_success "Configurazione Nginx creata"
    
    log_info "Attivazione configurazione Nginx..."
    rm -f /etc/nginx/sites-enabled/default
    ln -sf /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/dashboard
    
    log_info "Test configurazione Nginx..."
    if nginx -t >> "$LOG_FILE" 2>&1; then
        log_success "Configurazione Nginx valida"
    else
        log_error "Errore nella configurazione Nginx"
        nginx -t
        exit 1
    fi
    
    log_info "Reload Nginx..."
    systemctl reload nginx >> "$LOG_FILE" 2>&1
    log_success "Nginx ricaricato"
}

step_10_start_backend() {
    separator "STEP 10: Avvio Backend con PM2"
    
    export PATH=/root/.npm-global/bin:$PATH
    
    cd "$APP_DIR/backend"
    
    log_info "Stop eventuali processi PM2 esistenti..."
    pm2 stop dashboard-api 2>/dev/null || true
    pm2 delete dashboard-api 2>/dev/null || true
    
    log_info "Avvio backend con PM2..."
    pm2 start ecosystem.config.js >> "$LOG_FILE" 2>&1
    
    log_info "Salvataggio configurazione PM2..."
    pm2 save >> "$LOG_FILE" 2>&1
    
    log_info "Attesa avvio backend (5 secondi)..."
    sleep 5
    
    if pm2 show dashboard-api &> /dev/null; then
        log_success "Backend avviato con PM2"
        pm2 list
    else
        log_error "Errore avvio backend"
        pm2 logs dashboard-api --lines 50
        exit 1
    fi
}

step_11_configure_firewall() {
    separator "STEP 11: Configurazione Firewall"
    
    log_info "Configurazione UFW..."
    
    ufw --force reset >> "$LOG_FILE" 2>&1
    ufw default deny incoming >> "$LOG_FILE" 2>&1
    ufw default allow outgoing >> "$LOG_FILE" 2>&1
    
    log_info "Apertura porte necessarie..."
    ufw allow 22/tcp comment 'SSH' >> "$LOG_FILE" 2>&1
    ufw allow 80/tcp comment 'HTTP' >> "$LOG_FILE" 2>&1
    ufw allow 443/tcp comment 'HTTPS' >> "$LOG_FILE" 2>&1
    
    log_info "Abilitazione firewall..."
    ufw --force enable >> "$LOG_FILE" 2>&1
    
    log_success "Firewall configurato"
}

step_12_configure_backup() {
    separator "STEP 12: Configurazione Backup Automatici"
    
    log_info "Creazione directory backup..."
    mkdir -p "$BACKUP_DIR"
    
    log_info "Creazione script backup database..."
    cat > /usr/local/bin/backup-dashboard-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DB_NAME="dashboard_db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/dashboard_db_$TIMESTAMP.sql.gz"

sudo -u postgres pg_dump $DB_NAME | gzip > $BACKUP_FILE
find $BACKUP_DIR -name "dashboard_db_*.sql.gz" -mtime +30 -delete

echo "Backup completato: $BACKUP_FILE"
EOF
    
    chmod +x /usr/local/bin/backup-dashboard-db.sh
    
    log_info "Configurazione cron job backup..."
    (crontab -l 2>/dev/null || true; echo "0 2 * * * /usr/local/bin/backup-dashboard-db.sh >> /var/log/backup-db.log 2>&1") | crontab -
    
    log_success "Backup automatici configurati"
    log_info "Cron job attivo: Daily backup alle 2:00 AM"
}

step_13_test_deployment() {
    separator "STEP 13: Test Deployment"
    
    log_info "Test backend health endpoint..."
    sleep 3
    
    HEALTH_RESPONSE=$(curl -s http://localhost/api/health 2>/dev/null || echo "ERROR")
    
    if echo "$HEALTH_RESPONSE" | grep -q "OK"; then
        log_success "Backend health check: OK"
    else
        log_warning "Backend health check tramite proxy: FAILED"
        log_info "Test diretto backend..."
        DIRECT_HEALTH=$(curl -s http://localhost:3000/health 2>/dev/null || echo "ERROR")
        if echo "$DIRECT_HEALTH" | grep -q "OK"; then
            log_success "Backend diretto: OK"
        else
            log_error "Backend: FAILED"
        fi
    fi
    
    log_info "Test frontend..."
    FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null)
    
    if [ "$FRONTEND_RESPONSE" = "200" ]; then
        log_success "Frontend: OK (HTTP $FRONTEND_RESPONSE)"
    else
        log_error "Frontend: FAILED (HTTP $FRONTEND_RESPONSE)"
    fi
    
    export PATH=/root/.npm-global/bin:$PATH
    if pm2 show dashboard-api &> /dev/null; then
        log_success "PM2 Process: RUNNING"
    else
        log_error "PM2 Process: NOT RUNNING"
    fi
}

step_14_generate_report() {
    separator "STEP 14: Report Deployment"
    
    REPORT_FILE="/root/dashboard-deployment-report.txt"
    
    cat > "$REPORT_FILE" << EOF
================================================================================
DASHBOARD NODE.JS - DEPLOYMENT REPORT
================================================================================

Data Deployment: $(date)
Container IP: $CONTAINER_IP
Hostname: $CONTAINER_HOSTNAME

================================================================================
URLs ACCESSO
================================================================================

Frontend:        http://$CONTAINER_IP
Backend API:     http://$CONTAINER_IP/api
Health Check:    http://$CONTAINER_IP/api/health

================================================================================
CREDENZIALI DEFAULT
================================================================================

Username: admin
Password: admin123

⚠️  IMPORTANTE: Cambia la password admin al primo login!

================================================================================
COMANDI UTILI
================================================================================

pm2 status                  # Stato backend
pm2 logs                    # Log real-time
systemctl status nginx      # Stato Nginx
systemctl status postgresql # Stato database

/usr/local/bin/backup-dashboard-db.sh  # Backup manuale

================================================================================
CONFIGURAZIONE
================================================================================

Database: $DB_NAME
User: $DB_USER
Password: $DB_PASSWORD

JWT Secret: $JWT_SECRET

================================================================================
EOF
    
    cat "$REPORT_FILE"
    
    log_success "Report salvato in: $REPORT_FILE"
    
    cat > /root/.dashboard-secrets << EOF
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
EOF
    chmod 600 /root/.dashboard-secrets
    
    log_success "Secrets salvati in: /root/.dashboard-secrets"
}

main() {
    clear
    
    cat << "EOF"
    
    ██████╗  █████╗ ███████╗██╗  ██╗██████╗  ██████╗  █████╗ ██████╗ ██████╗ 
    ██╔══██╗██╔══██╗██╔════╝██║  ██║██╔══██╗██╔═══██╗██╔══██╗██╔══██╗██╔══██╗
    ██║  ██║███████║███████╗███████║██████╔╝██║   ██║███████║██████╔╝██║  ██║
    ██║  ██║██╔══██║╚════██║██╔══██║██╔══██╗██║   ██║██╔══██║██╔══██╗██║  ██║
    ██████╔╝██║  ██║███████║██║  ██║██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝
    ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ 
    
    AUTOMATED DEPLOYMENT SCRIPT v1.1.0
    
EOF
    
    echo ""
    log_info "Inizio deployment automatico..."
    echo ""
    
    START_TIME=$(date +%s)
    
    step_0_prerequisites
    step_1_system_update
    step_2_install_nodejs
    step_3_install_postgresql
    step_4_configure_database
    step_5_install_nginx
    step_6_install_pm2
    step_7_setup_backend
    step_8_setup_frontend
    step_9_configure_nginx
    step_10_start_backend
    step_11_configure_firewall
    step_12_configure_backup
    step_13_test_deployment
    step_14_generate_report
    
    END_TIME=$(date +%s)
    EXECUTION_TIME=$((END_TIME - START_TIME))
    MINUTES=$((EXECUTION_TIME / 60))
    SECONDS=$((EXECUTION_TIME % 60))
    
    separator "DEPLOYMENT COMPLETATO!"
    
    log_success "Tempo totale: ${MINUTES}m ${SECONDS}s"
    echo ""
    log_success "Dashboard disponibile su: http://$CONTAINER_IP"
    echo ""
    log_info "Credenziali default:"
    echo "  Username: admin"
    echo "  Password: admin123"
    echo ""
    log_warning "⚠️  Cambia la password admin al primo login!"
    echo ""
    log_info "Report: /root/dashboard-deployment-report.txt"
    echo ""
    
    separator "ENJOY YOUR DASHBOARD! 🚀"
}

main "$@"
