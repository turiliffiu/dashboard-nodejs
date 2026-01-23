# 📚 GUIDA DIDATTICA COMPLETA - Dashboard Procedure Operative

## 🎯 Obiettivo del Documento

Questo documento ti spiegherà in modo dettagliato **come funziona** l'applicazione Dashboard Procedure Operative, dall'architettura generale fino ai singoli componenti. È pensato per **imparare e capire** ogni aspetto tecnico del progetto.

---

## 📋 INDICE

1. [Panoramica Generale](#1-panoramica-generale)
2. [Architettura del Sistema](#2-architettura-del-sistema)
3. [Database e Modelli](#3-database-e-modelli)
4. [Backend - Express API](#4-backend---express-api)
5. [Frontend - React SPA](#5-frontend---react-spa)
6. [Autenticazione e Sicurezza](#6-autenticazione-e-sicurezza)
7. [Flussi Operativi Principali](#7-flussi-operativi-principali)
8. [Deployment e Infrastruttura](#8-deployment-e-infrastruttura)
9. [Best Practices Utilizzate](#9-best-practices-utilizzate)
10. [Possibili Miglioramenti Futuri](#10-possibili-miglioramenti-futuri)

---

## 1. PANORAMICA GENERALE

### 1.1 Cos'è il Progetto?

La **Dashboard Procedure Operative** è un'applicazione web moderna per:
- ✅ **Archiviare** procedure operative tecniche
- ✅ **Gestire** file `.txt` strutturati con comandi
- ✅ **Ricercare** rapidamente tra le procedure
- ✅ **Riutilizzare** comandi con copy-to-clipboard
- ✅ **Collaborare** con sistema multi-utente e permessi

### 1.2 Stack Tecnologico

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  React 18 + Vite + Tailwind CSS + React Router          │
└────────────────┬────────────────────────────────────────┘
                 │ HTTP REST API (JSON)
                 │
┌────────────────▼────────────────────────────────────────┐
│                 BACKEND (Express)                        │
│  Node.js 20 + Express 4 + JWT + Sequelize ORM          │
└────────────────┬────────────────────────────────────────┘
                 │ SQL Queries
                 │
┌────────────────▼────────────────────────────────────────┐
│                DATABASE (PostgreSQL)                     │
│  PostgreSQL 16 + Relational Schema                      │
└─────────────────────────────────────────────────────────┘
```

### 1.3 Principi di Design

1. **Separation of Concerns**: Frontend, Backend, Database separati
2. **RESTful API**: Comunicazione stateless via HTTP
3. **JWT Authentication**: Token-based auth senza session server
4. **ORM Pattern**: Sequelize astrae il database
5. **Component-Based UI**: React con componenti riutilizzabili
6. **Mobile-First**: Design responsivo con Tailwind CSS

---

## 2. ARCHITETTURA DEL SISTEMA

### 2.1 Struttura Directory

```
dashboard-nodejs/
│
├── backend/                    # Backend Express API
│   ├── src/
│   │   ├── config/            # Configurazioni (DB, JWT, Multer)
│   │   │   ├── database.js    # Connessione PostgreSQL
│   │   │   ├── jwt.js         # Configurazione JWT
│   │   │   └── multer.js      # Upload file
│   │   │
│   │   ├── models/            # Modelli Sequelize (ORM)
│   │   │   ├── User.js        # Modello Utente
│   │   │   ├── UserProfile.js # Profilo Utente
│   │   │   └── ProcedureCategory.js # Modello Procedure
│   │   │
│   │   ├── controllers/       # Business Logic
│   │   │   ├── authController.js      # Login/Register
│   │   │   ├── userController.js      # CRUD Utenti
│   │   │   ├── procedureController.js # CRUD Procedure
│   │   │   └── searchController.js    # Ricerca
│   │   │
│   │   ├── routes/            # Definizione Endpoint API
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── procedure.routes.js
│   │   │   └── search.routes.js
│   │   │
│   │   ├── middleware/        # Middleware Express
│   │   │   ├── auth.js        # Verifica JWT
│   │   │   ├── roleCheck.js   # Controllo ruoli
│   │   │   └── errorHandler.js # Gestione errori
│   │   │
│   │   ├── utils/             # Utility functions
│   │   │   ├── parser.js      # Parser file .txt
│   │   │   └── permissions.js # Logica permessi
│   │   │
│   │   ├── migrations/        # Migrazioni database
│   │   ├── seeders/           # Dati iniziali
│   │   ├── uploads/           # File caricati
│   │   ├── app.js             # Configurazione Express
│   │   └── server.js          # Entry point server
│   │
│   └── package.json           # Dipendenze backend
│
├── frontend/                  # Frontend React SPA
│   ├── src/
│   │   ├── components/       # Componenti React
│   │   │   ├── ProcedureModal.jsx        # Modal dettaglio
│   │   │   ├── EditProcedureModal.jsx    # Modal modifica
│   │   │   ├── UploadProcedureModal.jsx  # Modal upload
│   │   │   ├── ChangePasswordModal.jsx   # Cambio password
│   │   │   └── SearchBar.jsx             # Barra ricerca
│   │   │
│   │   ├── pages/            # Pagine applicazione
│   │   │   ├── LoginPage.jsx        # Pagina login
│   │   │   ├── DashboardPage.jsx    # Dashboard principale
│   │   │   └── UserManagementPage.jsx # Gestione utenti
│   │   │
│   │   ├── services/         # API Service Layer
│   │   │   ├── api.js              # Axios instance
│   │   │   ├── authService.js      # Auth API
│   │   │   ├── userService.js      # User API
│   │   │   ├── procedureService.js # Procedure API
│   │   │   └── searchService.js    # Search API
│   │   │
│   │   ├── styles/           # CSS/Tailwind
│   │   ├── App.jsx           # Componente root
│   │   └── main.jsx          # Entry point
│   │
│   └── package.json          # Dipendenze frontend
│
├── deploy/                   # Script deployment
│   └── scripts/             # Script automatizzati
│
├── README.md                # Documentazione principale
├── DEPLOYMENT_GUIDE.md      # Guida deployment
└── LICENSE                  # Licenza MIT
```

### 2.2 Flusso di una Richiesta

```
1. UTENTE clicca su "Visualizza Procedura"
   ↓
2. REACT intercetta evento onClick
   ↓
3. COMPONENT chiama procedureService.getById(id)
   ↓
4. API SERVICE fa richiesta HTTP GET /api/procedures/:id
   ↓
5. NGINX riceve richiesta e proxy pass a Express
   ↓
6. EXPRESS riceve richiesta su route /api/procedures/:id
   ↓
7. MIDDLEWARE auth verifica JWT token
   ↓
8. ROUTER chiama procedureController.getById()
   ↓
9. CONTROLLER interroga database via Sequelize
   ↓
10. SEQUELIZE esegue query SQL su PostgreSQL
    ↓
11. DATABASE restituisce dati
    ↓
12. CONTROLLER formatta risposta JSON
    ↓
13. EXPRESS invia risposta HTTP al client
    ↓
14. API SERVICE riceve dati
    ↓
15. COMPONENT aggiorna stato React
    ↓
16. REACT re-renderizza UI con nuovi dati
    ↓
17. UTENTE vede il modal con la procedura
```

---

## 3. DATABASE E MODELLI

### 3.1 Schema Database

```sql
-- Tabella Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(150),
    last_name VARCHAR(150),
    is_active BOOLEAN DEFAULT true,
    is_superuser BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabella User Profiles
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'viewer',
    bio TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabella Procedure Categories
CREATE TABLE procedure_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(10) DEFAULT '📄',
    description TEXT,
    filename VARCHAR(100) UNIQUE NOT NULL,
    order INTEGER DEFAULT 0,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX idx_procedures_owner ON procedure_categories(owner_id);
CREATE INDEX idx_procedures_public ON procedure_categories(is_public);
CREATE INDEX idx_procedures_order ON procedure_categories(order);
```

### 3.2 Relazioni tra Tabelle

```
┌─────────────┐           ┌──────────────────┐
│    User     │◄─────1:1──┤  User Profile    │
│             │           │                  │
│ - id        │           │ - user_id (FK)   │
│ - username  │           │ - role           │
│ - password  │           │ - bio            │
│ - email     │           └──────────────────┘
└──────┬──────┘
       │
       │ 1:N
       │
       ▼
┌─────────────────────┐
│ Procedure Category  │
│                     │
│ - id                │
│ - name              │
│ - filename          │
│ - owner_id (FK)     │
│ - is_public         │
└─────────────────────┘
```

### 3.3 Modello User (Sequelize)

**File**: `backend/src/models/User.js`

```javascript
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    // Campi
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 150],    // Lunghezza 3-150 caratteri
        notEmpty: true,   // Non può essere vuoto
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [6, 255],    // Minimo 6 caratteri
      },
    },
    // ... altri campi
  }, {
    // Opzioni
    tableName: 'users',
    timestamps: true,
    
    // HOOKS: funzioni che si eseguono automaticamente
    hooks: {
      // PRIMA di creare utente → hash password
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      // PRIMA di aggiornare utente → hash password se cambiata
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
    },
  });

  // METODO: Confronta password
  User.prototype.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  // METODO: Rimuovi password da JSON (sicurezza)
  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password;  // Non inviare mai password al client!
    return values;
  };

  return User;
};
```

**Concetti Chiave:**

1. **Validazioni**: Sequelize valida i dati prima di salvarli
2. **Hooks**: Funzioni automatiche (es. hash password)
3. **Prototype Methods**: Metodi personalizzati sul modello
4. **toJSON Override**: Customizza cosa viene serializzato

### 3.4 Modello ProcedureCategory

**File**: `backend/src/models/ProcedureCategory.js`

```javascript
ProcedureCategory.prototype.canUserEdit = function(user) {
  if (!user) return false;                    // Nessun utente? No
  if (user.isSuperuser) return true;          // Superuser? Sì
  if (user.profile?.role === 'admin') return true;  // Admin? Sì
  // Editor può modificare solo le SUE procedure
  if (user.profile?.role === 'editor' && this.ownerId === user.id) {
    return true;
  }
  return false;
};
```

**Sistema Permessi:**
- **Admin**: Può modificare/eliminare TUTTO
- **Editor**: Può modificare/eliminare solo le SUE procedure
- **Viewer**: Può solo visualizzare procedure pubbliche

---

## 4. BACKEND - EXPRESS API

### 4.1 Entry Point Server

**File**: `backend/src/server.js`

```javascript
require('dotenv').config();  // Carica variabili .env

const app = require('./app');               // Express app
const { testConnection } = require('./models');  // Test DB

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // 1. Testa connessione database
    await testConnection();
    
    // 2. Avvia server HTTP
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

**Sequenza Avvio:**
1. Carica variabili ambiente (`.env`)
2. Testa connessione PostgreSQL
3. Avvia server HTTP su porta 3000
4. Se errore → termina processo

### 4.2 Configurazione Express

**File**: `backend/src/app.js`

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// 1. SECURITY MIDDLEWARE
app.use(helmet());  // Security headers
app.use(cors({
  origin: ['http://localhost:5173'],  // Solo questo frontend
  credentials: true,
}));

// 2. RATE LIMITING (previene brute-force)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minuti
  max: 100,                   // Max 100 richieste
});
app.use('/api/', limiter);

// 3. BODY PARSERS
app.use(express.json());  // Parse JSON nel body

// 4. ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/procedures', procedureRoutes);
app.use('/api/search', searchRoutes);

// 5. ERROR HANDLERS
app.use(notFoundHandler);  // 404
app.use(errorHandler);     // 500

module.exports = app;
```

**Ordine Middleware Importante!**
1. Security (helmet, cors)
2. Rate limiting
3. Body parser
4. Routes
5. Error handlers (sempre ultimi!)

### 4.3 Middleware Autenticazione

**File**: `backend/src/middleware/auth.js`

```javascript
const jwt = require('jsonwebtoken');
const { User, UserProfile } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    // 1. Estrai token dall'header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);  // Rimuovi "Bearer "
    
    // 2. Verifica e decodifica token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Carica utente dal database
    const user = await User.findByPk(decoded.id, {
      include: [{ model: UserProfile, as: 'profile' }],
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // 4. Aggiungi utente a req per i controller successivi
    req.user = user;
    req.userId = user.id;
    
    // 5. Passa al prossimo middleware/controller
    next();
    
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
```

**Flusso Autenticazione:**
```
Request con header:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

    ↓ authMiddleware()
    
1. Estrae token
2. Verifica firma JWT
3. Decodifica payload
4. Carica user dal DB
5. Aggiunge user a req
6. Chiama next()

    ↓ Controller riceve req.user
```

### 4.4 Controller Esempio: AuthController

**File**: `backend/src/controllers/authController.js`

```javascript
class AuthController {
  /**
   * POST /api/auth/login
   * Body: { username, password }
   */
  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      
      // 1. Trova utente
      const user = await User.findOne({ 
        where: { username },
        include: [{ model: UserProfile, as: 'profile' }],
      });
      
      // 2. Verifica esistenza
      if (!user) {
        return res.status(401).json({ 
          error: 'Credenziali non valide' 
        });
      }
      
      // 3. Verifica password (usa bcrypt.compare)
      const isValid = await user.comparePassword(password);
      if (!isValid) {
        return res.status(401).json({ 
          error: 'Credenziali non valide' 
        });
      }
      
      // 4. Verifica account attivo
      if (!user.isActive) {
        return res.status(403).json({ 
          error: 'Account disattivato' 
        });
      }
      
      // 5. Genera JWT token
      const token = generateToken(user);
      
      // 6. Aggiorna last_login
      user.lastLogin = new Date();
      await user.save();
      
      // 7. Risposta con token e user
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.profile?.role || 'viewer',
        },
      });
      
    } catch (error) {
      next(error);  // Passa errore al middleware errorHandler
    }
  }
}
```

**Pattern Controller:**
1. Estrai dati da `req.body` / `req.params` / `req.query`
2. Valida input
3. Esegui business logic (query DB, calcoli, ecc.)
4. Formatta risposta
5. Invia JSON con `res.json()`
6. Gestisci errori con `next(error)`

### 4.5 Routes Definition

**File**: `backend/src/routes/procedure.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const procedureController = require('../controllers/procedureController');

// PUBBLICHE (senza auth)
// Nessuna per le procedure

// AUTENTICATE (con JWT)
router.get('/', 
  authMiddleware,                    // 1. Verifica JWT
  procedureController.getAll         // 2. Esegui controller
);

router.get('/:id', 
  authMiddleware, 
  procedureController.getById
);

// SOLO ADMIN/EDITOR
router.post('/', 
  authMiddleware,                    // 1. Verifica JWT
  roleCheck(['admin', 'editor']),    // 2. Verifica ruolo
  procedureController.create         // 3. Esegui controller
);

router.put('/:id', 
  authMiddleware, 
  procedureController.update  // Controllo owner dentro controller
);

router.delete('/:id', 
  authMiddleware, 
  procedureController.delete
);

// DOWNLOAD (solo Editor+ e Admin)
router.get('/:id/download',
  authMiddleware,
  roleCheck(['admin', 'editor']),
  procedureController.download
);

module.exports = router;
```

**Stack Middleware per ogni Route:**
```
GET /api/procedures/:id
    ↓
1. authMiddleware → Verifica JWT, carica user
    ↓
2. procedureController.getById → Business logic
    ↓
3. Response JSON
```

---

## 5. FRONTEND - REACT SPA

### 5.1 Entry Point React

**File**: `frontend/src/main.jsx`

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';  // Tailwind CSS

// Render app React nel DOM
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 5.2 App Component (Routing)

**File**: `frontend/src/App.jsx`

```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UserManagementPage from './pages/UserManagementPage';

function App() {
  return (
    <BrowserRouter>
      {/* Notifiche toast */}
      <ToastContainer 
        position="top-right"
        autoClose={3000}
      />
      
      {/* Route definition */}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UserManagementPage />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

**Concetto Routing:**
- URL `/login` → Renderizza `<LoginPage />`
- URL `/dashboard` → Renderizza `<DashboardPage />`
- URL `/` → Redirect a `/dashboard`

### 5.3 API Service Layer

**File**: `frontend/src/services/api.js`

```javascript
import axios from 'axios';

// Crea istanza axios con config di base
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// INTERCEPTOR REQUEST: Aggiungi JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// INTERCEPTOR RESPONSE: Gestisci 401 (redirect login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

**Interceptors:**
- **Request**: Aggiungi automaticamente JWT token ad ogni richiesta
- **Response**: Se 401 (Unauthorized) → logout + redirect login

### 5.4 Auth Service

**File**: `frontend/src/services/authService.js`

```javascript
import api from './api';

const authService = {
  // LOGIN
  async login(username, password) {
    const response = await api.post('/auth/login', {
      username,
      password,
    });
    
    // Salva token e user in localStorage
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  },
  
  // LOGOUT
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  // VERIFICA SE AUTENTICATO
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
  
  // GET CURRENT USER
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  // CAMBIO PASSWORD
  async changePassword(currentPassword, newPassword, confirmPassword) {
    const response = await api.put('/users/me/password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },
};

export default authService;
```

**Strategia Autenticazione:**
1. Login → Ricevi JWT token
2. Salva token in `localStorage`
3. Ogni richiesta → Aggiungi token in header (via interceptor)
4. Logout → Rimuovi token da `localStorage`

### 5.5 Component Esempio: DashboardPage

**File**: `frontend/src/pages/DashboardPage.jsx`

```javascript
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/authService';
import procedureService from '../services/procedureService';
import ProcedureModal from '../components/ProcedureModal';
import SearchBar from '../components/SearchBar';

function DashboardPage() {
  // STATE
  const [user, setUser] = useState(null);
  const [procedures, setProcedures] = useState([]);
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  
  // EFFECT: Carica dati al mount
  useEffect(() => {
    // Verifica autenticazione
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    // Carica user e procedure
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    loadProcedures();
  }, [navigate]);
  
  // FUNCTION: Carica procedure dal backend
  const loadProcedures = async () => {
    try {
      const response = await procedureService.getAll();
      setProcedures(response.data || []);
    } catch (error) {
      toast.error('Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  };
  
  // FUNCTION: Apri dettaglio procedura
  const handleOpenProcedure = async (id) => {
    try {
      const response = await procedureService.getById(id);
      setSelectedProcedure(response.data);
    } catch (error) {
      toast.error('Errore nel caricamento');
    }
  };
  
  // RENDER
  if (loading) {
    return <div>Caricamento...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold">
          Dashboard Procedure
        </h1>
        <p>Benvenuto, {user?.username}!</p>
      </header>
      
      {/* Search Bar */}
      <SearchBar onSearch={handleSearch} />
      
      {/* Procedure Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {procedures.map((proc) => (
          <div 
            key={proc.id}
            onClick={() => handleOpenProcedure(proc.id)}
            className="bg-white p-4 rounded-lg cursor-pointer hover:shadow-lg"
          >
            <h3>{proc.name}</h3>
            <p>{proc.description}</p>
          </div>
        ))}
      </div>
      
      {/* Modal Dettaglio */}
      {selectedProcedure && (
        <ProcedureModal 
          procedure={selectedProcedure}
          onClose={() => setSelectedProcedure(null)}
        />
      )}
    </div>
  );
}

export default DashboardPage;
```

**Pattern React Component:**

1. **State** (`useState`): Dati che cambiano nel tempo
2. **Effect** (`useEffect`): Side effects (API calls, subscriptions)
3. **Functions**: Handler eventi
4. **Render**: JSX che descrive l'UI

**Ciclo di Vita:**
```
1. Component Mount
    ↓
2. useEffect() runs → Carica dati
    ↓
3. setState() → Trigger re-render
    ↓
4. React update DOM
    ↓
5. User interaction (click)
    ↓
6. Handler function → setState()
    ↓
7. Re-render con nuovi dati
```

### 5.6 Component Modal

**File**: `frontend/src/components/ProcedureModal.jsx`

```javascript
function ProcedureModal({ procedure, onClose }) {
  // Copy to clipboard
  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copiato!');
    } catch (error) {
      toast.error('Errore nella copia');
    }
  };
  
  return (
    // Backdrop (sfondo scuro)
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Modal Content */}
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between">
          <h2>{procedure.name}</h2>
          <button onClick={onClose}>✕</button>
        </div>
        
        {/* Body */}
        <div className="p-6">
          <p>{procedure.description}</p>
          
          {/* Commands */}
          {procedure.commands?.map((cmd, index) => (
            <div key={index} className="bg-gray-100 p-3 rounded mt-2">
              <code>{cmd.text}</code>
              <button onClick={() => handleCopy(cmd.text)}>
                📋 Copia
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Tailwind CSS Classes:**
- `fixed inset-0`: Posizione fissa, copre tutto lo schermo
- `bg-black bg-opacity-50`: Sfondo nero semi-trasparente
- `flex items-center justify-center`: Centra contenuto
- `rounded-lg`: Angoli arrotondati
- `hover:shadow-lg`: Ombra al hover

---

## 6. AUTENTICAZIONE E SICUREZZA

### 6.1 Flusso Completo Login

```
┌─────────────┐
│   BROWSER   │
└──────┬──────┘
       │ 1. User inserisce username/password
       │
       ▼
┌─────────────────────┐
│   LoginPage.jsx     │
│                     │
│ handleSubmit()      │
└──────┬──────────────┘
       │ 2. Chiama authService.login()
       │
       ▼
┌─────────────────────┐
│  authService.js     │
│                     │
│ POST /api/auth/login│
└──────┬──────────────┘
       │ 3. HTTP Request con body JSON
       │
       ▼
┌─────────────────────┐
│  EXPRESS SERVER     │
│                     │
│ auth.routes.js      │
└──────┬──────────────┘
       │ 4. Route → authController.login()
       │
       ▼
┌─────────────────────┐
│ authController.js   │
│                     │
│ 1. Trova user       │
│ 2. Verifica password│
│ 3. Genera JWT       │
└──────┬──────────────┘
       │ 5. Response con { token, user }
       │
       ▼
┌─────────────────────┐
│  authService.js     │
│                     │
│ Salva in localStorage│
└──────┬──────────────┘
       │ 6. navigate('/dashboard')
       │
       ▼
┌─────────────────────┐
│  DashboardPage.jsx  │
│                     │
│ Utente loggato!     │
└─────────────────────┘
```

### 6.2 Struttura JWT Token

**Token JWT**: 3 parti separate da `.`

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcwNjg4MDAwMH0.xyz123
│─────────── HEADER ────────────│─────────────── PAYLOAD ─────────────│─ SIGNATURE ─│
```

**Decodificato:**

```json
// HEADER
{
  "alg": "HS256",
  "typ": "JWT"
}

// PAYLOAD
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "iat": 1706880000,   // Issued At
  "exp": 1706966400    // Expiration
}

// SIGNATURE: HMAC-SHA256(base64(header) + "." + base64(payload), SECRET_KEY)
```

**Verifica Token:**
1. Divide token in 3 parti
2. Decodifica header e payload (base64)
3. Ricalcola firma con SECRET_KEY
4. Confronta firma: se uguale → **token valido**

### 6.3 Hashing Password (bcrypt)

```javascript
// REGISTRAZIONE
const plainPassword = 'myPassword123';
const hashedPassword = await bcrypt.hash(plainPassword, 10);
// → $2a$10$abc123xyz...

// Salvato nel DB: $2a$10$abc123xyz...

// LOGIN
const candidatePassword = 'myPassword123';
const isValid = await bcrypt.compare(candidatePassword, hashedPassword);
// → true
```

**bcrypt:**
- **Salt**: Valore random aggiunto alla password
- **Rounds**: 10 = 2^10 = 1024 iterazioni (più lento = più sicuro)
- **One-way**: Non si può "dehasare", solo confrontare

### 6.4 Sistema di Ruoli

**3 Ruoli:**

| Ruolo    | Permessi                                      |
|----------|----------------------------------------------|
| `admin`  | CRUD tutto, gestione utenti                  |
| `editor` | CRUD proprie procedure, view pubbliche       |
| `viewer` | Solo view procedure pubbliche                |

**Implementazione:**

```javascript
// Backend - Middleware roleCheck
const roleCheck = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.profile?.role;
    
    if (allowedRoles.includes(userRole)) {
      next();  // OK, procedi
    } else {
      res.status(403).json({ error: 'Forbidden' });
    }
  };
};

// Uso
router.post('/procedures', 
  authMiddleware,
  roleCheck(['admin', 'editor']),  // Solo admin e editor
  procedureController.create
);
```

---

## 7. FLUSSI OPERATIVI PRINCIPALI

### 7.1 Creazione Procedura

**Flusso Completo:**

```
1. USER clicca "Carica Procedura"
   ↓
2. MODAL si apre (UploadProcedureModal.jsx)
   ↓
3. USER seleziona file .txt e compila form
   ↓
4. USER clicca "Carica"
   ↓
5. FRONTEND legge file come testo
   ↓
6. FRONTEND invia POST /api/procedures con FormData:
   {
     name: "Procedura X",
     icon: "🔧",
     description: "...",
     fileContent: "contenuto file txt",
     isPublic: true
   }
   ↓
7. BACKEND riceve richiesta
   ↓
8. MIDDLEWARE verifica JWT e ruolo (admin/editor)
   ↓
9. CONTROLLER procedureController.create()
   - Verifica duplicati (nome, filename)
   - Salva file in /uploads/
   - Salva record in DB
   ↓
10. BACKEND risponde con { success: true, data: {...} }
    ↓
11. FRONTEND chiude modal e ricarica lista
    ↓
12. TOAST notifica "Procedura creata!"
```

**Codice Backend (semplificato):**

```javascript
async create(req, res, next) {
  try {
    const { name, icon, description, fileContent, isPublic } = req.body;
    
    // 1. Verifica duplicati
    const existing = await ProcedureCategory.findOne({ 
      where: { name } 
    });
    if (existing) {
      return res.status(409).json({ 
        error: 'Procedura già esistente' 
      });
    }
    
    // 2. Genera filename univoco
    const filename = `${slugify(name)}_${Date.now()}.txt`;
    
    // 3. Salva file su disco
    const filePath = path.join(__dirname, '../uploads', filename);
    await fs.writeFile(filePath, fileContent);
    
    // 4. Crea record in database
    const procedure = await ProcedureCategory.create({
      name,
      icon,
      description,
      filename,
      ownerId: req.userId,
      isPublic,
    });
    
    // 5. Risposta
    res.status(201).json({
      success: true,
      data: procedure,
    });
    
  } catch (error) {
    next(error);
  }
}
```

### 7.2 Ricerca Full-Text

**Backend - Search Controller:**

```javascript
async search(req, res, next) {
  try {
    const { q } = req.query;  // Query string: ?q=nginx
    
    if (!q || q.length < 2) {
      return res.json({ results: [] });
    }
    
    // Query PostgreSQL con ILIKE (case-insensitive)
    const procedures = await ProcedureCategory.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { description: { [Op.iLike]: `%${q}%` } },
        ],
      },
      limit: 20,
    });
    
    // Per ogni procedura, cerca nelle righe del file
    const results = [];
    for (const proc of procedures) {
      const filePath = path.join(__dirname, '../uploads', proc.filename);
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      
      // Trova righe che contengono query
      const matchingLines = lines.filter(line => 
        line.toLowerCase().includes(q.toLowerCase())
      );
      
      results.push({
        categoryId: proc.id,
        categoryName: proc.name,
        matches: matchingLines,
      });
    }
    
    res.json({ results });
    
  } catch (error) {
    next(error);
  }
}
```

**Frontend - Search Debouncing:**

```javascript
function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');
  
  // Debounce: aspetta 300ms dopo che user smette di digitare
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        onSearch(query);
      }
    }, 300);
    
    return () => clearTimeout(timer);  // Cleanup
  }, [query]);
  
  return (
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Cerca procedure..."
    />
  );
}
```

**Perché Debouncing?**
- User digita "nginx" → 5 caratteri = 5 API calls
- Con debounce: aspetta 300ms → 1 API call

### 7.3 Cambio Password

**Flusso:**

```
1. USER clicca "🔒 Cambia Password"
   ↓
2. MODAL ChangePasswordModal si apre
   ↓
3. USER inserisce:
   - Password attuale
   - Nuova password
   - Conferma nuova password
   ↓
4. FRONTEND valida:
   - Nuova password ≥ 6 caratteri
   - Nuova === Conferma
   ↓
5. FRONTEND invia PUT /users/me/password
   ↓
6. BACKEND verifica:
   - Password attuale corretta (bcrypt.compare)
   - Nuova password ≥ 6 caratteri
   ↓
7. BACKEND aggiorna password:
   - user.password = newPassword
   - await user.save()
   - Hook beforeUpdate → hash automatico
   ↓
8. BACKEND risponde { success: true }
   ↓
9. FRONTEND chiude modal e mostra toast "Password cambiata!"
```

---

## 8. DEPLOYMENT E INFRASTRUTTURA

### 8.1 Architettura Production

```
┌──────────────────────────────────────────────────────┐
│               INTERNET (Clients)                      │
└───────────────────┬──────────────────────────────────┘
                    │ HTTPS (443)
                    ▼
┌──────────────────────────────────────────────────────┐
│                  NGINX Reverse Proxy                  │
│                                                       │
│  - SSL Termination (Let's Encrypt)                   │
│  - Static Files (Frontend React)                     │
│  - Reverse Proxy → Backend API                       │
└───────┬──────────────────────┬───────────────────────┘
        │                      │
        │ Frontend             │ API Proxy
        │ (React SPA)          │
        ▼                      ▼
  ┌───────────┐         ┌─────────────────┐
  │  /var/www/│         │   PM2 Cluster   │
  │ dashboard │         │                 │
  │           │         │ ┌─────┐ ┌─────┐ │
  │ index.html│         │ │Node │ │Node │ │
  │ assets/   │         │ │ API │ │ API │ │
  └───────────┘         │ │:3000│ │:3000│ │
                        │ └─────┘ └─────┘ │
                        └────────┬────────┘
                                 │ SQL
                                 ▼
                        ┌─────────────────┐
                        │   PostgreSQL    │
                        │   Database      │
                        │                 │
                        │ - users         │
                        │ - user_profiles │
                        │ - procedures    │
                        └─────────────────┘
```

### 8.2 Nginx Configuration

**File**: `/etc/nginx/sites-available/dashboard`

```nginx
# FRONTEND - Serve React SPA
server {
    listen 80;
    server_name dashboard.tgs.ovh;
    
    root /var/www/dashboard;
    index index.html;
    
    # Serve tutti i file statici
    location / {
        try_files $uri $uri/ /index.html;
        # React Router: tutte le route → index.html
    }
    
    # Cache asset statici (JS, CSS, immagini)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# BACKEND - Reverse proxy a Node.js
server {
    listen 80;
    server_name api.dashboard.tgs.ovh;
    
    location / {
        # Proxy pass a PM2
        proxy_pass http://localhost:3000;
        
        # Headers necessari
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Spiegazione:**
- **Frontend**: Nginx serve direttamente file statici (veloce!)
- **Backend**: Nginx fa reverse proxy a Node.js (porta 3000)
- **Cache**: Asset statici cachati per 1 anno (performance!)

### 8.3 PM2 Configuration

**File**: `backend/ecosystem.config.js`

```javascript
module.exports = {
  apps: [
    {
      name: 'dashboard-api',
      script: './src/server.js',
      instances: 2,              // 2 processi Node.js
      exec_mode: 'cluster',      // Cluster mode per load balancing
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '500M',  // Restart se > 500MB
      watch: false,
    },
  ],
};
```

**Comandi PM2:**
```bash
pm2 start ecosystem.config.js  # Avvia
pm2 restart dashboard-api       # Riavvia
pm2 logs dashboard-api          # Vedi logs
pm2 monit                       # Monitor real-time
pm2 save                        # Salva stato
pm2 startup                     # Auto-start al boot
```

**Cluster Mode:**
```
PM2
 ├─ Node Process 1 (PID 1234) → Port 3000
 └─ Node Process 2 (PID 1235) → Port 3000
 
Nginx → Round-robin tra i 2 processi
```

### 8.4 Database Backup

**Script Backup Automatico:**

```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/database"
DB_NAME="dashboard_db"

# Crea directory se non esiste
mkdir -p $BACKUP_DIR

# Dump database
pg_dump $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Comprimi
gzip $BACKUP_DIR/backup_$DATE.sql

# Rimuovi backup > 30 giorni
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "✅ Backup completato: backup_$DATE.sql.gz"
```

**Cron Job (backup giornaliero 2:00 AM):**
```bash
crontab -e

# Aggiungi:
0 2 * * * /opt/scripts/backup-db.sh >> /var/log/backup.log 2>&1
```

---

## 9. BEST PRACTICES UTILIZZATE

### 9.1 Backend Best Practices

**1. Environment Variables**
```javascript
// ❌ BAD
const dbPassword = 'mypassword123';

// ✅ GOOD
const dbPassword = process.env.DB_PASSWORD;
```

**2. Error Handling**
```javascript
// ❌ BAD
app.get('/users/:id', async (req, res) => {
  const user = await User.findByPk(req.params.id);
  res.json(user);  // Se errore → crash!
});

// ✅ GOOD
app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);  // Passa al middleware errorHandler
  }
});
```

**3. Input Validation**
```javascript
// ❌ BAD
const email = req.body.email;
// Nessuna validazione!

// ✅ GOOD
const { body, validationResult } = require('express-validator');

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Procedi...
});
```

**4. SQL Injection Prevention**
```javascript
// ❌ BAD (vulnerable!)
const query = `SELECT * FROM users WHERE username = '${username}'`;
db.query(query);

// ✅ GOOD (Sequelize ORM)
const user = await User.findOne({ where: { username } });
// Sequelize usa prepared statements automaticamente
```

**5. Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minuti
  max: 100,                   // Max 100 richieste
  message: 'Troppe richieste',
});

app.use('/api/', limiter);
```

### 9.2 Frontend Best Practices

**1. Component Composition**
```javascript
// ❌ BAD - Componente monolitico
function DashboardPage() {
  return (
    <div>
      {/* 500 righe di JSX... */}
    </div>
  );
}

// ✅ GOOD - Componenti piccoli e riutilizzabili
function DashboardPage() {
  return (
    <div>
      <Header />
      <SearchBar />
      <ProcedureGrid />
      <Footer />
    </div>
  );
}
```

**2. Custom Hooks**
```javascript
// ✅ GOOD - Logica riutilizzabile
function useProcedures() {
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadProcedures();
  }, []);
  
  const loadProcedures = async () => {
    const data = await procedureService.getAll();
    setProcedures(data);
    setLoading(false);
  };
  
  return { procedures, loading, reload: loadProcedures };
}

// Uso in component
function MyComponent() {
  const { procedures, loading, reload } = useProcedures();
  // ...
}
```

**3. Conditional Rendering**
```javascript
// ✅ GOOD
{loading && <Spinner />}
{error && <ErrorMessage error={error} />}
{procedures.length === 0 && <EmptyState />}
{procedures.length > 0 && <ProcedureGrid data={procedures} />}
```

**4. Prop Types / TypeScript**
```javascript
// Con PropTypes
import PropTypes from 'prop-types';

function ProcedureCard({ procedure }) {
  return <div>{procedure.name}</div>;
}

ProcedureCard.propTypes = {
  procedure: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
  }).isRequired,
};
```

### 9.3 Security Best Practices

**1. XSS Prevention (React auto-escape)**
```javascript
// ✅ GOOD - React escapa automaticamente
const userInput = '<script>alert("xss")</script>';
return <div>{userInput}</div>;
// Renderizza come testo, NON esegue script

// ❌ ATTENZIONE - dangerouslySetInnerHTML
return <div dangerouslySetInnerHTML={{ __html: userInput }} />;
// Evitare a meno che necessario!
```

**2. CSRF Protection**
```javascript
// Backend - Verifica Origin header
app.use(cors({
  origin: ['https://dashboard.tgs.ovh'],
  credentials: true,
}));

// Frontend - Invia token in header (non cookie)
api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

**3. Helmet.js Security Headers**
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  hsts: {
    maxAge: 31536000,  // 1 anno
    includeSubDomains: true,
  },
}));
```

---

## 10. POSSIBILI MIGLIORAMENTI FUTURI

### 10.1 Performance

**1. Database Indexing**
```sql
-- Aggiungi indici per query frequenti
CREATE INDEX idx_procedures_name ON procedure_categories(name);
CREATE INDEX idx_procedures_owner_public ON procedure_categories(owner_id, is_public);
```

**2. Redis Caching**
```javascript
// Cache procedure frequenti
const redis = require('redis');
const client = redis.createClient();

async function getProcedure(id) {
  // 1. Prova cache
  const cached = await client.get(`procedure:${id}`);
  if (cached) return JSON.parse(cached);
  
  // 2. Query DB
  const procedure = await ProcedureCategory.findByPk(id);
  
  // 3. Salva in cache (TTL 5 minuti)
  await client.setex(`procedure:${id}`, 300, JSON.stringify(procedure));
  
  return procedure;
}
```

**3. Lazy Loading (Frontend)**
```javascript
// Carica componenti solo quando servono
import { lazy, Suspense } from 'react';

const UserManagementPage = lazy(() => import('./pages/UserManagementPage'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/users" element={<UserManagementPage />} />
      </Routes>
    </Suspense>
  );
}
```

### 10.2 Features

**1. Versioning Procedure**
```sql
CREATE TABLE procedure_versions (
    id SERIAL PRIMARY KEY,
    procedure_id INTEGER REFERENCES procedure_categories(id),
    version INTEGER,
    content TEXT,
    changed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

**2. Notifiche Real-time (WebSocket)**
```javascript
// Backend
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  console.log('User connected');
  
  socket.on('join-room', (procedureId) => {
    socket.join(`procedure:${procedureId}`);
  });
});

// Quando procedura modificata
io.to(`procedure:${id}`).emit('procedure-updated', data);

// Frontend
import io from 'socket.io-client';

const socket = io('ws://localhost:3000');
socket.on('procedure-updated', (data) => {
  toast.info('Procedura aggiornata!');
  reload();
});
```

**3. Esportazione PDF**
```javascript
const PDFDocument = require('pdfkit');

async function exportToPDF(procedureId) {
  const procedure = await ProcedureCategory.findByPk(procedureId);
  
  const doc = new PDFDocument();
  doc.fontSize(20).text(procedure.name);
  doc.fontSize(12).text(procedure.description);
  
  // Aggiungi comandi
  doc.list(procedure.commands.map(c => c.text));
  
  doc.end();
  return doc;
}
```

### 10.3 Testing

**1. Unit Tests (Backend)**
```javascript
// test/controllers/authController.test.js
const { login } = require('../src/controllers/authController');

describe('AuthController', () => {
  describe('login', () => {
    it('should return token for valid credentials', async () => {
      const req = {
        body: { username: 'admin', password: 'admin123' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };
      
      await login(req, res);
      
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ token: expect.any(String) })
      );
    });
  });
});
```

**2. Integration Tests (API)**
```javascript
const request = require('supertest');
const app = require('../src/app');

describe('GET /api/procedures', () => {
  it('should require authentication', async () => {
    const response = await request(app).get('/api/procedures');
    expect(response.status).toBe(401);
  });
  
  it('should return procedures for authenticated user', async () => {
    const token = 'valid-jwt-token';
    const response = await request(app)
      .get('/api/procedures')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
  });
});
```

**3. E2E Tests (Frontend)**
```javascript
// Con Cypress
describe('Dashboard', () => {
  it('should login and view procedures', () => {
    cy.visit('/login');
    cy.get('[data-testid="username"]').type('admin');
    cy.get('[data-testid="password"]').type('admin123');
    cy.get('[data-testid="submit"]').click();
    
    cy.url().should('include', '/dashboard');
    cy.contains('Dashboard Procedure');
    cy.get('[data-testid="procedure-card"]').should('have.length.gt', 0);
  });
});
```

---

## 🎓 CONCLUSIONE

Questo documento ha coperto:

✅ **Architettura generale** del sistema  
✅ **Database** e modelli Sequelize  
✅ **Backend** con Express, JWT, middleware  
✅ **Frontend** con React, componenti, hooks  
✅ **Autenticazione** e sicurezza  
✅ **Flussi operativi** completi  
✅ **Deployment** su Proxmox con Nginx/PM2  
✅ **Best practices** backend/frontend/security  
✅ **Miglioramenti futuri** possibili  

### Prossimi Passi per Imparare

1. **Sperimenta**: Modifica il codice, aggiungi feature
2. **Debug**: Usa console.log, breakpoint, React DevTools
3. **Leggi documentazione**: Express, React, Sequelize
4. **Progetti personali**: Costruisci qualcosa di simile
5. **Code review**: Analizza codice open source

### Risorse Utili

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Sequelize Documentation](https://sequelize.org/)
- [PostgreSQL Tutorial](https://www.postgresql.org/docs/)
- [JWT.io](https://jwt.io/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

**Buono studio e buon coding! 🚀**
