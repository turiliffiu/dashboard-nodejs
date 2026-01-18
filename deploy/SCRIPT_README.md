# 🚀 DASHBOARD NODE.JS - SCRIPT DI DEPLOYMENT

Collezione di script bash per deployment e gestione automatizzata della Dashboard Node.js su container Proxmox.

---

## 📋 SCRIPT DISPONIBILI

### 1. `deploy.sh` - Deployment Automatico Completo

**Descrizione:** Script principale per deployment completo dell'applicazione da zero.

**Cosa fa:**
- ✅ Verifica prerequisiti e recupera IP container
- ✅ Aggiorna sistema e installa dipendenze base
- ✅ Installa Node.js 20.x
- ✅ Installa PostgreSQL 16.x
- ✅ Configura database e crea utente
- ✅ Installa Nginx
- ✅ Installa PM2
- ✅ Clone repository da GitHub
- ✅ Setup backend (npm install, migrations, seed)
- ✅ Build frontend
- ✅ Configurazione Nginx
- ✅ Avvio backend con PM2
- ✅ Configurazione firewall UFW
- ✅ Setup backup automatici
- ✅ Test deployment
- ✅ Generazione report completo

**Prerequisiti:**
- Container Proxmox Ubuntu 24.04 già creato e avviato
- Accesso root al container
- Connessione internet attiva

**Uso:**
```bash
# Deployment completo (con aggiornamento sistema)
bash deploy.sh

# Deployment senza aggiornamento sistema (più veloce)
bash deploy.sh --skip-system-update
```

**Tempo stimato:** 10-15 minuti

**Output:**
- Log: `/var/log/dashboard-deployment.log`
- Report: `/root/dashboard-deployment-report.txt`
- Configurazione: `/tmp/deployment_config.env`
- Secrets: `/root/.dashboard-secrets` (chmod 600)

**Credenziali default generate:**
- Username: `admin`
- Password: `admin123`
- Database password: auto-generata
- JWT secrets: auto-generati

---

### 2. `update.sh` - Aggiornamento Applicazione

**Descrizione:** Aggiorna l'applicazione all'ultima versione da GitHub.

**Cosa fa:**
- ✅ Backup automatico pre-update (database, uploads, configurazioni)
- ✅ Pull latest changes da GitHub
- ✅ Update dipendenze backend
- ✅ Esecuzione migrations database
- ✅ Rebuild frontend
- ✅ Deploy nuovo frontend
- ✅ Restart servizi
- ✅ Health check post-update

**Uso:**
```bash
bash update.sh
```

**Tempo stimato:** 3-5 minuti

**Backup automatico in:** `/opt/backups/pre-update-YYYYMMDD_HHMMSS/`

**Rollback:** In caso di problemi, usa `rollback.sh`

---

### 3. `rollback.sh` - Ripristino Backup

**Descrizione:** Ripristina un backup precedente dell'applicazione.

**Cosa fa:**
- ✅ Lista backup disponibili
- ✅ Selezione interattiva del backup
- ✅ Restore database
- ✅ Restore uploads
- ✅ Restore configurazioni
- ✅ Restart servizi
- ✅ Health check post-rollback

**Uso:**
```bash
bash rollback.sh
```

**Interattivo:** Lo script chiederà quale backup ripristinare.

⚠️ **ATTENZIONE:** Il restore del database è **DISTRUTTIVO** - tutti i dati attuali saranno persi!

---

### 4. `health-check.sh` - Controllo Stato Sistema

**Descrizione:** Verifica lo stato di tutti i servizi e componenti.

**Cosa controlla:**
- ✅ PostgreSQL (servizio + connessione)
- ✅ Nginx (servizio + configurazione)
- ✅ Backend PM2 (processo + uptime)
- ✅ Health endpoint API
- ✅ Frontend
- ✅ Risorse sistema (memoria, disco, CPU)
- ✅ Backup (data ultimo backup)
- ✅ Connettività di rete

**Uso:**
```bash
# Esecuzione manuale
bash health-check.sh

# Come cron job (ogni 5 minuti)
*/5 * * * * /root/health-check.sh >> /var/log/dashboard-health.log 2>&1
```

**Log:** `/var/log/dashboard-health.log`

**Exit codes:**
- `0` = Tutto OK
- `1` = Problemi rilevati

**Email alerts:** Configurabile modificando le variabili nel file:
```bash
ALERT_EMAIL="your-email@example.com"
SEND_EMAIL=true
```

---

## 📁 STRUTTURA FILE DOPO DEPLOYMENT

```
/opt/
├── dashboard-nodejs/              # Applicazione
│   ├── backend/
│   │   ├── .env                   # Configurazione backend
│   │   ├── src/
│   │   └── node_modules/
│   └── frontend/
│       ├── .env                   # Configurazione frontend
│       ├── dist/                  # Build production
│       └── node_modules/
│
├── backups/                       # Backup automatici
│   ├── dashboard_db_*.sql.gz     # Backup database
│   ├── dashboard_uploads_*.tar.gz # Backup uploads
│   └── pre-update-*/              # Backup pre-update
│
/var/
├── www/dashboard/                 # Frontend deployato
├── log/
│   ├── nginx/
│   │   ├── access.log
│   │   └── error.log
│   ├── dashboard-deployment.log
│   ├── dashboard-health.log
│   ├── backup-db.log
│   └── backup-uploads.log
│
/root/
├── dashboard-deployment-report.txt  # Report deployment
├── .dashboard-secrets              # Secrets (chmod 600)
│
/tmp/
└── deployment_config.env           # Config deployment

/etc/nginx/
└── sites-available/
    └── dashboard                   # Config Nginx

/usr/local/bin/
├── backup-dashboard-db.sh         # Script backup DB
└── backup-dashboard-uploads.sh    # Script backup uploads
```

---

## 🔧 CONFIGURAZIONE BACKUP AUTOMATICI

I backup sono configurati automaticamente da `deploy.sh`:

### Database Backup (Giornaliero)
```bash
# Cron job: Ogni giorno alle 2:00 AM
0 2 * * * /usr/local/bin/backup-dashboard-db.sh >> /var/log/backup-db.log 2>&1
```

### Uploads Backup (Settimanale)
```bash
# Cron job: Ogni domenica alle 3:00 AM
0 3 * * 0 /usr/local/bin/backup-dashboard-uploads.sh >> /var/log/backup-uploads.log 2>&1
```

### Retention Policy
- Database backup: 30 giorni
- Uploads backup: 30 giorni
- Pre-update backup: Manuale (consigliato: eliminare dopo 7 giorni se update OK)

### Backup Manuale
```bash
# Database
/usr/local/bin/backup-dashboard-db.sh

# Uploads
/usr/local/bin/backup-dashboard-uploads.sh

# Lista backup
ls -lh /opt/backups/
```

---

## 🚀 WORKFLOW COMPLETO

### Prima Installazione

1. **Crea container Proxmox** (Ubuntu 24.04)
   - CPU: 2 cores
   - RAM: 4GB
   - Disk: 30GB

2. **SSH nel container**
   ```bash
   ssh root@<IP_CONTAINER>
   ```

3. **Upload script**
   ```bash
   # Da locale
   scp deploy.sh root@<IP_CONTAINER>:/root/
   
   # Nel container
   chmod +x /root/deploy.sh
   ```

4. **Esegui deployment**
   ```bash
   cd /root
   bash deploy.sh
   ```

5. **Salva configurazione**
   ```bash
   # Backup del report e secrets
   cp /root/dashboard-deployment-report.txt ~/dashboard-report-backup.txt
   cp /root/.dashboard-secrets ~/dashboard-secrets-backup.txt
   ```

6. **Accedi all'applicazione**
   ```
   URL: http://<IP_CONTAINER>
   Username: admin
   Password: admin123
   ```

7. **⚠️ IMPORTANTE:** Cambia password admin!

---

### Aggiornamento Applicazione

1. **Upload script update**
   ```bash
   scp update.sh root@<IP_CONTAINER>:/root/
   chmod +x /root/update.sh
   ```

2. **Esegui update**
   ```bash
   bash /root/update.sh
   ```

3. **Verifica applicazione**
   ```bash
   bash /root/health-check.sh
   ```

4. **Se problemi → Rollback**
   ```bash
   bash /root/rollback.sh
   ```

---

### Monitoraggio

1. **Health check manuale**
   ```bash
   bash /root/health-check.sh
   ```

2. **Health check automatico (cron)**
   ```bash
   # Aggiungi a crontab
   crontab -e
   
   # Ogni 5 minuti
   */5 * * * * /root/health-check.sh >> /var/log/dashboard-health.log 2>&1
   ```

3. **PM2 monitoring**
   ```bash
   pm2 monit        # Dashboard real-time
   pm2 logs         # Log stream
   pm2 status       # Status overview
   ```

4. **Log review**
   ```bash
   # Backend
   pm2 logs dashboard-api --lines 100
   
   # Nginx
   tail -f /var/log/nginx/access.log
   tail -f /var/log/nginx/error.log
   
   # Health checks
   tail -f /var/log/dashboard-health.log
   
   # Deployment
   cat /var/log/dashboard-deployment.log
   ```

---

## 🔒 SICUREZZA

### Secrets Management

**Secrets generati automaticamente:**
- Database password
- JWT secret
- JWT refresh secret

**Dove sono salvati:**
```bash
/root/.dashboard-secrets        # Chmod 600, solo root
/tmp/deployment_config.env      # Temporaneo
/opt/dashboard-nodejs/backend/.env  # App config
```

**⚠️ NON committare mai file .env su Git!**

### Rotazione Secrets

Per rigenerare secrets (es. dopo security breach):

```bash
# 1. Genera nuovi secrets
NEW_JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
NEW_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

# 2. Aggiorna backend/.env
nano /opt/dashboard-nodejs/backend/.env

# 3. Restart backend
pm2 restart dashboard-api

# 4. Tutti gli utenti dovranno rifare login
```

---

## 🆘 TROUBLESHOOTING

### Backend non parte

```bash
# Check logs
pm2 logs dashboard-api --lines 50

# Check database connection
sudo -u postgres psql -d dashboard_db -c "SELECT 1;"

# Restart
pm2 restart dashboard-api
```

### Frontend non carica

```bash
# Check Nginx
systemctl status nginx
nginx -t

# Check files
ls -la /var/www/dashboard/

# Reload Nginx
systemctl reload nginx
```

### Database connection error

```bash
# Check PostgreSQL
systemctl status postgresql

# Test connection
psql -h localhost -U dashboard_user -d dashboard_db

# Check .env
cat /opt/dashboard-nodejs/backend/.env | grep DB_
```

### Disk full

```bash
# Check disk usage
df -h

# Clean old backups
find /opt/backups -mtime +30 -delete

# Clean npm cache
npm cache clean --force

# Clean PM2 logs
pm2 flush
```

---

## 📚 COMANDI UTILI

### PM2
```bash
pm2 list                    # Lista processi
pm2 status                  # Status overview
pm2 info dashboard-api      # Dettagli processo
pm2 logs                    # Live logs
pm2 logs --lines 100        # Ultimi 100 log
pm2 monit                   # Monitoring dashboard
pm2 restart dashboard-api   # Restart
pm2 stop dashboard-api      # Stop
pm2 start dashboard-api     # Start
pm2 delete dashboard-api    # Delete (richiede re-deploy)
```

### Nginx
```bash
nginx -t                    # Test config
systemctl status nginx      # Status
systemctl reload nginx      # Reload config
systemctl restart nginx     # Restart
tail -f /var/log/nginx/access.log  # Access log
tail -f /var/log/nginx/error.log   # Error log
```

### PostgreSQL
```bash
systemctl status postgresql                    # Status
sudo -u postgres psql                          # Accesso superuser
sudo -u postgres psql -d dashboard_db          # Accesso database
sudo -u postgres pg_dump dashboard_db > backup.sql  # Backup
```

### Git
```bash
cd /opt/dashboard-nodejs
git status              # Stato
git log --oneline -10   # Ultimi 10 commit
git pull origin main    # Pull latest
git fetch origin        # Fetch senza merge
```

---

## 🎯 BEST PRACTICES

### 1. Backup
- ✅ Esegui backup PRIMA di ogni update
- ✅ Testa i restore periodicamente
- ✅ Conserva backup per almeno 30 giorni
- ✅ Backup fuori dal container (es. NAS, S3)

### 2. Updates
- ✅ Leggi changelog prima di aggiornare
- ✅ Testa su ambiente di staging prima
- ✅ Aggiorna in finestra di manutenzione
- ✅ Notifica utenti prima dell'update

### 3. Monitoring
- ✅ Configura health check automatici
- ✅ Configura alert email/SMS
- ✅ Review log regolarmente
- ✅ Monitora uso risorse

### 4. Sicurezza
- ✅ Cambia password admin default
- ✅ Aggiorna sistema regolarmente
- ✅ Configura SSL/HTTPS
- ✅ Limita accesso SSH (fail2ban)
- ✅ Backup secrets in luogo sicuro

---

## 📞 SUPPORTO

**Documentazione:**
- `/opt/dashboard-nodejs/README.md`
- `/opt/dashboard-nodejs/DEPLOYMENT_GUIDE.md`
- `/root/dashboard-deployment-report.txt`

**Log files:**
- `/var/log/dashboard-deployment.log`
- `/var/log/dashboard-health.log`
- PM2: `pm2 logs`
- Nginx: `/var/log/nginx/`

**GitHub:**
- Repository: https://github.com/turiliffiu/dashboard-nodejs
- Issues: https://github.com/turiliffiu/dashboard-nodejs/issues

**Contatti:**
- Email: support@tgs.ovh
- Autore: Salvo - FiberCop TGS

---

**Versione Script:** 1.0.0  
**Data:** Gennaio 2026  
**Compatibilità:** Ubuntu 24.04 LTS, Proxmox LXC
