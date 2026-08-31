const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { 
  createPatientPrescriptionTracker, 
  createClinicalMemoizer, 
  createRoleAuthorizer, 
  calculateEgfr 
} = require('../utils/closureDemo');
const { 
  ClinicalTriageSchema, 
  PrescriptionAnalysisSchema, 
  generateStructuredTriage,
  generateStructuredPrescriptionAnalysis
} = require('../ai/rag/structuredOutput.service');
const { 
  processPatientAdmission, 
  runProjectHoistingDiagnostics 
} = require('../services/hoistingDiagnostic.service');
const { 
  generateRecordWithCallbacks, 
  generateRecordWithPromises, 
  generateRecordWithAsyncAwait, 
  promisifyClinicalFn, 
  runAsyncComparisonBenchmark 
} = require('../services/asyncComparison.service');

describe('Full Rubric Concepts Automated Verification Test Suite', () => {
  afterAll(async () => {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  // ================= 1. JAVASCRIPT — EVENT LOOP (0.1 PTS) =================
  describe('JavaScript — Event Loop (0.1 pts)', () => {
    it('should correctly demonstrate the Event Loop execution phases', async () => {
      const res = await request(app).get('/api/system/event-loop');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('topic', 'JavaScript — Event loop');
      expect(res.body).toHaveProperty('status', 'SUCCESS');
      expect(res.body.timeline).toBeDefined();

      const stages = res.body.timeline.map(t => t.type);
      expect(stages[0]).toBe('Synchronous');
      expect(stages.includes('Microtask')).toBe(true);
      expect(stages.includes('Macrotask')).toBe(true);
    });
  });

  // ================= 2. JAVASCRIPT — HOISTING (0.1 PTS) =================
  describe('JavaScript — Hoisting (0.1 pts)', () => {
    it('should verify deliberate Stepdown Function Hoisting in clinical admission workflow', () => {
      const admission = processPatientAdmission({
        patientId: 'PAT-771',
        name: 'John Doe',
        age: 62,
        systolicBp: 160,
        isSmoker: true,
        vitals: { heartRate: 110 }
      });

      expect(admission.admissionStatus).toBe('ADMITTED');
      expect(admission.clinicalRisk.riskCategory).toBe('HIGH');
      expect(admission.assignedCareTeam.department).toBe('Cardiology');
      expect(admission.vitalsValidation.isNormal).toBe(false);
    });

    it('should verify project hoisting diagnostic suite via API', async () => {
      const res = await request(app).get('/api/system/hoisting');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('topic', 'JavaScript — Hoisting');
      expect(res.body).toHaveProperty('status', 'SUCCESS');
      expect(res.body).toHaveProperty('projectDemonstration');
      expect(res.body.projectDemonstration.diagnostics.length).toBe(3);
    });
  });

  // ================= 3. JAVASCRIPT — PROMISES VS CALLBACKS (0.1 PTS) =================
  describe('JavaScript — Promises vs Callbacks (0.1 pts)', () => {
    it('should verify legacy Error-First Callback pipeline on patient record', (done) => {
      generateRecordWithCallbacks('PAT-9021', (err, res) => {
        expect(err).toBeNull();
        expect(res.success).toBe(true);
        expect(res.pattern).toContain('Callbacks');
        expect(res.result.patient.name).toBe('Eleanor Vance');
        expect(res.result.invoice.totalPayable).toBe(225.00);
        done();
      });
    });

    it('should verify modern Promise chaining pipeline on patient record', async () => {
      const res = await generateRecordWithPromises('PAT-9021');
      expect(res.success).toBe(true);
      expect(res.pattern).toContain('Promises');
      expect(res.result.patient.name).toBe('Eleanor Vance');
      expect(res.result.invoice.totalPayable).toBe(225.00);
    });

    it('should verify modern Async/Await pipeline on patient record', async () => {
      const res = await generateRecordWithAsyncAwait('PAT-9021');
      expect(res.success).toBe(true);
      expect(res.pattern).toContain('Async / Await');
      expect(res.result.patient.name).toBe('Eleanor Vance');
    });

    it('should verify custom Promisification engine', async () => {
      const testCbFn = (val, cb) => setTimeout(() => cb(null, val * 2), 5);
      const testPromiseFn = promisifyClinicalFn(testCbFn);
      const result = await testPromiseFn(21);
      expect(result).toBe(42);
    });

    it('should verify side-by-side async comparison benchmark via API', async () => {
      const res = await request(app).get('/api/system/promises-vs-callbacks');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('topic', 'JavaScript — Promises vs callbacks');
      expect(res.body).toHaveProperty('status', 'SUCCESS');
      expect(res.body.comparison.callbacks.success).toBe(true);
      expect(res.body.comparison.promises.success).toBe(true);
      expect(res.body.comparison.asyncAwait.success).toBe(true);
    });
  });

  // ================= 4. JAVASCRIPT — CLOSURES (0.1 PTS) =================
  describe('JavaScript — Closures (0.1 pts)', () => {
    it('should verify private state encapsulation via factory function closure', () => {
      const tracker = createPatientPrescriptionTracker('P-991', 'Metformin 500mg', 5);
      
      expect(tracker._dosesTaken).toBeUndefined();
      expect(tracker._doseHistory).toBeUndefined();

      const log1 = tracker.logDose('Breakfast dose');
      expect(log1.success).toBe(true);
      expect(log1.record.doseNumber).toBe(1);

      tracker.logDose('Dinner dose');
      const compliance = tracker.getComplianceRate();
      expect(compliance.dosesTaken).toBe(2);
      expect(compliance.totalPrescribed).toBe(5);
      expect(compliance.adherencePercentage).toBe('40%');

      const audit = tracker.getAuditHistory();
      expect(audit.length).toBe(2);
    });

    it('should verify memoization cache closure for clinical calculations', () => {
      const memoizedEgfr = createClinicalMemoizer(calculateEgfr);
      
      const first = memoizedEgfr(1.0, 50, false);
      expect(first.fromCache).toBe(false);
      expect(first.stats.misses).toBe(1);
      expect(first.stats.hits).toBe(0);

      const second = memoizedEgfr(1.0, 50, false);
      expect(second.fromCache).toBe(true);
      expect(second.stats.hits).toBe(1);
      expect(second.result).toBe(first.result);
    });

    it('should verify currying and partial application closure', () => {
      const adminOnlyAuthorizer = createRoleAuthorizer(['admin'])('DeleteMedicalRecord');
      
      const doctorCheck = adminOnlyAuthorizer('doctor');
      expect(doctorCheck.authorized).toBe(false);

      const adminCheck = adminOnlyAuthorizer('admin');
      expect(adminCheck.authorized).toBe(true);
    });

    it('should return 200 from the /api/system/closures endpoint', async () => {
      const res = await request(app).get('/api/system/closures');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('topic', 'JavaScript — Closures');
      expect(res.body).toHaveProperty('status', 'SUCCESS');
      expect(res.body.demonstrations.length).toBe(3);
    });
  });

  // ================= 5. STRUCTURED OUTPUTS (0.2 PTS) =================
  describe('Structured Outputs (0.2 pts)', () => {
    it('should validate ClinicalTriageSchema against Zod definition', () => {
      const sampleTriage = {
        triageId: 'TRG-TEST-1',
        urgencyLevel: 'HIGH',
        primaryConditionAssessment: 'Acute Appendicitis',
        confidenceScore: 0.92,
        differentialDiagnoses: [
          { condition: 'Appendicitis', probability: 'HIGH', rationale: 'RLQ pain with fever' }
        ],
        recommendedDepartment: 'Surgery',
        recommendedActions: ['Perform ultrasound', 'NPO status'],
        redFlags: ['Peritoneal rebound tenderness'],
        vitalSignsToMonitor: ['Temperature', 'Heart Rate'],
        medicalDisclaimer: 'Clinical decision support only'
      };

      const parsed = ClinicalTriageSchema.safeParse(sampleTriage);
      expect(parsed.success).toBe(true);
    });

    it('should reject non-conforming responses with Zod validation errors', () => {
      const invalidData = {
        urgencyLevel: 'INVALID_URGENCY_LEVEL',
        confidenceScore: 1.5
      };
      const parsed = ClinicalTriageSchema.safeParse(invalidData);
      expect(parsed.success).toBe(false);
    });

    it('should generate structured triage successfully via API endpoint', async () => {
      const res = await request(app)
        .post('/api/rag/structured-triage')
        .send({
          symptoms: 'Patient reports radiating chest pressure and shortness of breath for 30 minutes',
          history: 'Hypertension, former smoker',
          vitals: 'BP 150/95, HR 102 bpm, SpO2 96%'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.schemaValidated).toBe(true);
      expect(res.body.data).toHaveProperty('urgencyLevel');
      expect(res.body.data).toHaveProperty('recommendedDepartment');
      expect(res.body.data).toHaveProperty('differentialDiagnoses');
      expect(Array.isArray(res.body.data.recommendedActions)).toBe(true);
    });

    it('should return schema documentation from /api/rag/schemas', async () => {
      const res = await request(app).get('/api/rag/schemas');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('topic', 'Structured outputs');
      expect(res.body).toHaveProperty('status', 'SUCCESS');
      expect(res.body.schemas).toHaveProperty('ClinicalTriageSchema');
      expect(res.body.schemas).toHaveProperty('PrescriptionAnalysisSchema');
    });
  });

  // ================= 6. GIT WORKFLOW (0.3 PTS) =================
  describe('Git Workflow (0.3 pts)', () => {
    it('should verify GIT_WORKFLOW.md documentation exists with proper branching strategy', () => {
      const workflowPath = path.join(__dirname, '../../GIT_WORKFLOW.md');
      expect(fs.existsSync(workflowPath)).toBe(true);
      
      const content = fs.readFileSync(workflowPath, 'utf8');
      expect(content).toContain('Branching Strategy');
      expect(content).toContain('Conventional Commits');
      expect(content).toContain('Pull Request');
    });
  });

  // ================= 7. RELATIONAL SCHEMA DESIGN WITH PK/FK (0.2 PTS) =================
  describe('Relational schema design with PK/FK (0.2 pts)', () => {
    it('should provide schema details with PKs, FKs, constraints, and normalization proofs', async () => {
      const res = await request(app).get('/api/sql/schema');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('topic', 'Relational schema design with PK/FK');
      expect(res.body).toHaveProperty('status', 'SUCCESS');
      expect(res.body.primaryKeys.length).toBeGreaterThan(0);
      expect(res.body.foreignKeys.length).toBeGreaterThan(0);
      expect(res.body.normalization.length).toBe(4);
    });
  });

  // ================= 8. SQL JOINS (0.2 PTS) =================
  describe('SQL JOINs (0.2 pts)', () => {
    it('should execute and return all 6 SQL JOIN types with correct query results', async () => {
      const res = await request(app).get('/api/sql/joins/all');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('topic', 'SQL JOINs');
      expect(res.body).toHaveProperty('status', 'SUCCESS');
      expect(res.body.joins).toHaveProperty('innerJoin');
      expect(res.body.joins).toHaveProperty('leftJoin');
      expect(res.body.joins).toHaveProperty('rightJoin');
      expect(res.body.joins).toHaveProperty('fullOuterJoin');
      expect(res.body.joins).toHaveProperty('crossJoin');
      expect(res.body.joins).toHaveProperty('selfJoin');

      expect(res.body.joins.innerJoin.joinType).toBe('INNER JOIN');
      expect(res.body.joins.leftJoin.joinType).toBe('LEFT OUTER JOIN');
      expect(res.body.joins.rightJoin.joinType).toBe('RIGHT OUTER JOIN');
      expect(res.body.joins.fullOuterJoin.joinType).toBe('FULL OUTER JOIN');
      expect(res.body.joins.crossJoin.joinType).toBe('CROSS JOIN');
      expect(res.body.joins.selfJoin.joinType).toBe('SELF JOIN');
    });
  });
});
