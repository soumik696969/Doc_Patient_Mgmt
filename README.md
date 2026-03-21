# 🩺 DoctorConnect - Doctor-Patient Management System

A complete, production-ready **Doctor-Patient Management System** built with **microservices architecture**. This system enables patients to register, browse doctors, book appointments, and manage their medical interactions, while doctors can manage schedules and appointments.

## 🏗️ Architecture

```
                    ┌──────────────┐
                    │   Frontend   │
                    │  React+Vite  │
                    │   :5173      │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  API Gateway │
                    │   Express    │
                    │   :3000      │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────▼─────┐  ┌──────▼──────┐  ┌──────▼──────┐
   │  User Svc  │  │ Doctor Svc  │  │  Appt Svc   │
   │   :3001    │  │   :3002     │  │   :3003     │
   └──────┬─────┘  └──────┬──────┘  └──────┬──────┘
          │               │                │
   ┌──────▼─────┐  ┌──────▼──────┐  ┌──────▼──────┐
   │  MongoDB   │  │   Redis +   │  │  MongoDB    │
   │  user_db   │  │  MongoDB    │  │  appt_db    │
   └────────────┘  │  doctor_db  │  └──────┬──────┘
                   └─────────────┘         │
                           │        ┌──────▼──────┐
                    ┌──────▼──────┐ │ Notif. Svc  │
                    │  RabbitMQ   │◄┤   :3004     │
                    │  (Events)   │ └─────────────┘
                    └─────────────┘
```

## ✨ Key Features

### For Patients
- **Registration & Login** with JWT authentication
- **Browse Doctors** by specialization, rating, city, and fee
- **Book Appointments** with real-time slot availability
- **Dashboard** with appointment overview and stats
- **Appointment History** with status tracking
- **Cancel Appointments** with confirmation

### For Doctors
- **Dashboard** with today's schedule and pending approvals
- **Approve/Decline** appointment requests
- **Complete** consultations and add notes
- **Profile Management** with schedule configuration

### Technical Highlights
- **🔌 Microservices Architecture** - 4 independent services + API Gateway
- **🔐 JWT Authentication** with role-based access control
- **📨 RabbitMQ** for event-driven messaging and notifications
- **🔴 Redis Caching** for doctor listings (5-min TTL)
- **🔒 Optimistic Locking** prevents double-booking conflicts
- **📋 Saga Pattern** for distributed appointment transactions
- **🐳 Docker Compose** for easy deployment
- **📊 Winston Logging** across all services
- **🛡️ Rate Limiting** and Helmet security headers

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, React Router, Axios |
| API Gateway | Express.js, http-proxy-middleware |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Caching | Redis (ioredis) |
| Messaging | RabbitMQ (amqplib) |
| Auth | JWT (jsonwebtoken, bcryptjs) |
| Containerization | Docker, Docker Compose |

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ 
- **MongoDB** (local or Atlas)
- **Redis** (optional, runs without it)
- **RabbitMQ** (optional, runs without it)

### Option 1: Run with Docker (Recommended)

```bash
# Start all services
docker-compose up --build

# Seed the database (in another terminal)
docker exec dpm-user-service node src/seeds/seed.js
```

### Option 2: Run Locally (Without Docker)

#### 1. Install MongoDB
Make sure MongoDB is running on `localhost:27017`

#### 2. Install Dependencies
```bash
# API Gateway
cd api-gateway && npm install

# Services
cd ../services/user-service && npm install
cd ../doctor-service && npm install
cd ../appointment-service && npm install
cd ../notification-service && npm install

# Frontend
cd ../../frontend && npm install
```

#### 3. Start Services (each in a separate terminal)

```bash
# Terminal 1 - User Service
cd services/user-service && npm run dev

# Terminal 2 - Doctor Service
cd services/doctor-service && npm run dev

# Terminal 3 - Appointment Service
cd services/appointment-service && npm run dev

# Terminal 4 - Notification Service
cd services/notification-service && npm run dev

# Terminal 5 - API Gateway
cd api-gateway && npm run dev

# Terminal 6 - Frontend
cd frontend && npm run dev
```

#### 4. Seed Demo Data
```bash
cd services/user-service && npm run seed
```

## 📋 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Patient | patient1@demo.com | password123 |
| Patient | patient2@demo.com | password123 |
| Doctor | dr.kumar@demo.com | password123 |
| Doctor | dr.singh@demo.com | password123 |

## 🌐 Service URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API Gateway | http://localhost:3000 |
| User Service | http://localhost:3001 |
| Doctor Service | http://localhost:3002 |
| Appointment Service | http://localhost:3003 |
| Notification Service | http://localhost:3004 |
| RabbitMQ Management | http://localhost:15672 |

## 📂 Project Structure

```
Doctor Patient Mgmt/
├── docker-compose.yml          # Docker orchestration
├── .env                        # Environment variables
├── README.md                   # This file
│
├── api-gateway/                # API Gateway (Port 3000)
│   ├── src/
│   │   ├── server.js           # Gateway server
│   │   ├── routes/proxy.js     # Proxy routing rules
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT verification
│   │   │   └── errorHandler.js # Centralized error handling
│   │   └── utils/logger.js     # Winston logger
│   └── package.json
│
├── services/
│   ├── user-service/           # Auth & Profiles (Port 3001)
│   │   ├── src/
│   │   │   ├── server.js
│   │   │   ├── config/         # DB & RabbitMQ config
│   │   │   ├── models/User.js  # User schema
│   │   │   ├── controllers/    # Business logic
│   │   │   ├── routes/         # API routes
│   │   │   ├── middleware/     
│   │   │   ├── seeds/seed.js   # Demo data seeder
│   │   │   └── utils/
│   │   └── package.json
│   │
│   ├── doctor-service/         # Doctor CRUD (Port 3002)
│   │   ├── src/
│   │   │   ├── config/redis.js # Redis caching layer
│   │   │   ├── models/Doctor.js
│   │   │   └── controllers/    # With cache-first strategy
│   │   └── package.json
│   │
│   ├── appointment-service/    # Booking (Port 3003)
│   │   ├── src/
│   │   │   ├── models/Appointment.js  # Optimistic locking
│   │   │   └── controllers/    # Saga pattern booking
│   │   └── package.json
│   │
│   └── notification-service/   # Events (Port 3004)
│       ├── src/
│       │   ├── config/rabbitmq.js  # Event consumer
│       │   └── handlers/       # Notification processing
│       └── package.json
│
└── frontend/                   # React App (Port 5173)
    ├── src/
    │   ├── context/AuthContext.jsx
    │   ├── services/api.js     # Axios API client
    │   ├── components/         # Navbar, etc.
    │   └── pages/              # All page components
    └── package.json
```

## 🔑 API Endpoints

### Auth (No Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |

### Doctors (Public + Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors` | List doctors (cached) |
| GET | `/api/doctors/search` | Search doctors |
| GET | `/api/doctors/specializations` | Get specializations |
| GET | `/api/doctors/:id` | Get doctor detail |
| POST | `/api/doctors` | Create doctor profile 🔒 |

### Appointments (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/appointments` | Book appointment 🔒 |
| GET | `/api/appointments/patient` | Patient's appointments 🔒 |
| GET | `/api/appointments/doctor/:id` | Doctor's appointments 🔒 |
| GET | `/api/appointments/slots` | Available slots 🔒 |
| PATCH | `/api/appointments/:id/status` | Update status 🔒 |

### Notifications (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get notifications 🔒 |
| PATCH | `/api/notifications/:id/read` | Mark read 🔒 |

## 🏛️ Advanced Patterns Implemented

### 1. Inter-Service Communication
- **REST API** via API Gateway proxy routing
- **RabbitMQ** topic exchange for event-driven communication
- **Header-based** user context forwarding (X-User-Id, X-User-Role)

### 2. Concurrency Control
- **Optimistic Locking**: Version field on appointments prevents conflicting updates
- **Conflict Detection**: 409 Conflict response when concurrent booking detected
- **Atomic Operations**: MongoDB findOneAndUpdate with version check

### 3. Redis Caching
- **Cache-First Strategy**: Doctor listings checked in Redis before DB
- **TTL**: 5-minute expiry on cached data
- **Cache Invalidation**: Automatic purge on doctor profile updates
- **Graceful Fallback**: System works without Redis

### 4. Saga Pattern (Appointment Booking)
- **Step 1**: Validate slot availability (check conflicts)
- **Step 2**: Create appointment record
- **Step 3**: Publish notification events
- **Compensation**: Error handling with conflict resolution

### 5. Event-Driven Notifications
- Events: `user.registered`, `appointment.booked`, `appointment.confirmed`, `appointment.cancelled`, `appointment.completed`
- RabbitMQ consumer in Notification Service processes events asynchronously

## 📝 License

MIT License - Built for academic evaluation and real-world deployment.
