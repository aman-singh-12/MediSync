-- ============================================================================
-- PostgreSQL Relational Schema Design with Primary Keys (PK) & Foreign Keys (FK)
-- MediSync Healthcare Platform
-- 
-- Concepts Satisfied:
-- 1. Relational Schema Design (Tables, Columns, Data Types, Constraints)
-- 2. Primary Keys (Single-column Serial PK & Composite PK)
-- 3. Foreign Keys (Referential Integrity with CASCADE & SET NULL)
-- 4. Normalization Forms (1NF, 2NF, 3NF, and BCNF)
-- 5. Complete Setup for SQL JOINs (INNER, LEFT, RIGHT, FULL, CROSS, SELF)
-- ============================================================================

-- ============================================================================
-- NORMALIZATION THEORY PROOF
-- ============================================================================
-- 0NF (Unnormalized Form):
--   A raw spreadsheet table: Unnormalized_Clinic (DoctorName, DeptName, DoctorSkills, PatientName, PatientPhone, AptDate, AptStatus)
--   Problems: Multi-valued fields (DoctorSkills), repeating groups, massive redundancy, update/insert/deletion anomalies.
--
-- 1NF (First Normal Form):
--   - Each table column contains strictly atomic (indivisible) scalar values.
--   - Each record is uniquely identified by a Primary Key (PK).
--   - Repeating groups (e.g. skills, appointments) are extracted into distinct rows/tables.
--
-- 2NF (Second Normal Form):
--   - Satisfies 1NF.
--   - Eliminates Partial Dependencies: Every non-prime attribute must be fully functionally dependent on the entire Primary Key.
--   - In composite PK tables (e.g. pg_doctor_specializations (doctor_id, specialization_id)), years_of_experience is NOT placed here if it depends only on doctor_id.
--
-- 3NF (Third Normal Form):
--   - Satisfies 2NF.
--   - Eliminates Transitive Dependencies: Non-prime attributes must NOT depend on other non-prime attributes (X -> Y -> Z).
--   - Department name and head are isolated in `pg_departments` instead of living redundantly inside `pg_doctors`.
--
-- BCNF (Boyce-Codd Normal Form):
--   - Satisfies 3NF.
--   - For every functional dependency X -> Y, X must be a superkey.
-- ============================================================================

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS pg_prescriptions CASCADE;
DROP TABLE IF EXISTS pg_appointments CASCADE;
DROP TABLE IF EXISTS pg_doctor_specializations CASCADE;
DROP TABLE IF EXISTS pg_specializations CASCADE;
DROP TABLE IF EXISTS pg_doctors CASCADE;
DROP TABLE IF EXISTS pg_patients CASCADE;
DROP TABLE IF EXISTS pg_departments CASCADE;

-- 1. DEPARTMENTS TABLE (Primary Entity)
CREATE TABLE pg_departments (
    id SERIAL PRIMARY KEY,                                      -- Primary Key
    name VARCHAR(100) NOT NULL UNIQUE,                          -- Domain & Unique Constraint
    building_location VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. DOCTORS TABLE (Entity with FK, Self-Referencing FK for Hierarchies/Self-Joins)
CREATE TABLE pg_doctors (
    id SERIAL PRIMARY KEY,                                      -- Primary Key
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    department_id INTEGER,                                      -- Foreign Key (Nullable for Outer Join demo)
    supervisor_id INTEGER,                                      -- Self-referencing FK for SELF JOIN
    consultation_fee NUMERIC(10, 2) NOT NULL CHECK (consultation_fee >= 0), -- Domain Check Constraint
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key Constraints with Referential Integrity Actions
    CONSTRAINT fk_doctor_department
        FOREIGN KEY (department_id) 
        REFERENCES pg_departments(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,

    CONSTRAINT fk_doctor_supervisor
        FOREIGN KEY (supervisor_id) 
        REFERENCES pg_doctors(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
);

-- 3. PATIENTS TABLE (Independent Relational Entity)
CREATE TABLE pg_patients (
    id SERIAL PRIMARY KEY,                                      -- Primary Key
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    blood_group VARCHAR(5) NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    age INTEGER NOT NULL CHECK (age >= 0 AND age <= 130),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. APPOINTMENTS TABLE (Relational Junction Entity with Multiple Foreign Keys)
CREATE TABLE pg_appointments (
    id SERIAL PRIMARY KEY,                                      -- Primary Key
    doctor_id INTEGER NOT NULL,                                 -- Foreign Key -> pg_doctors
    patient_id INTEGER NOT NULL,                                -- Foreign Key -> pg_patients
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key Constraints
    CONSTRAINT fk_appointment_doctor
        FOREIGN KEY (doctor_id) 
        REFERENCES pg_doctors(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,

    CONSTRAINT fk_appointment_patient
        FOREIGN KEY (patient_id) 
        REFERENCES pg_patients(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- 5. PRESCRIPTIONS TABLE (Child Entity with Strict 1-to-1 or 1-to-Many FK Relationship)
CREATE TABLE pg_prescriptions (
    id SERIAL PRIMARY KEY,                                      -- Primary Key
    appointment_id INTEGER NOT NULL UNIQUE,                     -- 1-to-1 FK relationship to appointment
    medication_name VARCHAR(150) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    instructions TEXT NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_prescription_appointment
        FOREIGN KEY (appointment_id) 
        REFERENCES pg_appointments(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- 6. SPECIALIZATIONS & JUNCTION TABLE (Many-to-Many Relationship with Composite Primary Key)
CREATE TABLE pg_specializations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE pg_doctor_specializations (
    doctor_id INTEGER NOT NULL,
    specialization_id INTEGER NOT NULL,
    certified_year INTEGER NOT NULL CHECK (certified_year >= 1970 AND certified_year <= 2030),
    
    -- Composite Primary Key (2NF Demonstration)
    PRIMARY KEY (doctor_id, specialization_id),

    CONSTRAINT fk_doc_spec_doctor
        FOREIGN KEY (doctor_id) 
        REFERENCES pg_doctors(id) 
        ON DELETE CASCADE,

    CONSTRAINT fk_doc_spec_specialization
        FOREIGN KEY (specialization_id) 
        REFERENCES pg_specializations(id) 
        ON DELETE CASCADE
);

-- ============================================================================
-- SEED DATA (Curated for Comprehensive JOIN testing)
-- ============================================================================

-- 1. Insert Departments (Notice 'Dermatology' has NO assigned doctors -> for LEFT/RIGHT/FULL JOIN demos)
INSERT INTO pg_departments (id, name, building_location) VALUES
(1, 'Cardiology', 'Building A, Floor 3'),
(2, 'Neurology', 'Building B, Floor 2'),
(3, 'Orthopedics', 'Building A, Floor 1'),
(4, 'Dermatology', 'Building C, Floor 4'); -- Unassigned department

-- 2. Insert Doctors (Notice Dr. Bruce Wayne has NULL department_id -> for LEFT/RIGHT/FULL JOIN demos)
-- Also notice supervisor_id links doctors hierarchically for SELF JOIN demos
INSERT INTO pg_doctors (id, name, email, department_id, supervisor_id, consultation_fee) VALUES
(1, 'Dr. Sarah Connor', 'sarah.connor@medisync.io', 1, NULL, 150.00),         -- Senior Head (Cardiology)
(2, 'Dr. John Watson', 'john.watson@medisync.io', 1, 1, 100.00),              -- Supervised by Dr. Connor (Cardiology)
(3, 'Dr. Meredith Grey', 'meredith.grey@medisync.io', 2, NULL, 180.00),       -- Senior Head (Neurology)
(4, 'Dr. Gregory House', 'gregory.house@medisync.io', 3, 3, 250.00),          -- Supervised by Dr. Grey (Orthopedics)
(5, 'Dr. Bruce Wayne', 'bruce.wayne@medisync.io', NULL, 1, 300.00);           -- Visiting Doctor (NO Department assigned)

-- 3. Insert Patients
INSERT INTO pg_patients (id, name, email, phone, blood_group, age) VALUES
(1, 'Alice Walker', 'alice@example.com', '+1-555-0101', 'O+', 34),
(2, 'Bob Dylan', 'bob@example.com', '+1-555-0102', 'A+', 45),
(3, 'Charlie Puth', 'charlie@example.com', '+1-555-0103', 'B+', 29),
(4, 'Diana Prince', 'diana@example.com', '+1-555-0104', 'AB+', 28); -- Patient with NO appointments yet

-- 4. Insert Appointments
INSERT INTO pg_appointments (id, doctor_id, patient_id, appointment_date, status, reason) VALUES
(1, 1, 1, '2026-09-10 09:30:00+00', 'completed', 'Routine Cardiac Checkup'),
(2, 1, 2, '2026-09-11 11:00:00+00', 'scheduled', 'ECG Follow-up'),
(3, 2, 1, '2026-09-12 14:00:00+00', 'completed', 'Blood Pressure Consultation'),
(4, 3, 3, '2026-09-15 10:00:00+00', 'completed', 'Migraine Analysis');
-- Note: Doctor 4 (Dr. House), Doctor 5 (Dr. Wayne), and Patient 4 (Diana) have no appointments (great for outer joins)

-- 5. Insert Prescriptions
INSERT INTO pg_prescriptions (id, appointment_id, medication_name, dosage, instructions) VALUES
(1, 1, 'Atorvastatin 20mg', '1 tablet daily', 'Take before bedtime'),
(2, 3, 'Lisinopril 10mg', '1 tablet morning', 'Take with water after breakfast'),
(3, 4, 'Sumatriptan 50mg', 'As needed', 'Take at onset of migraine');

-- 6. Insert Specializations
INSERT INTO pg_specializations (id, name) VALUES
(1, 'Interventional Cardiology'),
(2, 'Pediatric Neurology'),
(3, 'Diagnostic Medicine'),
(4, 'Sports Medicine');

-- 7. Insert Doctor Specializations (Composite PK)
INSERT INTO pg_doctor_specializations (doctor_id, specialization_id, certified_year) VALUES
(1, 1, 2012),
(2, 1, 2018),
(3, 2, 2015),
(4, 3, 2008),
(4, 4, 2014);

-- Reset Sequences to ensure auto-increment integrity
SELECT setval('pg_departments_id_seq', (SELECT MAX(id) FROM pg_departments));
SELECT setval('pg_doctors_id_seq', (SELECT MAX(id) FROM pg_doctors));
SELECT setval('pg_patients_id_seq', (SELECT MAX(id) FROM pg_patients));
SELECT setval('pg_appointments_id_seq', (SELECT MAX(id) FROM pg_appointments));
SELECT setval('pg_prescriptions_id_seq', (SELECT MAX(id) FROM pg_prescriptions));
SELECT setval('pg_specializations_id_seq', (SELECT MAX(id) FROM pg_specializations));
