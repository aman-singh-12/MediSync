-- PostgreSQL Schema Implementation to Satisfy Kalvium Concepts
-- Includes: Relational Schema, PK/FK, Normalization (1NF, 2NF, 3NF)

-- ==========================================
-- NORMALIZATION DEMONSTRATION
-- ==========================================
-- Problem: A raw, unnormalized table (0NF) might look like this:
-- Unnormalized_Data (DoctorName, Departments, AppointmentDates, PatientName, PatientAge)
-- 
-- Step 1: First Normal Form (1NF)
-- Rule: Ensure each column contains atomic values, no repeating groups.
-- E.g., we separate multiple appointments into distinct rows.
-- 
-- Step 2: Second Normal Form (2NF)
-- Rule: Must be in 1NF. Every non-prime attribute must be fully functionally dependent on the primary key.
-- E.g., separate Patient and Doctor data from the Appointment entity so DoctorName doesn't depend on just a part of a composite key.
--
-- Step 3: Third Normal Form (3NF)
-- Rule: Must be in 2NF. No transitive dependencies (non-prime attributes shouldn't depend on other non-prime attributes).
-- E.g., we move DepartmentName out of Doctor into a separate pg_departments table, so Doctor only holds department_id.

CREATE TABLE IF NOT EXISTS pg_departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS pg_doctors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department_id INTEGER NOT NULL,
    -- FOREIGN KEY demonstration
    CONSTRAINT fk_department
        FOREIGN KEY(department_id) 
        REFERENCES pg_departments(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS pg_appointments (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    appointment_date TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    -- FOREIGN KEY demonstration
    CONSTRAINT fk_doctor
        FOREIGN KEY(doctor_id)
        REFERENCES pg_doctors(id)
        ON DELETE CASCADE
);

-- DUMMY DATA FOR JOIN/AGGREGATION DEMONSTRATIONS
INSERT INTO pg_departments (name) VALUES 
('Cardiology'), ('Neurology'), ('Orthopedics')
ON CONFLICT DO NOTHING;

-- Note: In a real environment, you'd retrieve the department IDs first.
-- Assuming Cardiology=1, Neurology=2, Orthopedics=3 for dummy insertion
INSERT INTO pg_doctors (name, department_id) VALUES 
('Dr. Smith', 1),
('Dr. Jones', 2),
('Dr. Adams', 1)
ON CONFLICT DO NOTHING;

INSERT INTO pg_appointments (doctor_id, patient_name, appointment_date, status) VALUES 
(1, 'Alice Walker', '2025-05-10 10:00:00', 'completed'),
(1, 'Bob Dylan', '2025-05-11 11:30:00', 'scheduled'),
(2, 'Charlie Puth', '2025-05-12 14:00:00', 'completed')
ON CONFLICT DO NOTHING;
