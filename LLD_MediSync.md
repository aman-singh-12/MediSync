# Low-Level Design (LLD): MediSync Healthcare Platform

## 1. Directory & Service Structure (Backend)

The Express.js backend is organized following the MVC (Model-View-Controller) pattern, though adapted for an API-first approach where "Views" are JSON responses.

```text
server/
├── config/             # Database connection, env variable parsers
├── controllers/        # Request handlers (extract body, call services, return res)
├── middleware/         # Express middlewares (Auth verification, Error handling, Multer)
├── models/             # Mongoose Schemas (Data Layer)
├── routes/             # Express Router definitions
├── services/           # Business logic layer (Called by controllers)
├── utils/              # Helper functions (Hashers, Mailers)
└── server.js / app.js  # Entry points
```

## 2. Database Schema Design (Mongoose Models)

*Note: The following represents the core entities inferred from the project structure.*

### 2.1 User Base Model (`user.model.js`)
Serves as the base for authentication.
- `_id`: ObjectId
- `email`: String (Unique, Indexed)
- `password`: String (Hashed)
- `role`: Enum ['patient', 'doctor', 'admin']
- `isVerified`: Boolean (Default: false)
- `createdAt`, `updatedAt`: Timestamps

### 2.2 Patient Profile (`patient.model.js`)
- `userId`: ObjectId (Ref -> User)
- `firstName`, `lastName`: String
- `dob`: Date
- `gender`: Enum ['male', 'female', 'other']
- `phone`: String
- `profilePicture`: String (Cloudinary URL)
- `bloodGroup`: String

### 2.3 Doctor Profile (`doctor.model.js`)
- `userId`: ObjectId (Ref -> User)
- `firstName`, `lastName`: String
- `specialization`: String (e.g., 'Cardiologist')
- `experienceYears`: Number
- `qualifications`: [String]
- `clinicAddress`: String
- `consultationFee`: Number
- `availability`: [ { day: String, slots: [{startTime, endTime, isBooked}] } ]
- `rating`: Number (Calculated average)

### 2.4 Appointment (`appointment.model.js`)
- `_id`: ObjectId
- `patientId`: ObjectId (Ref -> Patient)
- `doctorId`: ObjectId (Ref -> Doctor)
- `date`: Date
- `timeSlot`: String (e.g., '10:00 AM - 10:30 AM')
- `status`: Enum ['booked', 'completed', 'cancelled', 'reschedule_requested']
- `reasonForVisit`: String
- `paymentStatus`: Enum ['pending', 'completed']

### 2.5 Medical Record / Prescription (`medicalRecord.model.js` / `prescription.model.js`)
- `patientId`: ObjectId (Ref -> Patient)
- `doctorId`: ObjectId (Ref -> Doctor)
- `appointmentId`: ObjectId (Ref -> Appointment)
- `diagnosis`: String
- `medications`: [ { name, dosage, frequency, duration } ]
- `notes`: String
- `attachmentUrl`: String (Cloudinary URL for uploaded reports)
- `dateIssued`: Date

## 3. Core API Endpoints

All endpoints are prefixed with `/api/v1`

### 3.1 Authentication (`auth.routes.js`)
- `POST /auth/register`: Registers a new user. Expects `email`, `password`, `role`.
- `POST /auth/login`: Authenticates user. Returns JWT and user context.

### 3.2 Patient Endpoints (`patient.routes.js`)
- `GET /patients/profile`: Get logged-in patient's profile (Auth required).
- `PUT /patients/profile`: Update profile info.
- `GET /patients/records`: Fetch medical history and prescriptions.

### 3.3 Doctor Endpoints (`doctor.routes.js`)
- `GET /doctors`: Fetch list of approved doctors. Supports query params for filtering (`?specialization=...`).
- `GET /doctors/:id`: Get specific doctor details and available slots.
- `PUT /doctors/schedule`: (Doctor only) Update availability.

### 3.4 Appointment Endpoints (`appointment.routes.js`)
- `POST /appointments/book`: Create a new appointment.
- `GET /appointments`: Get appointments for the logged-in user (behaves differently based on Patient vs Doctor role).
- `PATCH /appointments/:id/status`: Update status (e.g., Doctor marking it 'completed' or patient requesting a reschedule).
- `PATCH /appointments/reschedule`: (Patient only) Request a new time slot, updates status to `reschedule_requested` for Doctor approval.

### 3.5 Admin Endpoints (`admin.routes.js`)
- `GET /admin/pending-doctors`: List doctors awaiting verification.
- `PATCH /admin/verify-doctor/:id`: Approve/Reject doctor profile.

## 4. Key Middleware Logic

- `authMiddleware.js`: 
  1. Extracts Bearer token from `Authorization` header.
  2. Verifies token using `jsonwebtoken` and `JWT_SECRET`.
  3. Attaches decoded payload (typically `{ userId, role }`) to the `req.user` object.
  4. Returns `401 Unauthorized` if token is missing or invalid.
- `roleMiddleware.js(allowedRoles)`: 
  - Checks if `req.user.role` is present in the `allowedRoles` array.
  - Returns `403 Forbidden` if the user lacks the required role.

## 5. Frontend Architecture (React)

- **Pages/Views**: `Home`, `Login`, `Register`, `PatientDashboard`, `DoctorDashboard`, `AdminDashboard`, `DoctorSearch`, `AppointmentBooking`.
- **Context API**: `AuthContext` provides `user` object, `login()`, and `logout()` globally to all components.
- **Axios Interceptors**: Used to automatically attach the JWT token to every outgoing request and handle generic 401 errors (e.g., token expiration redirects to login).
