#!/bin/bash
################################################################################
# DASHBOARD UPDATE SCRIPT
# 
# Script per aggiornare l'applicazione Dashboard con la versione più recente
# da GitHub
################################################################################

set -e

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configurazione
APP_DIR="/opt/dashboard-nodejs"
NGINX_DIR="/var/www/dashboard"
BACKUP_DIR="/opt/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo ""
echo "=========================================="
echo "  DASHBOARD UPDATE SCRIPT"
echo "=========================================="
echo ""

# Verifica root
if [ "$EUID" -ne 0 ]; then 
    log_error "Questo script deve essere eseguito come root"
    exit 1
fi

# Backup pre-update
log_info "Creazione backup pre-update..."
mkdir -p "$BACKUP_DIR/pre-update-$TIMESTAMP"

# Backup database
log_info "Backup database..."
sudo -u postgres pg_dump dashboard_db | gzip > "$BACKUP_DIR/pre-update-$TIMESTAMP/database.sql.gz"

# Backup uploads
log_info "Backup uploads..."
if [ -d "$APP_DIR/backend/src/uploads" ]; then
    tar -czf "$BACKUP_DIR/pre-update-$TIMESTAMP/uploads.tar.gz" "$APP_DIR/backend/src/uploads"
fi

# Backup .env files
log_info "Backup configurazioni..."
cp "$APP_DIR/backend/.env" "$BACKUP_DIR/pre-update-$TIMESTAMP/backend.env"
cp "$APP_DIR/frontend/.env" "$BACKUP_DIR/pre-update-$TIMESTAMP/frontend.env" 2>/dev/null || true

log_success "Backup completato in: $BACKUP_DIR/pre-update-$TIMESTAMP"

# Stop backend
log_info "Stop backend PM2..."
pm2 stop dashboard-api

# Pull latest changes
log_info "Pull latest changes from GitHub..."
cd "$APP_DIR"
git fetch origin
git pull origin main

# Backend update
log_info "Update backend..."
cd "$APP_DIR/backend"
npm install --production

# Run migrations (se presenti)
log_info "Esecuzione migrations..."
npm run migrate 2>/dev/null || log_warning "Nessuna nuova migration"

# Frontend rebuild
log_info "Rebuild frontend..."
cd "$APP_DIR/frontend"
npm install
npm run build

# Copy new build
log_info "Deploy nuovo frontend..."
rm -rf "$NGINX_DIR/*"
cp -r dist/* "$NGINX_DIR/"
chown -R www-data:www-data "$NGINX_DIR"

# Restart services
log_info "Restart backend..."
cd "$APP_DIR/backend"
pm2 restart dashboard-api

log_info "Reload Nginx..."
nginx -t && systemctl reload nginx

# Wait for backend
sleep 3

# Test health
log_info "Test health endpoint..."
HEALTH=$(curl -s http://localhost:3000/health | grep -o "OK" || echo "FAIL")

if [ "$HEALTH" = "OK" ]; then
    log_success "Update completato con successo!"
    log_info "Backend: ONLINE"
    log_info "Frontend: UPDATED"
else
    log_error "Backend non risponde correttamente!"
    log_warning "Rollback manuale potrebbe essere necessario"
    log_info "Backup disponibile in: $BACKUP_DIR/pre-update-$TIMESTAMP"
    exit 1
fi

echo ""
log_success "Dashboard aggiornata alla versione più recente"
echo ""

# Show version info
cd "$APP_DIR"
COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_DATE=$(git log -1 --format=%cd --date=short)
COMMIT_MSG=$(git log -1 --format=%s)

echo "Versione corrente:"
echo "  Commit: $COMMIT_HASH"
echo "  Data: $COMMIT_DATE"
echo "  Messaggio: $COMMIT_MSG"
echo ""

log_info "PM2 status:"
pm2 list

echo ""
log_info "Test l'applicazione su: http://$(hostname -I | awk '{print $1}')"
echo ""
