# 🚕 FleetOps — Real-Time Taxi Fleet Management Portal

A full-stack, production-ready internal management portal for taxi businesses. Built with a monorepo architecture featuring a real-time WebSocket telemetry backend and a modern React dashboard.

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| **Database** | PostgreSQL |
| **ORM** | Prisma (type-safe, declarative schema) |
| **Backend** | Node.js · Express · TypeScript |
| **Validation** | Zod (runtime schema validation) |
| **Real-Time** | Socket.IO (WebSocket telemetry) |
| **Frontend** | React 18 · TypeScript · Vite |
| **Styling** | Tailwind CSS (dark-mode design system) |
| **State** | Zustand (global store) |
| **HTTP Client** | Axios |

---

## 📁 Project Structure

```
taxi-management-portal/
├── apps/
│   ├── backend/
│   │   ├── prisma/schema.prisma          ← DB schema
│   │   └── src/
│   │       ├── server.ts                 ← HTTP + Socket.IO bootstrap
│   │       ├── app.ts                    ← Express app + route wiring
│   │       ├── config/env.config.ts      ← Zod-validated env vars
│   │       ├── core/
│   │       │   └── exceptions/           ← AppError · globalErrorHandler · catchAsync
│   │       ├── middleware/
│   │       │   └── validation.middleware.ts
│   │       └── features/
│   │           ├── cars/                 ← Full CRUD
│   │           ├── drivers/              ← CRUD + assignCar + assignAgent/removeAgent
│   │           ├── agents/               ← Full CRUD
│   │           ├── trips/                ← initiateTrip (atomic tx) · completeTrip · active feed
│   │           └── dashboard/            ← Aggregated stats
│   └── frontend/
│       └── src/
│           ├── core/
│           │   ├── api.client.ts         ← Axios instance
│           │   ├── socket.client.ts      ← Socket.IO singleton
│           │   └── store/                ← Zustand global state
│           ├── shared/components/
│           │   └── Sidebar.tsx
│           └── features/
│               ├── dashboard/            ← Stats · availability bar · recent tables
│               ├── live-tracking/        ← Live trip cards · CountdownTimer
│               ├── data-entry/           ← Forms: Cars · Drivers · Agents · Trips
│               └── assignment-matrix/    ← Driver↔Car and Driver↔Agent linking
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally (or connection string to a hosted instance)

### 1. Clone & install

```bash
cd taxi-management-portal

# Install root dependencies
npm install

# Install backend dependencies
cd apps/backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure environment

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env
# Edit .env — set your DATABASE_URL:
# DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/taxi_fleet_db?schema=public"

# Frontend
cp apps/frontend/.env.example apps/frontend/.env
```

### 3. Set up the database

```bash
cd apps/backend

# Run migrations (creates all tables)
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# (Optional) Seed with demo data
npx ts-node src/prisma/seed.ts
```

### 4. Run the project

```bash
# From the repo root — starts both backend (4000) and frontend (3000)
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 📡 API Reference

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/dashboard/stats` | Aggregated fleet stats |

### Cars
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/cars` | List all cars |
| POST | `/api/v1/cars` | Register a car |
| GET | `/api/v1/cars/:id` | Get car by ID |
| PATCH | `/api/v1/cars/:id` | Update car |
| DELETE | `/api/v1/cars/:id` | Delete car |

### Drivers
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/drivers` | List all drivers |
| GET | `/api/v1/drivers/status-feed` | Drivers grouped by status |
| POST | `/api/v1/drivers` | Onboard driver |
| GET | `/api/v1/drivers/:id` | Get driver by ID |
| PATCH | `/api/v1/drivers/:id` | Update driver |
| DELETE | `/api/v1/drivers/:id` | Delete driver |
| POST | `/api/v1/drivers/:id/assign-car` | Assign car to driver |
| POST | `/api/v1/drivers/:id/assign-agent` | Link driver to platform |
| DELETE | `/api/v1/drivers/:id/remove-agent` | Unlink driver from platform |

### Agents
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/agents` | List all agents |
| POST | `/api/v1/agents` | Register agent |
| GET | `/api/v1/agents/:id` | Get agent by ID |
| PATCH | `/api/v1/agents/:id` | Update agent |
| DELETE | `/api/v1/agents/:id` | Delete agent |

### Trips
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/trips` | All trips |
| GET | `/api/v1/trips/active` | Currently active trips |
| POST | `/api/v1/trips` | Initiate a trip (marks driver Busy) |
| PATCH | `/api/v1/trips/:id/complete` | Complete a trip (frees driver) |

---

## ⚡ Real-Time Events (Socket.IO)

The frontend automatically subscribes to the `dashboard_room` channel on connect.

| Event | Direction | Payload |
|---|---|---|
| `telemetry:trip_started` | Server → Client | Full trip object with driver + agent |
| `telemetry:trip_completed` | Server → Client | Completed trip object |
| `telemetry:driver_updated` | Server → Client | Updated driver object |

---

## 🗄 Database Schema

```
Car ─────────────────── 1:N ── Driver ── N:M ── Agent
                                  │
                                  └── 1:N ── Trip ── N:1 ── Agent
```

Key design decisions:
- **Explicit `DriverAgent` join table** — stores `assignedAt` metadata for the N:M relationship
- **Prisma `$transaction`** — trip initiation atomically creates the trip record AND updates driver status
- **UUIDs** as primary keys across all entities
- **ENUMs** enforce strict `TransmissionType`, `CarStatus`, and `DriverStatus` values
