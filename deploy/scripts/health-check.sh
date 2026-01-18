#!/bin/bash
################################################################################
# DASHBOARD HEALTH CHECK SCRIPT
# 
# Script per verificare lo stato dell'applicazione e dei servizi
# Può essere usato come cron job per monitoraggio automatico
################################################################################

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurazione
LOG_FILE="/var/log/dashboard-health.log"
ALERT_EMAIL="support@tgs.ovh"
SEND_EMAIL=false  # Imposta a true per abilitare notifiche email

# Funzioni
log_check() {
    local status=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [ "$status" = "OK" ]; then
        echo -e "${GREEN}✓${NC} $message"
        echo "[$timestamp] OK - $message" >> "$LOG_FILE"
    else
        echo -e "${RED}✗${NC} $message"
        echo "[$timestamp] FAIL - $message" >> "$LOG_FILE"
    fi
}

send_alert() {
    local message=$1
    if [ "$SEND_EMAIL" = true ]; then
        echo "$message" | mail -s "Dashboard Alert" "$ALERT_EMAIL"
    fi
}

# Header
echo ""
echo "=========================================="
echo "  DASHBOARD HEALTH CHECK"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
echo ""

OVERALL_STATUS="OK"

# 1. Check PostgreSQL
echo "1. PostgreSQL Database"
if systemctl is-active --quiet postgresql; then
    log_check "OK" "PostgreSQL service is running"
    
    # Test database connection
    if PGPASSWORD=$(grep DB_PASSWORD /opt/dashboard-nodejs/backend/.env | cut -d'=' -f2) \
       psql -h localhost -U dashboard_user -d dashboard_db -c "SELECT 1;" > /dev/null 2>&1; then
        log_check "OK" "Database connection successful"
    else
        log_check "FAIL" "Database connection failed"
        OVERALL_STATUS="FAIL"
    fi
else
    log_check "FAIL" "PostgreSQL service is NOT running"
    OVERALL_STATUS="FAIL"
    send_alert "PostgreSQL is down!"
fi

echo ""

# 2. Check Nginx
echo "2. Nginx Web Server"
if systemctl is-active --quiet nginx; then
    log_check "OK" "Nginx service is running"
    
    # Test Nginx config
    if nginx -t > /dev/null 2>&1; then
        log_check "OK" "Nginx configuration is valid"
    else
        log_check "FAIL" "Nginx configuration has errors"
        OVERALL_STATUS="FAIL"
    fi
else
    log_check "FAIL" "Nginx service is NOT running"
    OVERALL_STATUS="FAIL"
    send_alert "Nginx is down!"
fi

echo ""

# 3. Check PM2 Backend
echo "3. Backend API (PM2)"
if pm2 show dashboard-api > /dev/null 2>&1; then
    STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="dashboard-api") | .pm2_env.status')
    
    if [ "$STATUS" = "online" ]; then
        log_check "OK" "Backend process is online"
        
        # Get uptime and restarts
        UPTIME=$(pm2 jlist | jq -r '.[] | select(.name=="dashboard-api") | .pm2_env.pm_uptime')
        RESTARTS=$(pm2 jlist | jq -r '.[] | select(.name=="dashboard-api") | .pm2_env.restart_time')
        
        UPTIME_HUMAN=$(date -d @$(($(date +%s) - UPTIME/1000)) '+%Y-%m-%d %H:%M:%S')
        echo "   Uptime since: $UPTIME_HUMAN"
        echo "   Restarts: $RESTARTS"
        
    else
        log_check "FAIL" "Backend process is $STATUS"
        OVERALL_STATUS="FAIL"
        send_alert "Backend API is down! Status: $STATUS"
    fi
else
    log_check "FAIL" "Backend process NOT found in PM2"
    OVERALL_STATUS="FAIL"
    send_alert "Backend API process not found!"
fi

echo ""

# 4. Check Backend Health Endpoint
echo "4. Backend API Health"
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null)

if [ "$HEALTH_RESPONSE" = "200" ]; then
    log_check "OK" "Health endpoint responding (HTTP 200)"
    
    # Get response time
    RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:3000/health)
    echo "   Response time: ${RESPONSE_TIME}s"
    
else
    log_check "FAIL" "Health endpoint failed (HTTP $HEALTH_RESPONSE)"
    OVERALL_STATUS="FAIL"
fi

echo ""

# 5. Check Frontend
echo "5. Frontend Application"
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null)

if [ "$FRONTEND_RESPONSE" = "200" ]; then
    log_check "OK" "Frontend responding (HTTP 200)"
else
    log_check "FAIL" "Frontend failed (HTTP $FRONTEND_RESPONSE)"
    OVERALL_STATUS="FAIL"
fi

echo ""

# 6. System Resources
echo "6. System Resources"

# Memory
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
if (( $(echo "$MEMORY_USAGE < 90" | bc -l) )); then
    log_check "OK" "Memory usage: ${MEMORY_USAGE}%"
else
    log_check "FAIL" "Memory usage HIGH: ${MEMORY_USAGE}%"
    OVERALL_STATUS="FAIL"
fi

# Disk
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$DISK_USAGE" -lt 90 ]; then
    log_check "OK" "Disk usage: ${DISK_USAGE}%"
else
    log_check "FAIL" "Disk usage HIGH: ${DISK_USAGE}%"
    OVERALL_STATUS="FAIL"
fi

# CPU Load
CPU_LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | tr -d ',')
echo "   CPU Load (1min): $CPU_LOAD"

echo ""

# 7. Check Backup
echo "7. Backup Status"
LAST_BACKUP=$(ls -t /opt/backups/dashboard_db_*.sql.gz 2>/dev/null | head -1)
if [ -n "$LAST_BACKUP" ]; then
    BACKUP_DATE=$(stat -c %y "$LAST_BACKUP" | cut -d' ' -f1)
    DAYS_OLD=$(( ($(date +%s) - $(date -d "$BACKUP_DATE" +%s)) / 86400 ))
    
    if [ "$DAYS_OLD" -le 1 ]; then
        log_check "OK" "Last backup: $BACKUP_DATE ($DAYS_OLD days old)"
    else
        log_check "FAIL" "Last backup is OLD: $BACKUP_DATE ($DAYS_OLD days old)"
        OVERALL_STATUS="FAIL"
    fi
else
    log_check "FAIL" "No backup found"
    OVERALL_STATUS="FAIL"
fi

echo ""

# 8. Network Connectivity
echo "8. Network Connectivity"
if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
    log_check "OK" "Internet connectivity"
else
    log_check "FAIL" "No internet connectivity"
    OVERALL_STATUS="FAIL"
fi

echo ""

# Summary
echo "=========================================="
if [ "$OVERALL_STATUS" = "OK" ]; then
    echo -e "${GREEN}OVERALL STATUS: ALL SYSTEMS OPERATIONAL${NC}"
else
    echo -e "${RED}OVERALL STATUS: SOME ISSUES DETECTED${NC}"
    echo "Check log file: $LOG_FILE"
fi
echo "=========================================="
echo ""

# Return appropriate exit code
if [ "$OVERALL_STATUS" = "OK" ]; then
    exit 0
else
    exit 1
fi
