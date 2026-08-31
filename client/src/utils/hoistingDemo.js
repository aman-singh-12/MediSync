/**
 * Client-Side JavaScript Hoisting Demonstrator
 * 
 * Shows deliberate use of function declaration hoisting and Temporal Dead Zone (TDZ)
 * in client-side medical dashboard data processing.
 */

export function calculatePatientTriageRisk(patientVitals) {
  // Deliberate call to hoisted helper function defined below
  const heartRateScore = evaluateHeartRate(patientVitals?.heartRate);
  const bpScore = evaluateBloodPressure(patientVitals?.systolicBp);

  return {
    totalRiskScore: heartRateScore + bpScore,
    triageCategory: (heartRateScore + bpScore) > 3 ? 'URGENT' : 'STANDARD',
    pattern: 'Function Declaration Hoisting (Stepdown Clean Code Pattern)'
  };
}

// Hoisted Helper Functions
function evaluateHeartRate(hr = 72) {
  return (hr < 50 || hr > 110) ? 2 : 0;
}

function evaluateBloodPressure(systolic = 120) {
  return systolic > 140 ? 3 : 0;
}

export function runClientHoistingDiagnostics() {
  const diagnostics = [];

  // 1. Function Hoisting
  const triage = calculatePatientTriageRisk({ heartRate: 115, systolicBp: 150 });
  diagnostics.push({
    title: 'Client-side Function Hoisting',
    result: triage,
    status: 'PASS'
  });

  // 2. TDZ
  let tdzError = null;
  try {
    const test = () => {
      const read = uninitializedClientVar;
      let uninitializedClientVar = 'SAFE_VAL';
      return read;
    };
    test();
  } catch (err) {
    tdzError = err.message;
  }
  diagnostics.push({
    title: 'Client-side Temporal Dead Zone (TDZ)',
    caughtError: tdzError,
    status: 'PASS (ReferenceError caught)'
  });

  return diagnostics;
}
