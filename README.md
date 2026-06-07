# 🏥 MediSync Healthcare Platform

MediSync is a sophisticated, full-stack digital health management portal designed to bridge the gap between patients and healthcare providers. It provides a seamless, secure, and efficient ecosystem for booking appointments, managing medical records, and streamlining clinical workflows.
---

## 🚀 Features

### 👤 Patient Portal
- **Intuitive Onboarding**: Easy registration and profile management.
- **Doctor Discovery**: Search and filter doctors by specialization, availability, and ratings.
- **Smart Appointment Booking**: Real-time scheduling with instant confirmation.
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
