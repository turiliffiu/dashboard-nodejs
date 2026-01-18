# ⚙️ DEPLOYMENT CONFIGURATION

Questo file contiene tutte le variabili personalizzabili per il deployment.
Modifica i valori prima di eseguire `deploy.sh` se necessario.

---

## 🔧 COME PERSONALIZZARE

### Opzione 1: Modifica Variabili in deploy.sh (Permanente)

```bash
nano deploy.sh

# Cerca la sezione "CONFIGURAZIONE" (circa linea 80)
# Modifica i valori desiderati
```

### Opzione 2: Export Variabili d'Ambiente (Temporaneo)

```bash
# Prima di eseguire deploy.sh
export APP_NAME="my-dashboard"
export DB_NAME="my_dashboard_db"
export GITHUB_REPO="https://github.com/myuser/my-fork.git"

# Esegui deployment
bash deploy.sh
```

---

## 📋 VARIABILI DISPONIBILI

### 🏢 Applicazione

```bash
# Nome applicazione (usato per directory, PM2, etc.)
APP_NAME="dashboard"
# Default: "dashboard"
# Esempio: "dashboard-prod", "dashboard-staging"

# Utente applicazione (non usato, app gira come root)
APP_USER="dashboard"
# Default: "dashboard"

# Directory principale applicazione
APP_DIR="/opt/dashboard-nodejs"
# Default: "/opt/dashboard-nodejs"
# Esempio: "/var/www/dashboard", "/home/apps/dashboard"

# Directory Nginx per frontend
NGINX_DIR="/var/www/dashboard"
# Default: "/var/www/dashboard"

# Directory backup
BACKUP_DIR="/opt/backups"
# Default: "/opt/backups"
# Esempio: "/mnt/nas/backups", "/backup/dashboard"

# File log deployment
LOG_FILE="/var/log/dashboard-deployment.log"
# Default: "/var/log/dashboard-deployment.log"
```

### 🗄️ Database

```bash
# Nome database
DB_NAME="dashboard_db"
# Default: "dashboard_db"
# Esempio: "dashboard_prod", "procedures_db"

# Nome utente database
DB_USER="dashboard_user"
# Default: "dashboard_user"
# Esempio: "dashboard_admin"

# Password database (auto-generata se non specificata)
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
# Default: Auto-generata 25 caratteri
# Esempio: "MySecurePassword123!"
# ⚠️ Imposta manualmente solo per test, usa auto-gen in produzione

# Host database
DB_HOST="localhost"
# Default: "localhost"
# Esempio: "192.168.1.50" per DB remoto

# Porta database
DB_PORT="5432"
# Default: "5432"
```

### 🔐 Security (JWT)

```bash
# JWT Secret per access token
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
# Default: Auto-generato 64 caratteri
# ⚠️ NON impostare manualmente, usa auto-gen

# JWT Refresh Secret
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
# Default: Auto-generato 64 caratteri

# JWT Access Token Lifetime
JWT_EXPIRES_IN="15m"
# Default: "15m" (15 minuti)
# Valori: "5m", "10m", "15m", "30m", "1h"

# JWT Refresh Token Lifetime
JWT_REFRESH_EXPIRES_IN="7d"
# Default: "7d" (7 giorni)
# Valori: "1d", "7d", "14d", "30d"
```

### 🌐 Network & CORS

```bash
# Backend port
PORT="3000"
# Default: 3000
# Esempio: 8080, 5000

# Host binding
HOST="0.0.0.0"
# Default: "0.0.0.0" (tutte le interfacce)
# Esempio: "127.0.0.1" (solo locale)

# Frontend URL (per CORS)
FRONTEND_URL="http://$CONTAINER_IP"
# Default: Auto-rilevato da container IP
# Esempio: "https://dashboard.example.com"

# Allowed origins (per CORS)
ALLOWED_ORIGINS="http://$CONTAINER_IP,http://localhost:5173"
# Default: Container IP + localhost dev
# Esempio: "https://dashboard.com,https://api.dashboard.com"
```

### 🔄 Rate Limiting

```bash
# Finestra rate limit (millisecondi)
RATE_LIMIT_WINDOW_MS="900000"
# Default: 900000 (15 minuti)
# Esempio: 600000 (10min), 1800000 (30min)

# Max richieste per finestra
RATE_LIMIT_MAX_REQUESTS="100"
# Default: 100 richieste/15min
# Esempio: 50 (restrittivo), 200 (permissivo)

# Rate limit AUTH (più restrittivo)
AUTH_RATE_LIMIT_MAX="5"
# Default: 5 tentativi/15min
# Esempio: 3 (molto restrittivo), 10 (permissivo)
```

### 📁 File Upload

```bash
# Dimensione massima file upload (bytes)
MAX_FILE_SIZE="10485760"
# Default: 10485760 (10 MB)
# Esempio: 5242880 (5MB), 20971520 (20MB)

# Tipi file consentiti
ALLOWED_FILE_TYPES=".txt,.md"
# Default: ".txt,.md"
# Esempio: ".txt,.md,.pdf,.doc,.docx"
```

### 🔍 GitHub Repository

```bash
# URL repository GitHub
GITHUB_REPO="https://github.com/turiliffiu/dashboard-nodejs.git"
# Default: Repository ufficiale
# Esempio: "https://github.com/youruser/your-fork.git"

# Branch da deployare
GITHUB_BRANCH="main"
# Default: "main"
# Esempio: "develop", "production", "v2.0"
```

### 📊 Logging

```bash
# Log level
LOG_LEVEL="info"
# Default: "info"
# Valori: "error", "warn", "info", "debug", "verbose"

# Enable console logging
LOG_TO_CONSOLE="true"
# Default: true (development), false (production)

# Log file rotation (PM2)
LOG_MAX_SIZE="10M"
# Default: 10M
# Esempio: "5M", "20M", "100M"

LOG_RETENTION_DAYS="30"
# Default: 30 giorni
```

### 🔥 Firewall (UFW)

```bash
# Porte da aprire
UFW_SSH_PORT="22"
# Default: 22

UFW_HTTP_PORT="80"
# Default: 80

UFW_HTTPS_PORT="443"
# Default: 443

# Porte custom (opzionale)
UFW_CUSTOM_PORTS=""
# Esempio: "8080,8443,9000"
```

### 📧 Email Notifications (Health Check)

```bash
# Email per alert (health-check.sh)
ALERT_EMAIL="support@tgs.ovh"
# Default: support@tgs.ovh
# Esempio: "admin@example.com"

# Abilita notifiche email
SEND_EMAIL="false"
# Default: false
# Imposta a "true" per abilitare
# Richiede: mailutils configurato
```

### ⏰ Backup Scheduling

```bash
# Orario backup database (cron format)
DB_BACKUP_SCHEDULE="0 2 * * *"
# Default: "0 2 * * *" (ogni giorno alle 2:00 AM)
# Esempio: "0 3 * * *" (3:00 AM), "0 0 * * 0" (domenica mezzanotte)

# Orario backup uploads
UPLOADS_BACKUP_SCHEDULE="0 3 * * 0"
# Default: "0 3 * * 0" (domenica 3:00 AM)

# Retention backup (giorni)
BACKUP_RETENTION_DAYS="30"
# Default: 30 giorni
# Esempio: 7, 14, 60, 90
```

---

## 🎯 ESEMPI CONFIGURAZIONI

### Configurazione Sviluppo (Development)

```bash
# Environment
NODE_ENV="development"

# Network
PORT="3000"
FRONTEND_URL="http://localhost:5173"
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"

# JWT (token più lunghi per dev)
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="30d"

# Rate Limiting (più permissivo)
RATE_LIMIT_MAX_REQUESTS="1000"
AUTH_RATE_LIMIT_MAX="50"

# Logging (verbose)
LOG_LEVEL="debug"
LOG_TO_CONSOLE="true"

# File Upload (più grande per test)
MAX_FILE_SIZE="52428800"  # 50MB
```

### Configurazione Staging

```bash
# Environment
NODE_ENV="staging"

# Network
PORT="3000"
FRONTEND_URL="http://staging.dashboard.example.com"
ALLOWED_ORIGINS="http://staging.dashboard.example.com"

# JWT (simile a prod)
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Rate Limiting (medio)
RATE_LIMIT_MAX_REQUESTS="200"
AUTH_RATE_LIMIT_MAX="10"

# Logging
LOG_LEVEL="info"

# Backup (meno frequenti)
DB_BACKUP_SCHEDULE="0 4 * * *"  # 4:00 AM
BACKUP_RETENTION_DAYS="14"
```

### Configurazione Produzione (Default)

```bash
# Environment
NODE_ENV="production"

# Network
PORT="3000"
FRONTEND_URL="http://dashboard.example.com"
ALLOWED_ORIGINS="http://dashboard.example.com,https://dashboard.example.com"

# JWT (default sicuri)
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Rate Limiting (restrittivo)
RATE_LIMIT_MAX_REQUESTS="100"
AUTH_RATE_LIMIT_MAX="5"

# Logging
LOG_LEVEL="info"
LOG_TO_CONSOLE="false"

# File Upload
MAX_FILE_SIZE="10485760"  # 10MB

# Backup
DB_BACKUP_SCHEDULE="0 2 * * *"  # 2:00 AM daily
UPLOADS_BACKUP_SCHEDULE="0 3 * * 0"  # Domenica 3:00 AM
BACKUP_RETENTION_DAYS="30"

# Email alerts (abilitati)
SEND_EMAIL="true"
ALERT_EMAIL="admin@example.com"
```

---

## ⚠️ VARIABILI CRITICHE (NON MODIFICARE)

Queste variabili sono gestite automaticamente dallo script:

```bash
# IP Container (auto-rilevato)
CONTAINER_IP=$(hostname -I | awk '{print $1}')

# Hostname (auto-rilevato)
CONTAINER_HOSTNAME=$(hostname)

# Secrets (auto-generati)
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

# Timestamp deployment
DEPLOYMENT_DATE=$(date +%Y%m%d_%H%M%S)
```

**⚠️ NON modificare questi valori manualmente!**

---

## 🔒 BEST PRACTICES

### Security
- ✅ Usa secrets auto-generati (NON hard-code)
- ✅ Cambia password admin dopo primo login
- ✅ Limita CORS agli origins necessari
- ✅ Abilita firewall (UFW)
- ✅ Configura SSL in produzione
- ✅ Usa rate limiting appropriato per ambiente

### Performance
- ✅ Regola RAM container in base a carico
- ✅ Ottimizza retention backup per spazio disco
- ✅ Monitora log size (log rotation)
- ✅ Usa CDN per static files in produzione

### Reliability
- ✅ Test backup/restore regolarmente
- ✅ Configura monitoring (health-check.sh)
- ✅ Setup alert email per problemi critici
- ✅ Documenta ogni modifica configurazione
- ✅ Mantieni backup configurazione esternamente

---

## 📝 TEMPLATE .env FILE

Dopo il deployment, troverai questi file `.env`:

### Backend (.env)
```bash
/opt/dashboard-nodejs/backend/.env
```

Contiene:
- NODE_ENV
- PORT, HOST
- DATABASE_URL completo
- DB_* variabili
- JWT_SECRET, JWT_REFRESH_SECRET
- FRONTEND_URL, ALLOWED_ORIGINS
- RATE_LIMIT_*
- MAX_FILE_SIZE
- LOG_LEVEL

### Frontend (.env)
```bash
/opt/dashboard-nodejs/frontend/.env
```

Contiene:
- VITE_API_URL
- VITE_APP_NAME

---

## 🛠️ COME MODIFICARE POST-DEPLOYMENT

### Modifica Configurazione Backend

```bash
# 1. Edit .env
nano /opt/dashboard-nodejs/backend/.env

# 2. Restart backend
pm2 restart dashboard-api

# 3. Verifica
pm2 logs dashboard-api
curl http://localhost:3000/health
```

### Modifica Configurazione Frontend

```bash
# 1. Edit .env
nano /opt/dashboard-nodejs/frontend/.env

# 2. Rebuild
cd /opt/dashboard-nodejs/frontend
npm run build

# 3. Deploy
rm -rf /var/www/dashboard/*
cp -r dist/* /var/www/dashboard/

# 4. Verifica
curl http://localhost/
```

### Modifica Nginx Config

```bash
# 1. Edit config
nano /etc/nginx/sites-available/dashboard

# 2. Test
nginx -t

# 3. Reload
systemctl reload nginx

# 4. Verifica
systemctl status nginx
```

---

## 📞 SUPPORTO

Se hai dubbi su quali variabili modificare per il tuo caso d'uso:

1. Consulta `SCRIPT_README.md` per dettagli
2. Leggi `QUICK_START.md` per esempi pratici
3. Apri issue su GitHub con il tuo scenario
4. Email: support@tgs.ovh

---

**⚙️ Buona configurazione!**
