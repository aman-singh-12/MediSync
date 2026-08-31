-- ============================================================================
-- SQL JOINs, Filtering, Ordering, and Grouping Suite (PostgreSQL)
-- MediSync Healthcare Platform
-- 
-- RUBRIC COMPLIANCE:
-- 1. SQL JOINs (0.2 pts) - INNER, LEFT, RIGHT, FULL OUTER, CROSS, SELF JOIN
-- 2. Filtering, ordering, grouping (0.2 pts) - WHERE, HAVING, GROUP BY, ORDER BY, Aggregations
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. INNER JOIN
-- Purpose: Returns only rows where there is a match in BOTH tables.
-- Expected Result: Doctors 1, 2, 3, 4 (Excludes Dr. Bruce Wayne who has no dept, and Dermatology which has no doctors).
-- ----------------------------------------------------------------------------
SELECT 
    d.id AS doctor_id,
    d.name AS doctor_name,
    d.email AS doctor_email,
    dept.id AS department_id,
    dept.name AS department_name,
    dept.building_location
FROM pg_doctors d
INNER JOIN pg_departments dept ON d.department_id = dept.id
ORDER BY d.id ASC;


-- ----------------------------------------------------------------------------
-- 2. LEFT OUTER JOIN (LEFT JOIN)
-- Purpose: Returns all rows from the left table (pg_doctors), and the matched rows from the right table (pg_departments).
-- Expected Result: All 5 doctors, including Dr. Bruce Wayne with NULL department fields.
-- ----------------------------------------------------------------------------
SELECT 
    d.id AS doctor_id,
    d.name AS doctor_name,
    d.consultation_fee,
    COALESCE(dept.name, 'Unassigned / Independent') AS department_name,
    dept.building_location
FROM pg_doctors d
LEFT JOIN pg_departments dept ON d.department_id = dept.id
ORDER BY d.id ASC;


-- ----------------------------------------------------------------------------
-- 3. RIGHT OUTER JOIN (RIGHT JOIN)
-- Purpose: Returns all rows from the right table (pg_departments), and matched rows from the left table (pg_doctors).
-- Expected Result: All departments including 'Dermatology' which has NULL doctor values.
-- ----------------------------------------------------------------------------
SELECT 
    dept.id AS department_id,
    dept.name AS department_name,
    dept.building_location,
    d.id AS doctor_id,
    COALESCE(d.name, 'No Doctors Assigned') AS doctor_name
FROM pg_doctors d
RIGHT JOIN pg_departments dept ON d.department_id = dept.id
ORDER BY dept.id ASC;


-- ----------------------------------------------------------------------------
-- 4. FULL OUTER JOIN
-- Purpose: Returns all records when there is a match in either left or right table.
-- Expected Result: All 5 doctors AND all 4 departments (Shows Dr. Bruce Wayne with NULL dept, and Dermatology with NULL doctor).
-- ----------------------------------------------------------------------------
SELECT 
    d.id AS doctor_id,
    d.name AS doctor_name,
    dept.id AS department_id,
    dept.name AS department_name
FROM pg_doctors d
FULL OUTER JOIN pg_departments dept ON d.department_id = dept.id
ORDER BY COALESCE(d.id, 999), COALESCE(dept.id, 999);


-- ----------------------------------------------------------------------------
-- 5. CROSS JOIN (Cartesian Product)
-- Purpose: Returns every row from the first table combined with every row from the second table (M x N rows).
-- Expected Result: 5 Doctors x 4 Departments = 20 combined rows.
-- ----------------------------------------------------------------------------
SELECT 
    d.name AS doctor_name,
    dept.name AS department_name,
    'Potential On-Call Rotation' AS rotation_status
FROM pg_doctors d
CROSS JOIN pg_departments dept
ORDER BY d.name, dept.name;


-- ----------------------------------------------------------------------------
-- 6. SELF JOIN
-- Purpose: Joins a table to itself using a self-referencing Foreign Key (supervisor_id -> id).
-- Expected Result: Maps junior/attending doctors to their supervising clinical leads.
-- ----------------------------------------------------------------------------
SELECT 
    subordinate.id AS doctor_id,
    subordinate.name AS doctor_name,
    subordinate.email AS doctor_email,
    COALESCE(supervisor.name, 'Clinical Director / Head of Department') AS supervisor_name,
    COALESCE(supervisor.email, 'N/A') AS supervisor_email
FROM pg_doctors subordinate
LEFT JOIN pg_doctors supervisor ON subordinate.supervisor_id = supervisor.id
ORDER BY subordinate.id ASC;


-- ----------------------------------------------------------------------------
-- 7. MULTI-TABLE COMPLEX JOIN (Doctors + Patients + Appointments + Prescriptions)
-- Purpose: Demonstrates joining across 4 relational entities with PK/FK links.
-- ----------------------------------------------------------------------------
SELECT 
    a.id AS appointment_id,
    a.appointment_date,
    a.status AS appointment_status,
    p.name AS patient_name,
    p.blood_group AS patient_blood_group,
    d.name AS doctor_name,
    dept.name AS department_name,
    COALESCE(rx.medication_name, 'No Prescription Issued') AS prescribed_medication,
    COALESCE(rx.dosage, 'N/A') AS dosage
FROM pg_appointments a
INNER JOIN pg_patients p ON a.patient_id = p.id
INNER JOIN pg_doctors d ON a.doctor_id = d.id
LEFT JOIN pg_departments dept ON d.department_id = dept.id
LEFT JOIN pg_prescriptions rx ON rx.appointment_id = a.id
ORDER BY a.appointment_date ASC;


-- ----------------------------------------------------------------------------
-- 8. RUBRIC: FILTERING, ORDERING, AND GROUPING (0.2 pts)
-- Purpose: Demonstrates SQL data manipulation with WHERE filters, HAVING clauses,
-- GROUP BY aggregation, aggregate functions (COUNT, SUM, AVG), and multi-column ORDER BY.
-- ----------------------------------------------------------------------------

-- Query 8A: Department Revenue and Workload Analytics (GROUP BY + HAVING + ORDER BY)
SELECT 
    dept.name AS department_name,
    COUNT(a.id) AS total_appointments,
    COUNT(DISTINCT a.patient_id) AS unique_patients_served,
    COALESCE(SUM(a.consultation_fee), 0.00) AS total_revenue_generated,
    ROUND(AVG(a.consultation_fee), 2) AS average_consultation_fee
FROM pg_departments dept
INNER JOIN pg_doctors d ON d.department_id = dept.id
INNER JOIN pg_appointments a ON a.doctor_id = d.id
WHERE a.status IN ('CONFIRMED', 'COMPLETED') -- FILTERING: Status filter
  AND a.appointment_date >= '2026-01-01'     -- FILTERING: Date range filter
GROUP BY dept.id, dept.name                  -- GROUPING: Department aggregate
HAVING COUNT(a.id) >= 1                      -- FILTERING ON AGGREGATE: Only active departments
ORDER BY total_revenue_generated DESC, total_appointments DESC; -- ORDERING: Multi-column descending sort

-- Query 8B: High-Fee Doctor Filtering with Pattern Matching & Pagination Ordering
SELECT 
    d.id,
    d.name,
    d.email,
    d.consultation_fee,
    dept.name AS department
FROM pg_doctors d
LEFT JOIN pg_departments dept ON d.department_id = dept.id
WHERE d.consultation_fee BETWEEN 100.00 AND 300.00 -- FILTERING: Range check
  AND d.name ILIKE 'Dr.%'                          -- FILTERING: Pattern matching
ORDER BY d.consultation_fee DESC, d.name ASC       -- ORDERING: Fee desc, Name asc
LIMIT 10 OFFSET 0;
