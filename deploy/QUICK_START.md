# ⚡ QUICK START GUIDE - Dashboard Node.js Deployment

Guida rapida per deployment in 15 minuti su container Proxmox.

---

## 🎯 TL;DR - Comandi Rapidi

```bash
# 1. SSH nel container
ssh root@<IP_CONTAINER>

# 2. Upload script
scp deploy.sh root@<IP_CONTAINER>:/root/

# 3. Deploy!
chmod +x /root/deploy.sh
bash /root/deploy.sh

# 4. Accedi
# http://<IP_CONTAINER>
# Username: admin | Password: admin123
```

---

## 📋 PREREQUISITI (5 minuti)

### 1. Crea Container Proxmox

**Via Web UI:**
1. Proxmox Web → Create CT
2. Template: `ubuntu-24.04-standard`
3. Resources:
   - CPU: 2 cores
   - RAM: 4096 MB
   - Disk: 30 GB
4. Network: Bridge (DHCP o Static IP)
5. Start container

**Via CLI (Proxmox host):**
```bash
# Trova CT ID libero
pvesh get /cluster/resources --type vm

# Crea container
pct create 100 \
  local:vztmpl/ubuntu-24.04-standard_24.04-2_amd64.tar.zst \
  --hostname dashboard \
  --memory 4096 \
  --cores 2 \
  --rootfs local-lvm:30 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --onboot 1 \
  --unprivileged 1

# Start
pct start 100

# Get IP
pct exec 100 -- hostname -I
```

**Sulla shell del nuovo Container su Proxmox:**

```bash
sudo nano /etc/ssh/sshd_config
```

Modificare i seguenti parametri:

```bash
PermitRootLogin yes
PasswordAuthentication yes
PermitEmptyPasswords no
```

Installare ifconfig e git

```bash
apt update
apt install -y net-tools
```

### 2. Accesso SSH

```bash
# Dal tuo computer
ssh root@<IP_CONTAINER>

# Se primo accesso, imposta password
# Se SSH key, copia la tua chiave
ssh-copy-id root@<IP_CONTAINER>
```

---

## 🚀 DEPLOYMENT (10 minuti)

### Opzione A: Upload Script (Consigliato)

```bash
# 1. Dal tuo computer - Upload script
scp deploy.sh root@<IP_CONTAINER>:/root/

# 2. Nel container - Rendi eseguibile
chmod +x /root/deploy.sh

# 3. Esegui deployment
bash /root/deploy.sh
```

### Opzione B: Download da GitHub

```bash
# 1. Nel container
cd /root

# 2. Download script
wget https://raw.githubusercontent.com/turiliffiu/dashboard-nodejs/main/deploy/scripts/deploy.sh

# 3. Rendi eseguibile
chmod +x deploy.sh

# 4. Esegui
bash deploy.sh
```

### Opzione C: Copy-Paste

```bash
# 1. Nel container
nano /root/deploy.sh

# 2. Copia-incolla il contenuto dello script

# 3. Salva (Ctrl+X, Y, Enter)

# 4. Rendi eseguibile ed esegui
chmod +x /root/deploy.sh
bash /root/deploy.sh
```

---

## ⏱️ COSA SUCCEDE DURANTE IL DEPLOYMENT

Lo script eseguirà automaticamente:

```
✓ Step 0: Verifica prerequisiti (30s)
  - Check root access
  - Get container IP
  - Test internet
  - Generate secrets

✓ Step 1: System update (2-3min)
  - apt update && upgrade
  - Install base tools

✓ Step 2: Install Node.js 20.x (1min)
  - Add NodeSource repo
  - Install Node.js + npm

✓ Step 3: Install PostgreSQL 16 (1min)
  - Add PostgreSQL repo
  - Install PostgreSQL

✓ Step 4: Configure database (30s)
  - Create database
  - Create user
  - Test connection

✓ Step 5: Install Nginx (30s)
  - Install Nginx
  - Remove default config

✓ Step 6: Install PM2 (30s)
  - npm install -g pm2
  - Configure startup

✓ Step 7: Backend setup (2-3min)
  - Clone repository
  - npm install
  - Run migrations
  - Seed database

✓ Step 8: Frontend setup (2-3min)
  - npm install
  - Build production
  - Copy to Nginx

✓ Step 9: Configure Nginx (30s)
  - Create vhost config
  - Test & reload

✓ Step 10: Start backend (30s)
  - PM2 start
  - Save config

✓ Step 11: Configure firewall (30s)
  - Setup UFW rules
  - Open ports 22,80,443

✓ Step 12: Configure backups (30s)
  - Create backup scripts
  - Setup cron jobs

✓ Step 13: Test deployment (30s)
  - Health checks
  - API tests
  - Frontend test

✓ Step 14: Generate report (10s)
  - Save configuration
  - Create report file
```

**Tempo totale:** ~10-15 minuti

---

## 🎉 POST-DEPLOYMENT

### 1. Verifica Deployment

Lo script mostrerà un report finale con:
- ✅ URL dell'applicazione
- ✅ Credenziali default
- ✅ IP e hostname
- ✅ Versioni installate
- ✅ Secrets generati

**Esempio output:**
```
================================================================================
DEPLOYMENT COMPLETATO!
================================================================================

✓ Tempo totale: 12m 34s

✓ Dashboard disponibile su: http://192.168.1.100
✓ Backend API: http://192.168.1.100:3000/api

Credenziali default:
  Username: admin
  Password: admin123

⚠️  Cambia la password admin al primo login!

Report completo: /root/dashboard-deployment-report.txt
Log deployment: /var/log/dashboard-deployment.log
Configurazione: /tmp/deployment_config.env
```

### 2. Primo Accesso

```bash
# Apri browser
http://<IP_CONTAINER>

# Login
Username: admin
Password: admin123

# ⚠️ IMPORTANTE: Vai su Profilo → Cambia Password!
```

### 3. Test Funzionalità

**Dashboard:**
- ✅ Login funziona
- ✅ Visualizzazione procedure
- ✅ Ricerca funziona
- ✅ Upload file .txt

**Admin Panel** (solo admin):
- ✅ User Management
- ✅ Gestione utenti
- ✅ Modifica ruoli

**Backend API:**
```bash
# Health check
curl http://<IP>/3000/health

# API docs
curl http://<IP>:3000/api
```

---

## 📝 SALVA CONFIGURAZIONE

### File Importanti da Backup

```bash
# 1. Report deployment
cp /root/dashboard-deployment-report.txt ~/dashboard-report.txt

# 2. Secrets (PASSWORD DATABASE, JWT)
cp /root/.dashboard-secrets ~/dashboard-secrets.txt

# 3. Configuration
cp /tmp/deployment_config.env ~/dashboard-config.env

# ⚠️ Salva questi file in un luogo SICURO!
# ⚠️ NON commitare su Git!
```

### Esempio Secrets File

```bash
cat /root/.dashboard-secrets

# Output:
DB_PASSWORD=xK8mQ2vB5nL9pT3wR7dF1hS6
JWT_SECRET=aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE1fG3hI5jK7lM9nO1pQ3
JWT_REFRESH_SECRET=qR8sT2uV6wX0yZ4aB8cD2eF6gH0iJ4kL8mN2oP6qR0sT4uV8wX2yZ6aB0cD4eF8
```

**Backup sicuro:**
```bash
# Copy su tua macchina locale
scp root@<IP>:/root/.dashboard-secrets ~/secure-backup/

# Oppure usa password manager (LastPass, 1Password, etc.)
```

---

## 🔐 CONFIGURAZIONE SSL (Opzionale)

### Con Dominio

Se hai un dominio (es. `dashboard.example.com`):

```bash
# 1. Punta il dominio all'IP del container
# (Configura DNS A record)

# 2. Install Certbot
apt install certbot python3-certbot-nginx

# 3. Ottieni certificato SSL
certbot --nginx -d dashboard.example.com -d api.dashboard.example.com

# 4. Auto-renewal (già configurato)
certbot renew --dry-run
```

### Senza Dominio (Self-Signed)

```bash
# 1. Genera certificato self-signed
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/dashboard.key \
  -out /etc/ssl/certs/dashboard.crt

# 2. Configura Nginx
nano /etc/nginx/sites-available/dashboard

# Aggiungi:
server {
    listen 443 ssl;
    ssl_certificate /etc/ssl/certs/dashboard.crt;
    ssl_certificate_key /etc/ssl/private/dashboard.key;
    # ... resto config
}

# 3. Reload Nginx
nginx -t && systemctl reload nginx
```

---

## 🎨 PERSONALIZZAZIONE

### Cambia Configurazione Backend

```bash
nano /opt/dashboard-nodejs/backend/.env

# Modifica variabili:
# - FRONTEND_URL
# - ALLOWED_ORIGINS
# - JWT_EXPIRES_IN
# - RATE_LIMIT_*

# Restart
pm2 restart dashboard-api
```

### Cambia Configurazione Frontend

```bash
nano /opt/dashboard-nodejs/frontend/.env

# Modifica:
# - VITE_API_URL
# - VITE_APP_NAME

# Rebuild
cd /opt/dashboard-nodejs/frontend
npm run build
rm -rf /var/www/dashboard/*
cp -r dist/* /var/www/dashboard/
```

---

## 📊 MONITORING SETUP

### Health Check Automatico

```bash
# 1. Upload script
scp health-check.sh root@<IP>:/root/
chmod +x /root/health-check.sh

# 2. Aggiungi a crontab
crontab -e

# Ogni 5 minuti
*/5 * * * * /root/health-check.sh >> /var/log/dashboard-health.log 2>&1

# 3. Test
bash /root/health-check.sh
```

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Status
pm2 status

# Logs
pm2 logs dashboard-api

# Info
pm2 info dashboard-api
```

---

## 🆘 TROUBLESHOOTING RAPIDO

### Backend non risponde

```bash
pm2 restart dashboard-api
pm2 logs dashboard-api --lines 50
```

### Frontend 404

```bash
ls -la /var/www/dashboard/
systemctl reload nginx
```

### Database errore

```bash
systemctl status postgresql
sudo -u postgres psql -d dashboard_db -c "SELECT 1;"
```

### Disco pieno

```bash
df -h
find /opt/backups -mtime +30 -delete
pm2 flush
```

---

## 🎯 CHECKLIST POST-DEPLOYMENT

- [ ] Applicazione accessibile su http://<IP>
- [ ] Login con admin/admin123 funziona
- [ ] Password admin cambiata
- [ ] Report salvato in luogo sicuro
- [ ] Secrets backuppati
- [ ] Health check funziona
- [ ] PM2 avvio automatico OK
- [ ] Firewall attivo
- [ ] Backup schedulati configurati
- [ ] SSL configurato (se dominio disponibile)
- [ ] Monitoring configurato

---

## 📚 PROSSIMI STEP

### Giorno 1
1. ✅ Deploy completato
2. ✅ Test base funzionamento
3. ✅ Backup configurazione

### Giorno 2-7
4. Crea utenti aggiuntivi
5. Carica procedure operative
6. Testa ricerca e filtri
7. Familiarizza con interfaccia

### Settimana 2
8. Setup SSL (se dominio)
9. Configura monitoring avanzato
10. Training team
11. Documentazione interna

### Mese 1
12. Review backup e restore
13. Performance tuning
14. Security audit
15. Feature requests

---

## 🚀 SCRIPT AGGIUNTIVI

### Update Applicazione

```bash
# Upload update script
scp update.sh root@<IP>:/root/
chmod +x /root/update.sh

# Esegui update
bash /root/update.sh
```

### Rollback

```bash
# Upload rollback script
scp rollback.sh root@<IP>:/root/
chmod +x /root/rollback.sh

# Esegui rollback (interattivo)
bash /root/rollback.sh
```

---

## 💡 TIPS & TRICKS

### Accesso Rapido

```bash
# Crea alias SSH
nano ~/.ssh/config

# Aggiungi:
Host dashboard
    HostName <IP_CONTAINER>
    User root
    IdentityFile ~/.ssh/id_rsa

# Ora puoi fare:
ssh dashboard
```

### Script Personali

```bash
# Crea script custom
nano /usr/local/bin/dashboard-status

#!/bin/bash
pm2 status
systemctl status nginx
systemctl status postgresql
df -h /

chmod +x /usr/local/bin/dashboard-status

# Usa con:
dashboard-status
```

### Backup Extra

```bash
# Snapshot Proxmox (dal host Proxmox)
vzdump <CT_ID> --mode snapshot --storage local

# Restore snapshot
pct restore <CT_ID> /var/lib/vz/dump/vzdump-*.tar.gz
```

---

## 📞 SUPPORTO

### Documentazione
- README: `/opt/dashboard-nodejs/README.md`
- Report: `/root/dashboard-deployment-report.txt`
- Questa guida: `QUICK_START.md`

### Log Files
- Deployment: `/var/log/dashboard-deployment.log`
- Health: `/var/log/dashboard-health.log`
- PM2: `pm2 logs dashboard-api`
- Nginx: `/var/log/nginx/error.log`

### Risorse Online
- GitHub: https://github.com/turiliffiu/dashboard-nodejs
- Issues: https://github.com/turiliffiu/dashboard-nodejs/issues
- Email: support@tgs.ovh

---

**Buon deployment! 🎉**

Se incontri problemi, consulta il `SCRIPT_README.md` completo o apri una issue su GitHub.
