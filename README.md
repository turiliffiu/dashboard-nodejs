# 🥘 Dashboard Procedure Operative - Node.js + React

## 📋 Descrizione

Applicazione web moderna per archiviare, gestire e riutilizzare procedure operative tecniche. Sistema multi-utente con ruoli e permessi, editor WYSIWYG, ricerca full-text e gestione file.

**Stack Tecnologico:**
- Backend: Node.js 20.x + Express 4.x + PostgreSQL 16.x
- Frontend: React 18.x + Vite 5.x + Tailwind CSS
- Autenticazione: JWT
- Deployment: Proxmox Container + PM2 + Nginx

## 🚀 Quick Start

### Prerequisiti

- Node.js 20.x LTS
- PostgreSQL 16.x
- npm o pnpm

### Installazione Locale

```bash
# Clone repository
git clone https://github.com/turiliffiu/dashboard-nodejs.git
cd dashboard-nodejs

# Backend setup
cd backend
cp .env.example .env
# Configura .env con le tue credenziali
npm install
npm run migrate
npm run seed
npm run dev

# Frontend setup (altro terminale)
cd ../frontend
cp .env.example .env
npm install
npm run dev
```

**URLs locali:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Utente di Default

Dopo il seed del database:
- Username: `admin`
- Password: `admin123`
- Ruolo: Administrator

## 📁 Struttura Progetto

```
dashboard-nodejs/
├── backend/                 # Express API
│   ├── src/
│   │   ├── config/         # Configurazioni (DB, JWT, Multer)
│   │   ├── models/         # Modelli Sequelize
│   │   ├── controllers/    # Controller logica business
│   │   ├── middleware/     # Middleware custom
│   │   ├── routes/         # Route definitions
│   │   ├── services/       # Business logic layer
│   │   ├── utils/          # Utility functions
│   │   └── uploads/        # File caricati
│   ├── tests/              # Test suite
│   └── package.json
├── frontend/               # React SPA
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── context/        # Context providers
│   │   ├── services/       # API service layer
│   │   └── styles/         # CSS/Tailwind
│   └── package.json
├── docs/                   # Documentazione
└── deploy/                 # Script deployment
```

## 🔑 Funzionalità Principali

### Gestione Utenti
- ✅ Registrazione e login con JWT
- ✅ 3 ruoli: Admin, Editor, Viewer
- ✅ Gestione profilo utente
- ✅ User management (solo Admin)

### Gestione Procedure
- ✅ CRUD completo procedure
- ✅ Upload file .txt strutturati
- ✅ Editor WYSIWYG integrato
- ✅ Parser custom formato procedure
- ✅ Download file
- ✅ Permessi granulari (owner/public/private)

### Ricerca e Visualizzazione
- ✅ Ricerca full-text real-time
- ✅ Highlighting risultati
- ✅ Dashboard con card responsive
- ✅ Visualizzatore procedure con copy-to-clipboard

## 🛠️ Sviluppo

### Backend

```bash
cd backend

# Development con hot reload
npm run dev

# Migrazioni database
npm run migrate
npm run migrate:undo

# Seed database
npm run seed

# Test
npm run test
npm run test:watch

# Lint & Format
npm run lint
npm run format
```

### Frontend

```bash
cd frontend

# Development
npm run dev

# Build production
npm run build

# Preview build
npm run preview

# Test
npm run test
npm run test:ui

# Lint & Format
npm run lint
npm run format
```

## 🚀 Deployment su Proxmox

### 1. Preparazione Container

```bash
# Crea container Ubuntu 24.04 su Proxmox
# - CPU: 2 cores
# - RAM: 4GB
# - Disk: 30GB
# - Network: bridge

# SSH nel container
ssh root@<container-ip>
```

### 2. Installazione Dipendenze

```bash
# Aggiorna sistema
apt update && apt upgrade -y

# Installa Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Installa PostgreSQL 16
apt install -y postgresql postgresql-contrib

# Installa Nginx
apt install -y nginx

# Installa PM2 globalmente
npm install -g pm2
```

### 3. Deploy Backend

```bash
# Crea utente applicativo
useradd -m -s /bin/bash dashboard
su - dashboard

# Clone repository
cd /home/dashboard
git clone https://github.com/turiliffiu/dashboard-nodejs.git
cd dashboard-nodejs/backend

# Installa dipendenze
npm install --production

# Configura .env
cp .env.example .env
nano .env
# Imposta DATABASE_URL, JWT_SECRET, etc.

# Migrazioni e seed
npm run migrate
npm run seed

# Avvia con PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Deploy Frontend

```bash
cd /home/dashboard/dashboard-nodejs/frontend

# Build production
npm install
npm run build

# Copia build in directory Nginx
sudo cp -r dist/* /var/www/dashboard/
```

### 5. Configurazione Nginx

```bash
sudo nano /etc/nginx/sites-available/dashboard
```

```nginx
# Frontend
server {
    listen 80;
    server_name dashboard.tgs.ovh;
    root /var/www/dashboard;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
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
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Attiva configurazione
sudo ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. SSL con Let's Encrypt (Opzionale)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d dashboard.tgs.ovh -d api.dashboard.tgs.ovh
```

## 🔒 Sicurezza

- ✅ JWT con refresh token
- ✅ Password hashing con bcrypt
- ✅ Helmet.js per security headers
- ✅ Rate limiting su endpoint sensibili
- ✅ CORS configurato
- ✅ Input validation con express-validator
- ✅ SQL injection protection (Sequelize ORM)
- ✅ XSS protection (React auto-escape)

## 📊 API Documentation

### Autenticazione

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
```

### Procedure

```http
GET    /api/procedures           # Lista tutte
GET    /api/procedures/:id       # Dettaglio
POST   /api/procedures           # Crea (Admin/Editor)
PUT    /api/procedures/:id       # Aggiorna (Owner/Admin)
DELETE /api/procedures/:id       # Elimina (Owner/Admin)
GET    /api/procedures/:id/download
```

### Utenti (Admin only)

```http
GET    /api/users               # Lista utenti
GET    /api/users/:id           # Dettaglio utente
PATCH  /api/users/:id/role      # Modifica ruolo
DELETE /api/users/:id           # Elimina utente
PATCH  /api/users/:id/active    # Attiva/disattiva
```

### Ricerca

```http
GET /api/search?q=<query>      # Ricerca full-text
```

Documentazione completa Swagger: `http://api.dashboard.tgs.ovh/api-docs`

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report

# Frontend tests
cd frontend
npm run test              # Run all tests
npm run test:ui           # UI mode
```

## 📈 Monitoring

### PM2 Monitoring

```bash
pm2 monit              # Dashboard real-time
pm2 logs               # View logs
pm2 status             # Status applicazioni
```

### Log Locations

```
/var/log/nginx/dashboard-access.log
/var/log/nginx/dashboard-error.log
~/.pm2/logs/dashboard-api-error.log
~/.pm2/logs/dashboard-api-out.log
```

## 🔄 Backup

### Database Backup

```bash
# Backup automatico giornaliero
pg_dump dashboard_db > backup_$(date +%Y%m%d).sql

# Restore
psql dashboard_db < backup_20260116.sql
```

### Files Backup

```bash
# Backup directory uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/src/uploads/
```

## 🤝 Contributing

1. Fork il repository
2. Crea feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit le modifiche (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri Pull Request

## 📝 License

MIT License - vedi file LICENSE

## 👤 Autore

**Salvo**
- Progetto: Dashboard Procedure Operative
- Stack: Telecommunications Infrastructure @ FiberCop

## 🆘 Supporto

Per bug, feature request o domande:
- GitHub Issues: https://github.com/turiliffiu/dashboard-nodejs/issues
- Email: support@tgs.ovh

## 📚 Documentazione Aggiuntiva

- [Guida API](docs/API.md)
- [Guida Deployment](docs/DEPLOYMENT.md)
- [Guida Sviluppo](docs/DEVELOPMENT.md)
- [Migrazione da Django](docs/MIGRATION.md)

---

**Versione**: 1.0.0  
**Data Rilascio**: Gennaio 2026  
**Status**: Production Ready ✅
