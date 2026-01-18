#!/bin/bash
################################################################################
# DASHBOARD ROLLBACK SCRIPT
# 
# Script per ripristinare un backup precedente dell'applicazione
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
BACKUP_DIR="/opt/backups"
APP_DIR="/opt/dashboard-nodejs"

echo ""
echo "=========================================="
echo "  DASHBOARD ROLLBACK SCRIPT"
echo "=========================================="
echo ""

# Verifica root
if [ "$EUID" -ne 0 ]; then 
    log_error "Questo script deve essere eseguito come root"
    exit 1
fi

# Lista backup disponibili
log_info "Backup disponibili:"
echo ""
ls -lht "$BACKUP_DIR" | grep "^d" | awk '{print $9}' | nl
echo ""

# Selezione backup
read -p "Seleziona il numero del backup da ripristinare (o 'q' per uscire): " BACKUP_NUM

if [ "$BACKUP_NUM" = "q" ]; then
    log_info "Rollback annullato"
    exit 0
fi

BACKUP_NAME=$(ls -t "$BACKUP_DIR" | grep "^pre-update-" | sed -n "${BACKUP_NUM}p")

if [ -z "$BACKUP_NAME" ]; then
    log_error "Backup non valido"
    exit 1
fi

BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

log_warning "ATTENZIONE: Stai per ripristinare il backup: $BACKUP_NAME"
read -p "Continuare? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Rollback annullato"
    exit 0
fi

# Stop backend
log_info "Stop backend..."
pm2 stop dashboard-api

# Restore database
if [ -f "$BACKUP_PATH/database.sql.gz" ]; then
    log_info "Restore database..."
    read -p "Confermi restore database? Tutti i dati attuali saranno PERSI! (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Drop e ricrea database
        sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS dashboard_db;
CREATE DATABASE dashboard_db;
GRANT ALL PRIVILEGES ON DATABASE dashboard_db TO dashboard_user;
ALTER DATABASE dashboard_db OWNER TO dashboard_user;
EOF
        
        # Restore
        gunzip -c "$BACKUP_PATH/database.sql.gz" | sudo -u postgres psql dashboard_db
        log_success "Database ripristinato"
    else
        log_warning "Restore database saltato"
    fi
fi

# Restore uploads
if [ -f "$BACKUP_PATH/uploads.tar.gz" ]; then
    log_info "Restore uploads..."
    rm -rf "$APP_DIR/backend/src/uploads"
    tar -xzf "$BACKUP_PATH/uploads.tar.gz" -C /
    log_success "Uploads ripristinati"
fi

# Restore .env files
if [ -f "$BACKUP_PATH/backend.env" ]; then
    log_info "Restore configurazioni..."
    cp "$BACKUP_PATH/backend.env" "$APP_DIR/backend/.env"
    [ -f "$BACKUP_PATH/frontend.env" ] && cp "$BACKUP_PATH/frontend.env" "$APP_DIR/frontend/.env"
    log_success "Configurazioni ripristinate"
fi

# Restart backend
log_info "Restart backend..."
pm2 restart dashboard-api

sleep 3

# Test
log_info "Test applicazione..."
HEALTH=$(curl -s http://localhost:3000/health | grep -o "OK" || echo "FAIL")

if [ "$HEALTH" = "OK" ]; then
    log_success "Rollback completato con successo!"
else
    log_error "Problemi dopo il rollback. Controlla i log."
    pm2 logs dashboard-api --lines 50
fi

echo ""
log_success "Rollback al backup: $BACKUP_NAME"
echo ""
