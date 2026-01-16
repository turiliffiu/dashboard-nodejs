# 🚀 GUIDA DEPLOYMENT - Proxmox Container

Guida completa per deployare Dashboard Procedure Operative su container Proxmox Ubuntu.

## 📋 Prerequisiti

- Proxmox VE funzionante
- Accesso SSH root al server Proxmox
- Domini configurati (opzionale):
  - `dashboard.tgs.ovh` → Frontend
  - `api.dashboard.tgs.ovh` → Backend API

---

## 🐳 1. CREAZIONE CONTAINER PROXMOX

### 1.1 Parametri Container

```
ID: <scegli ID libero>
Template: ubuntu-24.04-standard_24.04-2_amd64.tar.zst
Hostname: dashboard
Password: <imposta password root>

Risorse:
- CPU: 2 cores
- RAM: 4096 MB
- Swap: 2048 MB
- Root Disk: 30 GB
- Network: vmbr0 (DHCP o IP statico)

Opzioni:
- Start at boot: Sì
- Nesting: Sì (per Docker se necessario)
- Unprivileged: Sì
```

### 1.2 Avvio Container

```bash
# Dal nodo Proxmox
pct start <CT_ID>

# Verifica IP assegnato
pct exec <CT_ID> -- ip addr show
```

---

## 🔧 2. PREPARAZIONE SISTEMA

### 2.1 SSH nel Container

```bash
ssh root@<IP_CONTAINER>
```

### 2.2 Aggiornamento Sistema

```bash
apt update && apt upgrade -y
apt install -y curl wget git build-essential
```

### 2.3 Installazione Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version  # Deve essere >= 20.x
npm --version   # Deve essere >= 10.x
```

### 2.4 Installazione PostgreSQL 16.x

```bash
# Aggiungi repository PostgreSQL
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt update
apt install -y postgresql-16 postgresql-contrib-16

# Avvia servizio
systemctl enable postgresql
systemctl start postgresql
```

### 2.5 Installazione Nginx

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

### 2.6 Installazione PM2 (Process Manager)

```bash
npm install -g pm2
pm2 startup systemd
```

---

## 📦 3. SETUP DATABASE

### 3.1 Creazione Database e Utente

```bash
sudo -u postgres psql << EOF
CREATE DATABASE dashboard_db;
CREATE USER dashboard_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE dashboard_db TO dashboard_user;
ALTER DATABASE dashboard_db OWNER TO dashboard_user;
\q
EOF
```

### 3.2 Configurazione PostgreSQL (opzionale per connessione remota)

```bash
# Modifica pg_hba.conf
nano /etc/postgresql/16/main/pg_hba.conf
# Aggiungi: host    dashboard_db    dashboard_user    127.0.0.1/32    md5

# Modifica postgresql.conf
nano /etc/postgresql/16/main/postgresql.conf
# listen_addresses = 'localhost'

# Restart PostgreSQL
systemctl restart postgresql
```

---

## 📥 4. DEPLOY BACKEND

### 4.1 Clone Repository

```bash
cd /opt
git clone https://github.com/turiliffiu/dashboard-nodejs.git
cd dashboard-nodejs/backend
```

### 4.2 Installazione Dipendenze

```bash
npm install --production
```

### 4.3 Configurazione Environment

```bash
cp .env.example .env
nano .env
```

**Modifica `.env` con:**
```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

DATABASE_URL=postgresql://dashboard_user:your_secure_password@localhost:5432/dashboard_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dashboard_db
DB_USER=dashboard_user
DB_PASSWORD=your_secure_password

JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

FRONTEND_URL=http://<IP_CONTAINER>
ALLOWED_ORIGINS=http://<IP_CONTAINER>,http://localhost:5173
```

### 4.4 Migrazioni e Seed

```bash
npm run migrate
npm run seed
```

### 4.5 Avvio con PM2

```bash
pm2 start ecosystem.config.js
pm2 save
```

### 4.6 Verifica Backend

```bash
curl http://localhost:3000/health
# Dovrebbe rispondere: {"status":"OK",...}
```

---

## 🎨 5. DEPLOY FRONTEND

### 5.1 Build Frontend

```bash
cd /opt/dashboard-nodejs/frontend
npm install
npm run build
```

### 5.2 Copia Build in Nginx

```bash
mkdir -p /var/www/dashboard
cp -r dist/* /var/www/dashboard/
chown -R www-data:www-data /var/www/dashboard
```

---

## 🌐 6. CONFIGURAZIONE NGINX

### 6.1 Crea Configurazione

```bash
nano /etc/nginx/sites-available/dashboard
```

**Inserisci:**
```nginx
# Frontend
server {
    listen 80;
    server_name <IP_CONTAINER> dashboard.tgs.ovh;
    root /var/www/dashboard;
    index index.html;

    # React Router - Tutte le route a index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets con cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}

# Backend API
server {
    listen 80;
    server_name api.dashboard.tgs.ovh;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # CORS headers (se necessario)
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;

        if ($request_method = OPTIONS) {
            return 204;
        }
    }
}
```

### 6.2 Attiva Configurazione

```bash
ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # Rimuovi configurazione default
nginx -t  # Test configurazione
systemctl reload nginx
```

---

## 🔐 7. SSL CON LET'S ENCRYPT (Opzionale)

### 7.1 Installazione Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### 7.2 Ottenimento Certificati

```bash
certbot --nginx -d dashboard.tgs.ovh -d api.dashboard.tgs.ovh
```

### 7.3 Rinnovo Automatico

```bash
# Test rinnovo
certbot renew --dry-run

# Cron job automatico (già configurato da certbot)
systemctl status certbot.timer
```

---

## ✅ 8. VERIFICA INSTALLAZIONE

### 8.1 Test Backend

```bash
curl http://localhost:3000/api
# Dovrebbe restituire lista endpoint API
```

### 8.2 Test Frontend

Apri browser:
```
http://<IP_CONTAINER>
```

### 8.3 Test Login

```
Username: admin
Password: admin123
```

---

## 🔄 9. AGGIORNAMENTI

### 9.1 Backend Update

```bash
cd /opt/dashboard-nodejs/backend
git pull origin main
npm install
npm run migrate  # Se ci sono nuove migrazioni
pm2 restart dashboard-api
```

### 9.2 Frontend Update

```bash
cd /opt/dashboard-nodejs/frontend
git pull origin main
npm install
npm run build
rm -rf /var/www/dashboard/*
cp -r dist/* /var/www/dashboard/
```

---

## 🛠️ 10. MANUTENZIONE

### 10.1 Log Backend

```bash
pm2 logs dashboard-api
pm2 logs dashboard-api --lines 100
```

### 10.2 Log Nginx

```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 10.3 Backup Database

```bash
# Backup manuale
sudo -u postgres pg_dump dashboard_db > backup_$(date +%Y%m%d).sql

# Backup automatico giornaliero
cat > /etc/cron.daily/backup-dashboard-db << 'EOF'
#!/bin/bash
sudo -u postgres pg_dump dashboard_db | gzip > /opt/backups/dashboard_db_$(date +%Y%m%d).sql.gz
find /opt/backups -name "dashboard_db_*.sql.gz" -mtime +30 -delete
EOF
chmod +x /etc/cron.daily/backup-dashboard-db
```

### 10.4 Backup File Uploads

```bash
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /opt/dashboard-nodejs/backend/src/uploads/
```

### 10.5 Restore Database

```bash
sudo -u postgres psql dashboard_db < backup_20260116.sql
```

---

## 📊 11. MONITORING

### 11.1 PM2 Monitoring

```bash
pm2 monit                    # Dashboard real-time
pm2 status                   # Status applicazioni
pm2 info dashboard-api       # Dettagli applicazione
```

### 11.2 Sistema

```bash
htop                         # Utilizzo risorse
df -h                        # Spazio disco
free -h                      # Memoria
systemctl status postgresql  # Status PostgreSQL
systemctl status nginx       # Status Nginx
```

---

## 🐛 12. TROUBLESHOOTING

### Backend non parte

```bash
# Verifica log
pm2 logs dashboard-api --err

# Verifica database
sudo -u postgres psql -c "\l" | grep dashboard

# Test connessione DB
sudo -u postgres psql -d dashboard_db -c "SELECT 1;"

# Restart
pm2 restart dashboard-api
```

### Frontend non carica

```bash
# Verifica file build
ls -la /var/www/dashboard/

# Verifica configurazione Nginx
nginx -t

# Reload Nginx
systemctl reload nginx

# Check permessi
chown -R www-data:www-data /var/www/dashboard/
```

### Errori CORS

```bash
# Verifica ALLOWED_ORIGINS in backend/.env
# Deve includere URL frontend

# Restart backend
pm2 restart dashboard-api
```

---

## 🔒 13. SICUREZZA

### 13.1 Firewall (UFW)

```bash
apt install -y ufw
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
ufw status
```

### 13.2 Fail2ban (Protezione SSH)

```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

### 13.3 Cambia Password Admin

Dopo primo login, cambia password admin dal profilo utente!

---

## 📝 14. CHECKLIST POST-INSTALLAZIONE

- [ ] Backend raggiungibile su http://localhost:3000
- [ ] Frontend raggiungibile su http://<IP_CONTAINER>
- [ ] Login con admin/admin123 funziona
- [ ] Upload file procedure funziona
- [ ] Ricerca funziona
- [ ] PM2 avvio automatico configurato
- [ ] Backup database schedulato
- [ ] SSL configurato (se domini disponibili)
- [ ] Firewall configurato
- [ ] Password admin cambiata
- [ ] Logs accessibili e monitorabili

---

## 📞 15. SUPPORTO

**GitHub Issues**: https://github.com/turiliffiu/dashboard-nodejs/issues

**Email**: support@tgs.ovh

---

## 📚 16. RISORSE UTILI

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/docs/)

---

**Versione**: 1.0.0  
**Data**: Gennaio 2026  
**Autore**: Salvo - FiberCop TGS
