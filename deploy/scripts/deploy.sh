#!/bin/bash
################################################################################
# DASHBOARD NODE.JS - AUTOMATED DEPLOYMENT SCRIPT
# 
# Descrizione: Script automatico per deployment completo su container Proxmox
# Autore: Salvo - FiberCop TGS
# Data: Gennaio 2026
# 
# Prerequisiti:
# - Container Proxmox Ubuntu 24.04 già creato e avviato
# - Accesso root al container
# - Connessione internet attiva
#
# Uso: 
#   bash deploy.sh
#   oppure
#   bash deploy.sh --skip-system-update
################################################################################

set -e  # Exit on error
set -o pipefail  # Exit on pipe failure

################################################################################
# COLORI PER OUTPUT
################################################################################
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

################################################################################
# FUNZIONI UTILITY
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

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

################################################################################
# CONFIGURAZIONE
################################################################################

# Parametri deployment
APP_NAME="dashboard"
APP_USER="dashboard"
APP_DIR="/opt/dashboard-nodejs"
NGINX_DIR="/var/www/dashboard"
BACKUP_DIR="/opt/backups"
LOG_FILE="/var/log/dashboard-deployment.log"

# Database configuration
DB_NAME="dashboard_db"
DB_USER="dashboard_user"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# JWT Secrets
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

# GitHub repository
GITHUB_REPO="https://github.com/turiliffiu/dashboard-nodejs.git"
GITHUB_BRANCH="main"

# Parse arguments
SKIP_SYSTEM_UPDATE=false
for arg in "$@"; do
    case $arg in
        --skip-system-update)
            SKIP_SYSTEM_UPDATE=true
            shift
            ;;
    esac
done

################################################################################
# STEP 0: PREREQUISITI E VERIFICA AMBIENTE
################################################################################

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
    
    log_info "Recupero informazioni container..."
    
    # Get IP address
    CONTAINER_IP=$(hostname -I | awk '{print $1}')
    if [ -z "$CONTAINER_IP" ]; then
        log_error "Impossibile recuperare indirizzo IP"
        exit 1
    fi
    log_success "Indirizzo IP container: $CONTAINER_IP"
    
    # Get hostname
    CONTAINER_HOSTNAME=$(hostname)
    log_success "Hostname: $CONTAINER_HOSTNAME"
    
    # Check internet connectivity
    log_info "Test connettività internet..."
    if ping -c 1 8.8.8.8 &> /dev/null; then
        log_success "Connessione internet OK"
    else
        log_error "Nessuna connessione internet"
        exit 1
    fi
    
    # Create log file
    touch "$LOG_FILE"
    echo "=== Deployment started at $(date) ===" >> "$LOG_FILE"
    log_success "Log file: $LOG_FILE"
    
    # Salva configurazione
    cat > /tmp/deployment_config.env << EOF
CONTAINER_IP=$CONTAINER_IP
CONTAINER_HOSTNAME=$CONTAINER_HOSTNAME
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
APP_DIR=$APP_DIR
APP_USER=$APP_USER
EOF
    
    log_success "Configurazione salvata in /tmp/deployment_config.env"
}

################################################################################
# STEP 1: AGGIORNAMENTO SISTEMA E INSTALLAZIONE DIPENDENZE BASE
################################################################################

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
    apt install -y \
        curl \
        wget \
        git \
        build-essential \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        ufw \
        htop \
        vim \
        nano \
        unzip \
        >> "$LOG_FILE" 2>&1
    
    log_success "Sistema aggiornato e strumenti base installati"
}

################################################################################
# STEP 2: INSTALLAZIONE NODE.JS 20.x
################################################################################

step_2_install_nodejs() {
    separator "STEP 2: Installazione Node.js 20.x"
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_warning "Node.js già installato: $NODE_VERSION"
        
        # Verifica versione
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | tr -d 'v')
        if [ "$MAJOR_VERSION" -ge 20 ]; then
            log_success "Versione Node.js OK (>= 20.x)"
            return
        else
            log_warning "Versione Node.js obsoleta, aggiornamento in corso..."
        fi
    fi
    
    log_info "Download setup script Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x -o /tmp/nodesource_setup.sh >> "$LOG_FILE" 2>&1
    
    log_info "Esecuzione setup Node.js..."
    bash /tmp/nodesource_setup.sh >> "$LOG_FILE" 2>&1
    
    log_info "Installazione Node.js..."
    apt install -y nodejs >> "$LOG_FILE" 2>&1
    
    # Verifica installazione
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    log_success "Node.js installato: $NODE_VERSION"
    log_success "npm installato: $NPM_VERSION"
    
    # Configurazione npm global directory
    log_info "Configurazione npm global directory..."
    mkdir -p /root/.npm-global
    npm config set prefix '/root/.npm-global' >> "$LOG_FILE" 2>&1
    echo 'export PATH=/root/.npm-global/bin:$PATH' >> /root/.bashrc
    export PATH=/root/.npm-global/bin:$PATH
    
    log_success "npm configurato"
}

################################################################################
# STEP 3: INSTALLAZIONE POSTGRESQL 16.x
################################################################################

step_3_install_postgresql() {
    separator "STEP 3: Installazione PostgreSQL 16"
    
    if systemctl is-active --quiet postgresql; then
        log_warning "PostgreSQL già installato e attivo"
        PG_VERSION=$(psql --version | awk '{print $3}' | cut -d'.' -f1)
        log_info "Versione PostgreSQL: $PG_VERSION"
        
        if [ "$PG_VERSION" -ge 16 ]; then
            log_success "Versione PostgreSQL OK (>= 16)"
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
    
    # Verifica
    if systemctl is-active --quiet postgresql; then
        log_success "PostgreSQL 16 installato e attivo"
    else
        log_error "PostgreSQL non è attivo"
        exit 1
    fi
}

################################################################################
# STEP 4: CONFIGURAZIONE DATABASE
################################################################################

step_4_configure_database() {
    separator "STEP 4: Configurazione Database"
    
    log_info "Creazione database e utente..."
    
    # Verifica se database esiste già
    DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")
    
    if [ "$DB_EXISTS" = "1" ]; then
        log_warning "Database $DB_NAME già esistente"
        read -p "Vuoi eliminarlo e ricrearlo? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Eliminazione database esistente..."
            sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" >> "$LOG_FILE" 2>&1
            sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" >> "$LOG_FILE" 2>&1
        else
            log_info "Database esistente mantenuto"
            return
        fi
    fi
    
    # Creazione database
    sudo -u postgres psql << EOF >> "$LOG_FILE" 2>&1
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
EOF
    
    # Verifica creazione
    DB_CHECK=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")
    if [ "$DB_CHECK" = "1" ]; then
        log_success "Database $DB_NAME creato"
        log_success "User: $DB_USER"
        log_info "Password salvata in /tmp/deployment_config.env"
    else
        log_error "Errore nella creazione del database"
        exit 1
    fi
    
    # Test connessione
    log_info "Test connessione database..."
    if PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -c "SELECT 1;" >> "$LOG_FILE" 2>&1; then
        log_success "Connessione database OK"
    else
        log_error "Errore connessione database"
        exit 1
    fi
}

################################################################################
# STEP 5: INSTALLAZIONE NGINX
################################################################################

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
    
    # Verifica
    if systemctl is-active --quiet nginx; then
        log_success "Nginx installato e attivo"
    else
        log_error "Nginx non è attivo"
        exit 1
    fi
    
    # Rimozione configurazione default
    if [ -f /etc/nginx/sites-enabled/default ]; then
        log_info "Rimozione configurazione Nginx default..."
        rm /etc/nginx/sites-enabled/default >> "$LOG_FILE" 2>&1
    fi
}

################################################################################
# STEP 6: INSTALLAZIONE PM2
################################################################################

step_6_install_pm2() {
    separator "STEP 6: Installazione PM2"
    
    if command -v pm2 &> /dev/null; then
        log_warning "PM2 già installato"
        PM2_VERSION=$(pm2 --version)
        log_info "Versione PM2: $PM2_VERSION"
        return
    fi
    
    log_info "Installazione PM2 globalmente..."
    npm install -g pm2 >> "$LOG_FILE" 2>&1
    
    # Verifica
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

################################################################################
# STEP 7: CLONE REPOSITORY E SETUP BACKEND
################################################################################

step_7_setup_backend() {
    separator "STEP 7: Setup Backend"
    
    # Clone repository
    if [ -d "$APP_DIR" ]; then
        log_warning "Directory $APP_DIR già esistente"
        read -p "Vuoi eliminarla e riclonare il repository? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Rimozione directory esistente..."
            rm -rf "$APP_DIR"
        else
            log_info "Uso directory esistente"
        fi
    fi
    
    if [ ! -d "$APP_DIR" ]; then
        log_info "Clone repository da GitHub..."
        git clone -b "$GITHUB_BRANCH" "$GITHUB_REPO" "$APP_DIR" >> "$LOG_FILE" 2>&1
        log_success "Repository clonato in $APP_DIR"
    fi
    
    cd "$APP_DIR/backend"
    
    # Installazione dipendenze
    log_info "Installazione dipendenze backend (può richiedere qualche minuto)..."
    npm install --production >> "$LOG_FILE" 2>&1
    log_success "Dipendenze backend installate"
    
    # Creazione file .env
    log_info "Creazione file .env backend..."
    
    cat > .env << EOF
# Environment
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# JWT Secrets
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://$CONTAINER_IP
ALLOWED_ORIGINS=http://$CONTAINER_IP,http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760

# Logging
LOG_LEVEL=info
EOF
    
    log_success "File .env backend creato"
    
    # Migrazioni database
    log_info "Esecuzione migrazioni database..."
    npm run migrate >> "$LOG_FILE" 2>&1
    log_success "Migrazioni database completate"
    
    # Seed database
    log_info "Popolamento database con dati iniziali..."
    npm run seed >> "$LOG_FILE" 2>&1
    log_success "Database popolato con dati iniziali"
    
    log_success "Backend setup completato"
}

################################################################################
# STEP 8: BUILD E SETUP FRONTEND
################################################################################

step_8_setup_frontend() {
    separator "STEP 8: Setup Frontend"
    
    cd "$APP_DIR/frontend"
    
    # Installazione dipendenze
    log_info "Installazione dipendenze frontend (può richiedere qualche minuto)..."
    npm install >> "$LOG_FILE" 2>&1
    log_success "Dipendenze frontend installate"
    
    # Creazione file .env
    log_info "Creazione file .env frontend..."
    
    cat > .env << EOF
VITE_API_URL=http://$CONTAINER_IP:3000/api
VITE_APP_NAME=Dashboard Procedure Operative
EOF
    
    log_success "File .env frontend creato"
    
    # Build production
    log_info "Build production frontend (può richiedere qualche minuto)..."
    npm run build >> "$LOG_FILE" 2>&1
    log_success "Build frontend completata"
    
    # Creazione directory Nginx e copia build
    log_info "Copia build in directory Nginx..."
    mkdir -p "$NGINX_DIR"
    cp -r dist/* "$NGINX_DIR/"
    chown -R www-data:www-data "$NGINX_DIR"
    
    log_success "Frontend setup completato"
}

################################################################################
# STEP 9: CONFIGURAZIONE NGINX
################################################################################

step_9_configure_nginx() {
    separator "STEP 9: Configurazione Nginx"
    
    log_info "Creazione configurazione Nginx..."
    
    cat > /etc/nginx/sites-available/dashboard << EOF
# Frontend
server {
    listen 80;
    server_name $CONTAINER_IP;
    root $NGINX_DIR;
    index index.html;

    # React Router - Tutte le route a index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Static assets con cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}

# Backend API - Reverse proxy
server {
    listen 3000;
    server_name $CONTAINER_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # CORS headers
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;

        if (\$request_method = OPTIONS) {
            return 204;
        }
    }
}
EOF
    
    log_success "Configurazione Nginx creata"
    
    # Attiva configurazione
    log_info "Attivazione configurazione Nginx..."
    ln -sf /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
    
    # Test configurazione
    log_info "Test configurazione Nginx..."
    if nginx -t >> "$LOG_FILE" 2>&1; then
        log_success "Configurazione Nginx valida"
    else
        log_error "Errore nella configurazione Nginx"
        nginx -t
        exit 1
    fi
    
    # Reload Nginx
    log_info "Reload Nginx..."
    systemctl reload nginx >> "$LOG_FILE" 2>&1
    log_success "Nginx ricaricato"
}

################################################################################
# STEP 10: AVVIO BACKEND CON PM2
################################################################################

step_10_start_backend() {
    separator "STEP 10: Avvio Backend con PM2"
    
    cd "$APP_DIR/backend"
    
    # Stop processi PM2 esistenti
    log_info "Stop eventuali processi PM2 esistenti..."
    pm2 stop dashboard-api 2>/dev/null || true
    pm2 delete dashboard-api 2>/dev/null || true
    
    # Avvio con PM2
    log_info "Avvio backend con PM2..."
    pm2 start ecosystem.config.js >> "$LOG_FILE" 2>&1
    
    # Salva configurazione PM2
    log_info "Salvataggio configurazione PM2..."
    pm2 save >> "$LOG_FILE" 2>&1
    
    # Wait for backend to start
    log_info "Attesa avvio backend (5 secondi)..."
    sleep 5
    
    # Verifica stato PM2
    log_info "Verifica stato backend..."
    pm2 list
    
    if pm2 show dashboard-api &> /dev/null; then
        log_success "Backend avviato con PM2"
    else
        log_error "Errore avvio backend"
        pm2 logs dashboard-api --lines 50
        exit 1
    fi
}

################################################################################
# STEP 11: CONFIGURAZIONE FIREWALL (UFW)
################################################################################

step_11_configure_firewall() {
    separator "STEP 11: Configurazione Firewall"
    
    log_info "Configurazione UFW..."
    
    # Reset UFW (se già configurato)
    ufw --force reset >> "$LOG_FILE" 2>&1
    
    # Regole firewall
    ufw default deny incoming >> "$LOG_FILE" 2>&1
    ufw default allow outgoing >> "$LOG_FILE" 2>&1
    
    log_info "Apertura porte necessarie..."
    ufw allow 22/tcp comment 'SSH' >> "$LOG_FILE" 2>&1
    ufw allow 80/tcp comment 'HTTP' >> "$LOG_FILE" 2>&1
    ufw allow 443/tcp comment 'HTTPS' >> "$LOG_FILE" 2>&1
    
    # Abilita UFW
    log_info "Abilitazione firewall..."
    ufw --force enable >> "$LOG_FILE" 2>&1
    
    log_success "Firewall configurato"
    ufw status verbose
}

################################################################################
# STEP 12: CONFIGURAZIONE BACKUP AUTOMATICI
################################################################################

step_12_configure_backup() {
    separator "STEP 12: Configurazione Backup Automatici"
    
    # Creazione directory backup
    log_info "Creazione directory backup..."
    mkdir -p "$BACKUP_DIR"
    
    # Script backup database
    log_info "Creazione script backup database..."
    cat > /usr/local/bin/backup-dashboard-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DB_NAME="dashboard_db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/dashboard_db_$TIMESTAMP.sql.gz"

# Backup
sudo -u postgres pg_dump $DB_NAME | gzip > $BACKUP_FILE

# Retention: mantieni backup ultimi 30 giorni
find $BACKUP_DIR -name "dashboard_db_*.sql.gz" -mtime +30 -delete

echo "Backup completato: $BACKUP_FILE"
EOF
    
    chmod +x /usr/local/bin/backup-dashboard-db.sh
    
    # Script backup uploads
    cat > /usr/local/bin/backup-dashboard-uploads.sh << EOF
#!/bin/bash
BACKUP_DIR="$BACKUP_DIR"
UPLOADS_DIR="$APP_DIR/backend/src/uploads"
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="\$BACKUP_DIR/dashboard_uploads_\$TIMESTAMP.tar.gz"

# Backup
tar -czf \$BACKUP_FILE \$UPLOADS_DIR

# Retention: mantieni backup ultimi 30 giorni
find \$BACKUP_DIR -name "dashboard_uploads_*.tar.gz" -mtime +30 -delete

echo "Backup completato: \$BACKUP_FILE"
EOF
    
    chmod +x /usr/local/bin/backup-dashboard-uploads.sh
    
    # Cron job per backup giornaliero
    log_info "Configurazione cron job backup..."
    
    # Backup DB: ogni giorno alle 2:00 AM
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-dashboard-db.sh >> /var/log/backup-db.log 2>&1") | crontab -
    
    # Backup uploads: ogni domenica alle 3:00 AM
    (crontab -l 2>/dev/null; echo "0 3 * * 0 /usr/local/bin/backup-dashboard-uploads.sh >> /var/log/backup-uploads.log 2>&1") | crontab -
    
    log_success "Backup automatici configurati"
    crontab -l
}

################################################################################
# STEP 13: TEST DEPLOYMENT
################################################################################

step_13_test_deployment() {
    separator "STEP 13: Test Deployment"
    
    # Test backend health
    log_info "Test backend health endpoint..."
    sleep 3
    
    HEALTH_RESPONSE=$(curl -s http://localhost:3000/health || echo "ERROR")
    
    if echo "$HEALTH_RESPONSE" | grep -q "OK"; then
        log_success "Backend health check: OK"
        echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
    else
        log_error "Backend health check: FAILED"
        echo "Response: $HEALTH_RESPONSE"
    fi
    
    # Test backend API
    log_info "Test backend API endpoint..."
    API_RESPONSE=$(curl -s http://localhost:3000/api || echo "ERROR")
    
    if echo "$API_RESPONSE" | grep -q "Dashboard"; then
        log_success "Backend API: OK"
    else
        log_error "Backend API: FAILED"
    fi
    
    # Test frontend
    log_info "Test frontend..."
    FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
    
    if [ "$FRONTEND_RESPONSE" = "200" ]; then
        log_success "Frontend: OK (HTTP $FRONTEND_RESPONSE)"
    else
        log_error "Frontend: FAILED (HTTP $FRONTEND_RESPONSE)"
    fi
    
    # Test Nginx
    log_info "Test Nginx status..."
    if systemctl is-active --quiet nginx; then
        log_success "Nginx: ACTIVE"
    else
        log_error "Nginx: INACTIVE"
    fi
    
    # Test PostgreSQL
    log_info "Test PostgreSQL..."
    if systemctl is-active --quiet postgresql; then
        log_success "PostgreSQL: ACTIVE"
    else
        log_error "PostgreSQL: INACTIVE"
    fi
    
    # Test PM2
    log_info "Test PM2 process..."
    if pm2 show dashboard-api &> /dev/null; then
        log_success "PM2 Process: RUNNING"
        pm2 info dashboard-api | grep -E "status|uptime|restarts"
    else
        log_error "PM2 Process: NOT RUNNING"
    fi
}

################################################################################
# STEP 14: GENERAZIONE REPORT FINALE
################################################################################

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
CONFIGURAZIONE
================================================================================

Application Directory: $APP_DIR
Nginx Directory: $NGINX_DIR
Backup Directory: $BACKUP_DIR

Database Name: $DB_NAME
Database User: $DB_USER
Database Password: $DB_PASSWORD

JWT Secret: $JWT_SECRET
JWT Refresh Secret: $JWT_REFRESH_SECRET

================================================================================
VERSIONI INSTALLATE
================================================================================

Node.js: $(node --version)
npm: $(npm --version)
PostgreSQL: $(psql --version | awk '{print $3}')
Nginx: $(nginx -v 2>&1 | awk '{print $3}')
PM2: $(pm2 --version)

================================================================================
SERVIZI
================================================================================

PostgreSQL: $(systemctl is-active postgresql)
Nginx: $(systemctl is-active nginx)
PM2: $(pm2 list | grep dashboard-api | awk '{print $12}')

================================================================================
URLs ACCESSO
================================================================================

Frontend:        http://$CONTAINER_IP
Backend API:     http://$CONTAINER_IP:3000/api
Health Check:    http://$CONTAINER_IP:3000/health
API Docs:        http://$CONTAINER_IP:3000/api

================================================================================
CREDENZIALI DEFAULT
================================================================================

Username: admin
Password: admin123
Role: Administrator

⚠️  IMPORTANTE: Cambia la password admin al primo login!

================================================================================
COMANDI UTILI
================================================================================

# PM2
pm2 status                  # Stato applicazione
pm2 logs                    # View logs
pm2 restart dashboard-api   # Restart backend
pm2 monit                   # Monitoring

# Nginx
systemctl status nginx      # Stato Nginx
systemctl reload nginx      # Reload config
nginx -t                    # Test config

# PostgreSQL
systemctl status postgresql # Stato database
sudo -u postgres psql -d $DB_NAME  # Accesso database

# Backup
/usr/local/bin/backup-dashboard-db.sh       # Backup manuale DB
/usr/local/bin/backup-dashboard-uploads.sh  # Backup manuale uploads
ls -lh $BACKUP_DIR                          # Lista backup

# Logs
tail -f /var/log/nginx/access.log           # Nginx access log
tail -f /var/log/nginx/error.log            # Nginx error log
pm2 logs dashboard-api                      # Backend logs
cat $LOG_FILE                               # Deployment log

================================================================================
FIREWALL (UFW)
================================================================================

$(ufw status verbose)

================================================================================
CRON JOBS (Backup Automatici)
================================================================================

$(crontab -l)

================================================================================
NEXT STEPS
================================================================================

1. Accedi all'applicazione: http://$CONTAINER_IP
2. Login con credenziali admin (vedi sopra)
3. Cambia password admin dal profilo
4. Configura SSL con Let's Encrypt (opzionale):
   
   apt install certbot python3-certbot-nginx
   certbot --nginx -d yourdomain.com

5. Configura dominio DNS (opzionale):
   - Punta il dominio a $CONTAINER_IP
   - Aggiorna ALLOWED_ORIGINS in backend/.env
   - Riavvia backend: pm2 restart dashboard-api

================================================================================
SUPPORTO
================================================================================

Documentazione: $APP_DIR/README.md
Log Deployment: $LOG_FILE
Report: $REPORT_FILE

GitHub: https://github.com/turiliffiu/dashboard-nodejs
Email: support@tgs.ovh

================================================================================
EOF
    
    # Mostra report
    cat "$REPORT_FILE"
    
    log_success "Report salvato in: $REPORT_FILE"
    
    # Salva anche configurazione sensibile in file protetto
    cat > /root/.dashboard-secrets << EOF
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
EOF
    chmod 600 /root/.dashboard-secrets
    
    log_success "Secrets salvati in: /root/.dashboard-secrets (chmod 600)"
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    clear
    
    cat << "EOF"
    
    ██████╗  █████╗ ███████╗██╗  ██╗██████╗  ██████╗  █████╗ ██████╗ ██████╗ 
    ██╔══██╗██╔══██╗██╔════╝██║  ██║██╔══██╗██╔═══██╗██╔══██╗██╔══██╗██╔══██╗
    ██║  ██║███████║███████╗███████║██████╔╝██║   ██║███████║██████╔╝██║  ██║
    ██║  ██║██╔══██║╚════██║██╔══██║██╔══██╗██║   ██║██╔══██║██╔══██╗██║  ██║
    ██████╔╝██║  ██║███████║██║  ██║██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝
    ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ 
    
    AUTOMATED DEPLOYMENT SCRIPT
    Node.js + React + PostgreSQL + Nginx + PM2
    
EOF
    
    echo ""
    log_info "Inizio deployment automatico..."
    echo ""
    
    # Execution time tracking
    START_TIME=$(date +%s)
    
    # Execute all steps
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
    
    # Calculate execution time
    END_TIME=$(date +%s)
    EXECUTION_TIME=$((END_TIME - START_TIME))
    MINUTES=$((EXECUTION_TIME / 60))
    SECONDS=$((EXECUTION_TIME % 60))
    
    separator "DEPLOYMENT COMPLETATO!"
    
    log_success "Tempo totale: ${MINUTES}m ${SECONDS}s"
    echo ""
    log_success "Dashboard disponibile su: http://$CONTAINER_IP"
    log_success "Backend API: http://$CONTAINER_IP:3000/api"
    echo ""
    log_info "Credenziali default:"
    echo "  Username: admin"
    echo "  Password: admin123"
    echo ""
    log_warning "⚠️  Cambia la password admin al primo login!"
    echo ""
    log_info "Report completo: /root/dashboard-deployment-report.txt"
    log_info "Log deployment: $LOG_FILE"
    log_info "Configurazione: /tmp/deployment_config.env"
    echo ""
    
    separator "ENJOY YOUR DASHBOARD! 🚀"
}

# Run main function
main "$@"
