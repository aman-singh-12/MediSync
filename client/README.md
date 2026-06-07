# MediSync - Client

**🌐 Live Demo:** [medisync-healthcare.vercel.app](https://medisync-healthcare.vercel.app)

The client of MediSync is a modern, responsive web application built with **React** and **Vite**. It provides dedicated portal interfaces for Patients, Doctors, and Administrators.

## Technologies Used
- **React 18**
- **Vite** (Build Tool & Development Server)
- **React Router v6** (Routing)
- **Axios** (API Requests)
- **Vanilla CSS / CSS Modules** (Styling)
- **React Icons**

## Key Features
- **Role-Based Portals**: Distinct dashboards and navigation depending on the authenticated user's role.
- **Dynamic Booking**: Calendar-based appointment booking system.
- **Secure Authentication**: Integration with the server's JWT and OTP flow.
- **File Uploads**: Drag-and-drop or file selection for uploading medical records.

## Development Setup

If you wish to run only the client application:

1. **Navigate to the client directory**:
   ```bash
   cd client
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

## Build for Production

To build the optimized production assets:
```bash
npm run build
```
This will generate a `dist` folder containing the compiled HTML, JS, and CSS files, which can be hosted on platforms like Vercel, Netlify, or served directly from the Node server.
