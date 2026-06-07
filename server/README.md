# MediSync - Server

The server of MediSync is a RESTful API built with **Node.js**, **Express**, and **MongoDB** (via Mongoose). It handles all business logic, data persistence, and authentication for the MediSync platform.

## Technologies Used
- **Node.js & Express.js**
- **MongoDB & Mongoose** (Database & ODM)
- **JSON Web Tokens (JWT)** (Authentication)
- **Bcrypt.js** (Password Hashing)
- **Nodemailer** (Email/OTP delivery)
- **Multer** (File Upload Handling)
- **Cloudinary** (Cloud storage for uploaded records)

## Key Features
- **OTP Verification**: Email-based one-time passwords for secure registration, login, and profile updates.
- **Role-Based Access Control (RBAC)**: Middleware to protect routes and ensure only authorized roles (Patient, Doctor, Admin) can access specific endpoints.
- **File Management**: Secure handling and storage of sensitive medical records and profile pictures.
- **Complex Aggregations**: Mongoose aggregations to calculate statistics for the Admin dashboard.

## Environment Variables
Create a `.env` file in this directory with the following variables before running:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_smtp_email
EMAIL_PASS=your_smtp_password
OTP_SMTP_TIMEOUT_MS=10000
# Add Cloudinary credentials if configured
CLOUDINARY_CLOUD_NAME=name
CLOUDINARY_API_KEY=key
CLOUDINARY_API_SECRET=secret
```

## Development Setup

If you wish to run only the server server:

1. **Navigate to the server directory**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server (uses nodemon)**:
   ```bash
   npm run dev
   ```
   *Note: Use `npm start` for production environments.*

## Deployment Notes (e.g., Render)
When deploying this service:
- Set the Root Directory to `server`
- Use `npm install` as the Build Command
- Use `node server.js` or `npm start` as the Start Command
- Ensure all `.env` variables are properly injected into the deployment host's environment settings.
