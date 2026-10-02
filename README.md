# 🏥 MediSync Healthcare Platform

MediSync is a sophisticated, full-stack digital health management portal designed to bridge the gap between patients and healthcare providers. It provides a seamless, secure, and efficient ecosystem for booking appointments, managing medical records, and streamlining clinical workflows.

---

## 🌐 Live Demo

You can access the live version of the application here:
**[MediSync Live (Vercel)](https://medi-sync-7zpm.vercel.app/login)**
---

## 🚀 Features

### 👤 Patient Portal
- **Intuitive Onboarding**: Easy registration and profile management.
- **Doctor Discovery**: Search and filter doctors by specialization, availability, and ratings.
- **Smart Appointment Booking**: Real-time scheduling with instant confirmation. Patients can request reschedules, which enter a "Pending" state awaiting doctor approval.
- **Medical Records**: Secure access to prescriptions, reports, and consultation history.
- **Review System**: Share feedback and rate your experience with practitioners.

### 🩺 Doctor Dashboard
- **Patient Management**: Holistic view of patient history and upcoming appointments.
- **Schedule Control**: Manage availability and consultation slots effortlessly.
- **Digital Prescriptions**: Generate and share prescriptions directly through the portal.
- **Analytics**: Track appointment trends and patient feedback.

### 🛡️ Administrator Panel
- **User Governance**: Manage and verify doctor credentials and patient accounts.
- **System Monitoring**: Oversee platform activity and ensure operational integrity.
- **Financial Oversight**: Monitor transaction logs and platform revenue (if applicable).

---

## 🛠️ Tech Stack

### Client
- **Framework**: React.js (Vite)
- **Routing**: React Router DOM
- **State Management**: Context API / Hooks
- **Icons**: React Icons
- **Deployment**: Vercel

### Server
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT & Bcryptjs
- **File Storage**: Cloudinary (for medical records & profiles)
- **Email Service**: Nodemailer
- **Deployment**: Render / Railway

---

## 📂 Project Structure

This project is organized as a monorepo for ease of development:

```text
MediSync/
├── client/        # React + Vite application
├── server/         # Node.js + Express API
└── package.json     # Root configuration & concurrent scripts
```

---

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB account (Atlas or Local)
- Cloudinary account (for image/file uploads)

### 1. Clone the Repository
```bash
git clone https://github.com/aman-singh-12/MediSync.git
cd MediSync
```

### 2. Install Dependencies
From the root directory, run the following to install all necessary packages for both client and server:
```bash
npm run install-all
```

### 3. Environment Variables
Create a `.env` file in the `server/` directory and configure the following:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
EMAIL_USER=your_email
EMAIL_PASS=your_password
```

### 4. Run Locally
Start both the client and server servers simultaneously:
```bash
npm run dev
```
- **Client**: http://localhost:5173
- **Server**: http://localhost:5000

### 5. Running with Docker
MediSync is fully containerized. To spin up the entire stack (MongoDB, Redis, ChromaDB, Server, Client):
```bash
docker compose up -d --build
```
- **Client**: http://localhost:3000
- **Server**: http://localhost:5000

### 6. Seeding Demo Data
To quickly populate the database with robust demo data (50 Doctors, 50 Patients, and 30 Appointments using faker.js), execute the seed script inside the running server container:
```bash
docker exec medisync_server npm run seed
```
*(Alternatively, run `node server/seedComprehensive.js` directly if not using Docker).*

---

## 🩺 Backend Health Monitoring

- **Health Endpoint**: `/health`
- **Expected Status**: `200 OK`
- **Response Format**: `{"status": "ok"}`
- **Purpose**: A lightweight, unauthenticated endpoint designed for container health probes and external uptime monitors (such as UptimeRobot or Render health checks) to verify application process readiness without triggering database queries, LLM operations, or auth middleware.

### Configuring UptimeRobot
1. Sign in to your [UptimeRobot](https://uptimerobot.com) dashboard.
2. Click **+ Add New Monitor**.
3. Set **Monitor Type** to `HTTP(s)`.
4. Enter **Friendly Name** (e.g., `MediSync Backend`).
5. Set **URL (or IP)** to `https://<YOUR-RENDER-SERVICE>.onrender.com/health`.
6. Select your preferred **Monitoring Interval** (e.g., every 5 minutes).
7. Save the monitor.

> **Note**: UptimeRobot functions by periodically issuing HTTP GET requests to this endpoint. The exact spin-down and inactivity behaviors on free-tier hosting providers (e.g., Render) depend on the provider's active platform policies and instance limits.

