# Dashboard Backend - Node.js + Express + PostgreSQL

API REST per Dashboard Procedure Operative.

## 🚀 Quick Start

### Prerequisiti
- Node.js >= 20.x
- PostgreSQL >= 16.x
- npm >= 10.x

### Installazione

```bash
# Installa dipendenze
npm install

# Copia configurazione
cp .env.example .env

# Modifica .env con le tue credenziali database
nano .env
```

### Setup Database

```bash
# Crea database PostgreSQL
createdb dashboard_db

# Esegui migrazioni
npm run migrate

# (Opzionale) Popola con dati esempio
npm run seed
```

### Avvio

```bash
# Development (con hot reload)
npm run dev

# Production
npm start
```

Server disponibile su: `http://localhost:3000`

## 📚 API Endpoints

### Autenticazione
- `POST /api/auth/register` - Registrazione
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Utente corrente

### Procedure
- `GET /api/procedures` - Lista procedure
- `GET /api/procedures/:id` - Dettaglio procedura
- `POST /api/procedures` - Crea procedura (multipart/form-data)
- `PUT /api/procedures/:id` - Aggiorna metadati
- `PUT /api/procedures/:id/file` - Aggiorna file
- `DELETE /api/procedures/:id` - Elimina procedura
- `GET /api/procedures/:id/download` - Download file

### Utenti (Admin only)
- `GET /api/users` - Lista utenti
- `GET /api/users/:id` - Dettaglio utente
- `GET /api/users/me` - Profilo corrente
- `PUT /api/users/me` - Aggiorna profilo
- `PATCH /api/users/:id/role` - Cambia ruolo
- `PATCH /api/users/:id/active` - Attiva/disattiva
- `DELETE /api/users/:id` - Elimina utente

### Ricerca
- `GET /api/search?q=<query>` - Ricerca full-text

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 🛠️ Scripts Utili

```bash
# Linting
npm run lint

# Formatting
npm run format

# Migrazioni
npm run migrate         # Esegui tutte
npm run migrate:undo    # Rollback ultima

# Seeding
npm run seed            # Esegui tutti i seed
npm run seed:undo       # Rollback tutti i seed
```

## 📦 Deployment con PM2

```bash
# Installa PM2 globalmente
npm install -g pm2

# Avvia con PM2
pm2 start ecosystem.config.js

# Status
pm2 status

# Logs
pm2 logs dashboard-api

# Restart
pm2 restart dashboard-api

# Stop
pm2 stop dashboard-api
```

## 🔒 Sicurezza

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Helmet.js security headers
- ✅ Rate limiting
- ✅ CORS configurato
- ✅ Input validation
- ✅ SQL injection protection (Sequelize ORM)

## 📝 Environment Variables

Vedi `.env.example` per tutte le variabili disponibili.

Variabili essenziali:
- `DATABASE_URL` - Connection string PostgreSQL
- `JWT_SECRET` - Secret key per JWT
- `FRONTEND_URL` - URL frontend per CORS

## 🗂️ Struttura Directory

```
backend/
├── src/
│   ├── config/         # Configurazioni (DB, JWT, Multer)
│   ├── models/         # Modelli Sequelize
│   ├── controllers/    # Controller logica business
│   ├── middleware/     # Middleware custom
│   ├── routes/         # Definizioni route
│   ├── utils/          # Utility functions
│   ├── migrations/     # Migrazioni database
│   ├── seeders/        # Seeder dati iniziali
│   ├── uploads/        # File caricati
│   ├── app.js          # Express app setup
│   └── server.js       # Server entry point
├── tests/              # Test suite
├── .env.example        # Template environment variables
└── package.json
```

## 👤 Utente Default (dopo seed)

- Username: `admin`
- Password: `admin123`
- Ruolo: Administrator

**⚠️ IMPORTANTE:** Cambia la password in produzione!

## 🐛 Troubleshooting

### Database connection error
```bash
# Verifica che PostgreSQL sia in esecuzione
sudo systemctl status postgresql

# Verifica credenziali in .env
echo $DATABASE_URL
```

### Port già in uso
```bash
# Cambia PORT in .env
PORT=3001
```

### File upload error
```bash
# Verifica permessi directory uploads
chmod -R 755 src/uploads
```

## 📖 Documentazione

Per documentazione completa API, visita: `http://localhost:3000/api`

## 🤝 Contributing

1. Crea branch feature
2. Commit modifiche
3. Push al branch
4. Apri Pull Request

## 📄 License

MIT
