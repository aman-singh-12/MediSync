/**
 * MediSync Clinical Systems - Asynchronous Paradigms Comparison Service
 * 
 * Demonstrates deliberate, side-by-side comparison of:
 * 1. Node.js Error-First Callbacks (Legacy Waterfall / Callback Hell)
 * 2. ES6 Promises (.then/.catch chaining)
 * 3. ES2017 Async / Await (Modern standard with try/catch)
 * 4. Custom Promisification Engine (Bridge converting callbacks to Promises)
 */

// Simulated asynchronous clinical database driver
const clinicalDb = {
  // 1. Patient Record Fetch
  fetchPatientRecord: (patientId, callback) => {
    setTimeout(() => {
      if (!patientId || patientId === 'INVALID_ID') {
        return callback(new Error(`[ClinicalDB] Patient ID '${patientId}' not found in registry.`), null);
      }
      callback(null, {
        patientId,
        name: 'Eleanor Vance',
        age: 58,
        bloodGroup: 'A+',
        primaryCondition: 'Cardiovascular Hypertension'
      });
    }, 15);
  },

  // 2. Patient Appointment History Fetch
  fetchAppointmentHistory: (patientId, callback) => {
    setTimeout(() => {
      if (!patientId) return callback(new Error('[ClinicalDB] Missing patientId for appointments.'), null);
      callback(null, [
        { appointmentId: 'APT-1001', doctorId: 'DOC-501', doctorName: 'Dr. Sarah Connor', date: '2026-08-25', status: 'completed' }
      ]);
    }, 15);
  },

  // 3. Clinical Prescriptions Fetch
  fetchPrescriptionDetails: (appointmentId, callback) => {
    setTimeout(() => {
      if (!appointmentId) return callback(new Error('[ClinicalDB] Missing appointmentId for prescriptions.'), null);
      callback(null, [
        { rxId: 'RX-701', medication: 'Atorvastatin', dosage: '20mg', instructions: 'Take 1 tablet at bedtime', cost: 45.00 },
        { rxId: 'RX-702', medication: 'Lisinopril', dosage: '10mg', instructions: 'Take 1 tablet daily in morning', cost: 30.00 }
      ]);
    }, 15);
  },

  // 4. Clinical Invoice Calculation
  calculateInvoiceTotal: (prescriptions, callback) => {
    setTimeout(() => {
      if (!Array.isArray(prescriptions)) return callback(new Error('[Billing] Invalid prescriptions payload.'), null);
      const subtotal = prescriptions.reduce((sum, item) => sum + (item.cost || 0), 0);
      const consultationFee = 150.00;
      callback(null, {
        consultationFee,
        medicationsSubtotal: subtotal,
        totalPayable: consultationFee + subtotal,
        currency: 'USD',
        paymentStatus: 'PAID'
      });
    }, 15);
  }
};

// ============================================================================
// 1. CUSTOM PROMISIFICATION BRIDGE
// ============================================================================
// Implements manual translation from Node.js (err, result) callbacks to Promises
function promisifyClinicalFn(callbackFn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      callbackFn(...args, (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      });
    });
  };
}

// Convert all clinicalDb methods to Promise-returning functions
const fetchPatientPromise = promisifyClinicalFn(clinicalDb.fetchPatientRecord);
const fetchAppointmentsPromise = promisifyClinicalFn(clinicalDb.fetchAppointmentHistory);
const fetchPrescriptionsPromise = promisifyClinicalFn(clinicalDb.fetchPrescriptionDetails);
const calculateInvoicePromise = promisifyClinicalFn(clinicalDb.calculateInvoiceTotal);


// ============================================================================
// 2. IMPLEMENTATION A: LEGACY ERROR-FIRST CALLBACK WATERFALL
// ============================================================================
function generateRecordWithCallbacks(patientId, finalCallback) {
  const startTime = Date.now();
  const stepLogs = [];

  // Stage 1: Fetch Patient
  clinicalDb.fetchPatientRecord(patientId, (err1, patient) => {
    if (err1) {
      stepLogs.push(`[Callback Stage 1 Error]: ${err1.message}`);
      return finalCallback(err1, { success: false, stepLogs, durationMs: Date.now() - startTime });
    }
    stepLogs.push(`1. Patient retrieved: ${patient.name} (${patient.primaryCondition})`);

    // Stage 2: Fetch Appointments (Nested Callback)
    clinicalDb.fetchAppointmentHistory(patient.patientId, (err2, appointments) => {
      if (err2) {
        stepLogs.push(`[Callback Stage 2 Error]: ${err2.message}`);
        return finalCallback(err2, { success: false, stepLogs, durationMs: Date.now() - startTime });
      }
      stepLogs.push(`2. Appointments retrieved: ${appointments.length} record(s) found`);

      const latestAppointment = appointments[0];

      // Stage 3: Fetch Prescriptions (Nested Callback)
      clinicalDb.fetchPrescriptionDetails(latestAppointment.appointmentId, (err3, prescriptions) => {
        if (err3) {
          stepLogs.push(`[Callback Stage 3 Error]: ${err3.message}`);
          return finalCallback(err3, { success: false, stepLogs, durationMs: Date.now() - startTime });
        }
        stepLogs.push(`3. Prescriptions retrieved: ${prescriptions.map(p => p.medication).join(', ')}`);

        // Stage 4: Calculate Invoice (Nested Callback)
        clinicalDb.calculateInvoiceTotal(prescriptions, (err4, invoice) => {
          if (err4) {
            stepLogs.push(`[Callback Stage 4 Error]: ${err4.message}`);
            return finalCallback(err4, { success: false, stepLogs, durationMs: Date.now() - startTime });
          }
          stepLogs.push(`4. Invoice computed: Total Payable $${invoice.totalPayable}`);

          // Final callback delivery
          finalCallback(null, {
            pattern: 'Node.js Error-First Callbacks',
            success: true,
            durationMs: Date.now() - startTime,
            stepLogs,
            result: {
              patient,
              appointment: latestAppointment,
              prescriptions,
              invoice
            },
            characteristics: [
              'Deep 4-level nested indentation ("Pyramid of Doom")',
              'Repetitive manual error checking (if (err) return callback(err)) at each step',
              'Difficult to compose with parallel flows or handle cleanup with finally',
              'Prone to missed return statements leading to double-callback executions'
            ]
          });
        });
      });
    });
  });
}


// ============================================================================
// 3. IMPLEMENTATION B: PROMISE CHAINING (.then / .catch)
// ============================================================================
function generateRecordWithPromises(patientId) {
  const startTime = Date.now();
  const stepLogs = [];
  let cachedPatient = null;
  let cachedAppointment = null;
  let cachedPrescriptions = null;

  return fetchPatientPromise(patientId)
    .then((patient) => {
      cachedPatient = patient;
      stepLogs.push(`1. Patient retrieved: ${patient.name} (${patient.primaryCondition})`);
      return fetchAppointmentsPromise(patient.patientId);
    })
    .then((appointments) => {
      cachedAppointment = appointments[0];
      stepLogs.push(`2. Appointments retrieved: ${appointments.length} record(s) found`);
      return fetchPrescriptionsPromise(cachedAppointment.appointmentId);
    })
    .then((prescriptions) => {
      cachedPrescriptions = prescriptions;
      stepLogs.push(`3. Prescriptions retrieved: ${prescriptions.map(p => p.medication).join(', ')}`);
      return calculateInvoicePromise(prescriptions);
    })
    .then((invoice) => {
      stepLogs.push(`4. Invoice computed: Total Payable $${invoice.totalPayable}`);
      return {
        pattern: 'Promises (.then / .catch Chaining)',
        success: true,
        durationMs: Date.now() - startTime,
        stepLogs,
        result: {
          patient: cachedPatient,
          appointment: cachedAppointment,
          prescriptions: cachedPrescriptions,
          invoice
        },
        characteristics: [
          'Linear, flat promise chain eliminating callback nesting',
          'Centralized error propagation handled in single trailing .catch() block',
          'Explicit state transition guarantees (Pending -> Fulfilled / Rejected)',
          'Easy composition with Promise.all and Promise.allSettled'
        ]
      };
    })
    .catch((error) => {
      stepLogs.push(`[Promise Caught Error]: ${error.message}`);
      return {
        pattern: 'Promises (.then / .catch Chaining)',
        success: false,
        durationMs: Date.now() - startTime,
        stepLogs,
        error: error.message
      };
    });
}


// ============================================================================
// 4. IMPLEMENTATION C: MODERN ASYNC / AWAIT WITH TRY-CATCH
// ============================================================================
async function generateRecordWithAsyncAwait(patientId) {
  const startTime = Date.now();
  const stepLogs = [];

  try {
    const patient = await fetchPatientPromise(patientId);
    stepLogs.push(`1. Patient retrieved: ${patient.name} (${patient.primaryCondition})`);

    const appointments = await fetchAppointmentsPromise(patient.patientId);
    stepLogs.push(`2. Appointments retrieved: ${appointments.length} record(s) found`);
    const latestAppointment = appointments[0];

    const prescriptions = await fetchPrescriptionsPromise(latestAppointment.appointmentId);
    stepLogs.push(`3. Prescriptions retrieved: ${prescriptions.map(p => p.medication).join(', ')}`);

    const invoice = await calculateInvoicePromise(prescriptions);
    stepLogs.push(`4. Invoice computed: Total Payable $${invoice.totalPayable}`);

    return {
      pattern: 'Async / Await (Modern Standard)',
      success: true,
      durationMs: Date.now() - startTime,
      stepLogs,
      result: {
        patient,
        appointment: latestAppointment,
        prescriptions,
        invoice
      },
      characteristics: [
        'Synchronous-style readability for asynchronous operations',
        'Standard JavaScript try...catch block error handling matching synchronous code',
        'Direct lexical variable access without intermediate outer-scope caching',
        'Full compatibility with modern JavaScript loops, conditions, and debugging breakpoints'
      ]
    };
  } catch (error) {
    stepLogs.push(`[Async/Await Caught Error]: ${error.message}`);
    return {
      pattern: 'Async / Await (Modern Standard)',
      success: false,
      durationMs: Date.now() - startTime,
      stepLogs,
      error: error.message
    };
  }
}


// ============================================================================
// 5. SIDE-BY-SIDE BENCHMARK & COMPARISON RUNNER
// ============================================================================
async function runAsyncComparisonBenchmark(patientId = 'PAT-9021') {
  // 1. Run Callback Pattern wrapped in Promise for test aggregation
  const callbackResult = await new Promise((resolve) => {
    generateRecordWithCallbacks(patientId, (err, res) => {
      resolve(res);
    });
  });

  // 2. Run Promise Chaining Pattern
  const promiseResult = await generateRecordWithPromises(patientId);

  // 3. Run Async/Await Pattern
  const asyncAwaitResult = await generateRecordWithAsyncAwait(patientId);

  // 4. Test Error Propagation with an Invalid Patient ID
  const callbackErrorResult = await new Promise((resolve) => {
    generateRecordWithCallbacks('INVALID_ID', (err, res) => {
      resolve({ success: false, errorCaught: err ? err.message : null });
    });
  });
  const promiseErrorResult = await generateRecordWithPromises('INVALID_ID');
  const asyncErrorResult = await generateRecordWithAsyncAwait('INVALID_ID');

  return {
    topic: 'JavaScript — Promises vs callbacks',
    status: 'SUCCESS',
    implementationStatus: 'COMPLETE',
    summary: 'Project-specific clinical record aggregator implemented across Callbacks, Promises, and Async/Await with custom Promisification bridge and error propagation testing.',
    comparison: {
      callbacks: callbackResult,
      promises: promiseResult,
      asyncAwait: asyncAwaitResult
    },
    errorHandlingComparison: {
      callbackErrorCaptured: callbackErrorResult.errorCaught,
      promiseErrorCaptured: promiseErrorResult.error,
      asyncAwaitErrorCaptured: asyncErrorResult.error
    },
    promisificationEngineSource: promisifyClinicalFn.toString()
  };
}

module.exports = {
  clinicalDb,
  promisifyClinicalFn,
  generateRecordWithCallbacks,
  generateRecordWithPromises,
  generateRecordWithAsyncAwait,
  runAsyncComparisonBenchmark
};
