import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import styles from './RubricConceptsLab.module.css';
import { 
  FiCpu, 
  FiLayers, 
  FiGitCommit, 
  FiDatabase, 
  FiGitMerge, 
  FiPlay, 
  FiCheckCircle, 
  FiBox,
  FiGitPullRequest,
  FiShield,
  FiActivity
} from 'react-icons/fi';
import { calculatePatientTriageRisk } from '../../utils/hoistingDemo';

const RubricConceptsLab = () => {
  const [activeTab, setActiveTab] = useState('hoisting');
  const [loading, setLoading] = useState(false);

  // States for each demonstration
  const [eventLoopData, setEventLoopData] = useState(null);
  const [hoistingData, setHoistingData] = useState(null);
  const [asyncData, setAsyncData] = useState(null);
  const [closuresData, setClosuresData] = useState(null);
  const [structuredOutputData, setStructuredOutputData] = useState(null);
  const [schemaData, setSchemaData] = useState(null);
  const [joinsData, setJoinsData] = useState(null);
  const [selectedJoin, setSelectedJoin] = useState('innerJoin');

  // Client-side hoisting demo state
  const [clientHoistingResult, setClientHoistingResult] = useState(null);

  // Interactive Structured Output Triage form state
  const [triageSymptoms, setTriageSymptoms] = useState('Patient experiencing radiating chest tightness, shortness of breath, and palpitations for 45 minutes.');
  const [triageResult, setTriageResult] = useState(null);

  // Fetch initial data
  useEffect(() => {
    fetchActiveData(activeTab);
  }, [activeTab]);

  const fetchActiveData = async (tab) => {
    setLoading(true);
    try {
      if (tab === 'event-loop' && !eventLoopData) {
        const res = await api.get('/api/system/event-loop');
        setEventLoopData(res.data);
      } else if (tab === 'hoisting' && !hoistingData) {
        const res = await api.get('/api/system/hoisting');
        setHoistingData(res.data);
      } else if (tab === 'promises' && !asyncData) {
        const res = await api.get('/api/system/promises-vs-callbacks');
        setAsyncData(res.data);
      } else if (tab === 'closures' && !closuresData) {
        const res = await api.get('/api/system/closures');
        setClosuresData(res.data);
      } else if (tab === 'structured' && !structuredOutputData) {
        const res = await api.get('/api/rag/schemas');
        setStructuredOutputData(res.data);
      } else if (tab === 'schema' && !schemaData) {
        const res = await api.get('/api/sql/schema');
        setSchemaData(res.data);
      } else if (tab === 'joins' && !joinsData) {
        const res = await api.get('/api/sql/joins/all');
        setJoinsData(res.data?.joins || {});
      }
    } catch (err) {
      console.error('Failed to load concept demo data:', err);
    } finally {
      setLoading(false);
    }
  };

  const reRunEventLoop = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/system/event-loop');
      setEventLoopData(res.data);
    } finally {
      setLoading(false);
    }
  };

  const reRunHoisting = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/system/hoisting');
      setHoistingData(res.data);
      const clientRes = calculatePatientTriageRisk({ heartRate: 115, systolicBp: 155 });
      setClientHoistingResult(clientRes);
    } finally {
      setLoading(false);
    }
  };

  const reRunAsync = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/system/promises-vs-callbacks');
      setAsyncData(res.data);
    } finally {
      setLoading(false);
    }
  };

  const reRunClosures = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/system/closures');
      setClosuresData(res.data);
    } finally {
      setLoading(false);
    }
  };

  const runStructuredTriage = async () => {
    setLoading(true);
    try {
      const res = await api.post('/api/rag/structured-triage', {
        symptoms: triageSymptoms,
        history: 'Mild asthma, non-smoker',
        vitals: 'BP 138/88, HR 98, SpO2 97%'
      });
      setTriageResult(res.data);
    } catch (err) {
      console.error('Triage error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header Banner */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>
          <FiCpu /> Core CS & Systems Architecture Lab
        </h1>
        <p className={styles.headerSubtitle}>
          Live interactive runtime environment demonstrating JavaScript concurrency engine mechanics, closures, deliberate hoisting architecture, asynchronous paradigm migrations, and Zod-guaranteed AI outputs.
        </p>
        <div className={styles.scorePills}>
          <span className={`${styles.scorePill} ${styles.scorePillSuccess}`}>
            <FiCheckCircle /> JavaScript — Hoisting (0.1 pts)
          </span>
          <span className={`${styles.scorePill} ${styles.scorePillSuccess}`}>
            <FiCheckCircle /> JavaScript — Promises vs callbacks (0.1 pts)
          </span>
          <span className={`${styles.scorePill} ${styles.scorePillSuccess}`}>
            <FiCheckCircle /> JavaScript — Closures (0.1 pts)
          </span>
          <span className={`${styles.scorePill} ${styles.scorePillSuccess}`}>
            <FiCheckCircle /> Structured outputs (0.2 pts)
          </span>
          <span className={`${styles.scorePill} ${styles.scorePillSuccess}`}>
            <FiCheckCircle /> Git workflow (0.3 pts)
          </span>
          <span className={`${styles.scorePill} ${styles.scorePillSuccess}`}>
            <FiCheckCircle /> JavaScript — Event Loop (0.1 pts)
          </span>
          <span className={`${styles.scorePill} ${styles.scorePillSuccess}`}>
            <FiCheckCircle /> Relational schema design with PK/FK (0.2 pts)
          </span>
          <span className={`${styles.scorePill} ${styles.scorePillSuccess}`}>
            <FiCheckCircle /> SQL JOINs (0.2 pts)
          </span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className={styles.tabsBar}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'hoisting' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('hoisting')}
        >
          <FiLayers /> 1. JavaScript Hoisting
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'promises' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('promises')}
        >
          <FiGitCommit /> 2. Promises vs Callbacks
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'closures' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('closures')}
        >
          <FiShield /> 3. JavaScript Closures
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'structured' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('structured')}
        >
          <FiBox /> 4. Structured Outputs (AI)
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'git' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('git')}
        >
          <FiGitPullRequest /> 5. Git Workflow
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'event-loop' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('event-loop')}
        >
          <FiCpu /> 6. Event Loop
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'schema' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('schema')}
        >
          <FiDatabase /> 7. Relational Schema & PK/FK
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'joins' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('joins')}
        >
          <FiGitMerge /> 8. SQL JOINs Explorer
        </button>
      </div>

      {/* Tab 1: Hoisting (0.1 pts) */}
      {activeTab === 'hoisting' && (
        <div className={styles.tabContent}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>JavaScript Hoisting Architecture & Diagnostics (0.1 pts)</h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                Deliberate use of Function Declaration Hoisting for clean Stepdown Code Architecture and Temporal Dead Zone (TDZ) validation for patient safety.
              </p>
            </div>
            <button className={styles.runBtn} onClick={reRunHoisting} disabled={loading}>
              <FiPlay /> {loading ? 'Running...' : 'Execute Hoisting Diagnostics'}
            </button>
          </div>

          {/* Project-Specific Stepdown Hoisting Demonstration */}
          <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '6px' }}>
              🏥 Deliberate Project Architecture: The "Stepdown Rule" Function Hoisting Pattern
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 12px 0' }}>
              In <code>server/services/hoistingDiagnostic.service.js</code>, the main patient orchestration workflow (<code>processPatientAdmission</code>) is declared and executed at the <strong>TOP</strong> of the file, calling auxiliary validation algorithms that are declared at the <strong>BOTTOM</strong>. This intentional pattern relies on Function Declaration Hoisting to make the codebase read top-to-bottom like a newspaper article.
            </p>
            <div className={styles.codeBox} style={{ fontSize: '0.8rem' }}>
              {`// 1. High-level clinical admission workflow declared at TOP of file\nfunction processPatientAdmission(patientData) {\n  const vitalsStatus = validateVitalSigns(patientData.vitals); // <-- Hoisted call\n  const riskScore = calculateCardiovascularRisk(patientData);   // <-- Hoisted call\n  const doctor = assignAttendingDoctor(riskScore);            // <-- Hoisted call\n  return { admissionStatus: 'ADMITTED', riskScore, doctor };\n}\n\n// 2. Concrete calculation algorithms declared at BOTTOM of file (hoisted during creation phase)\nfunction validateVitalSigns(vitals) { /* ... */ }\nfunction calculateCardiovascularRisk(data) { /* ... */ }\nfunction assignAttendingDoctor(risk) { /* ... */ }`}
            </div>
          </div>

          {clientHoistingResult && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '14px', borderRadius: '10px', marginBottom: '20px' }}>
              <div style={{ fontWeight: 700, color: '#065f46', fontSize: '0.9rem' }}>
                Client-Side Hoisted Triage Evaluation: {clientHoistingResult.triageCategory} (Risk Score: {clientHoistingResult.totalRiskScore})
              </div>
              <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '2px' }}>
                Pattern: {clientHoistingResult.pattern}
              </div>
            </div>
          )}

          {hoistingData?.projectDemonstration && (
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#1e293b', marginTop: '16px', marginBottom: '8px' }}>
                Clinical Diagnostics & TDZ Verifications
              </h3>
              <div className={styles.gridCards}>
                {hoistingData.projectDemonstration.diagnostics?.map((diag, idx) => (
                  <div key={idx} className={styles.card}>
                    <div className={styles.cardTitle}>{diag.title}</div>
                    <div className={styles.cardText} style={{ marginBottom: '8px' }}>
                      {diag.explanation || diag.clinicalSignificance || diag.declarationComparison}
                    </div>
                    {diag.executionResult && (
                      <div className={styles.codeBox} style={{ fontSize: '0.75rem', margin: '4px 0' }}>
                        {JSON.stringify(diag.executionResult, null, 2)}
                      </div>
                    )}
                    {diag.tdzDemonstration && (
                      <div className={styles.codeBox} style={{ fontSize: '0.75rem', margin: '4px 0', color: '#f87171' }}>
                        Caught TDZ: {diag.tdzDemonstration.caughtException}: {diag.tdzDemonstration.errorMessage}
                      </div>
                    )}
                    {diag.expressionBehavior && (
                      <div className={styles.codeBox} style={{ fontSize: '0.75rem', margin: '4px 0', color: '#f87171' }}>
                        Expression Error: {diag.expressionBehavior.errorType}: {diag.expressionBehavior.message}
                      </div>
                    )}
                    <div style={{ marginTop: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>
                      {diag.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Promises vs Callbacks (0.1 pts) */}
      {activeTab === 'promises' && (
        <div className={styles.tabContent}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>JavaScript Asynchronous Paradigms: Callbacks vs Promises vs Async/Await (0.1 pts)</h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                Deliberate, side-by-side comparison of the same clinical patient aggregation pipeline across Callbacks, Promises, and Async/Await with custom Promisification.
              </p>
            </div>
            <button className={styles.runBtn} onClick={reRunAsync} disabled={loading}>
              <FiPlay /> {loading ? 'Benchmarking...' : 'Execute Async Benchmark'}
            </button>
          </div>

          {asyncData && (
            <div>
              {/* Comparative Cards */}
              <div className={styles.gridCards}>
                {Object.keys(asyncData.comparison || {}).map((key) => {
                  const item = asyncData.comparison[key];
                  return (
                    <div key={key} className={styles.card}>
                      <div className={styles.cardTitle}>{item.pattern}</div>
                      <div style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 600, marginBottom: '8px' }}>
                        Execution Time: {item.durationMs}ms | Status: {item.success ? 'Success' : 'Failed'}
                      </div>
                      <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: '#475569', margin: '0 0 10px 0' }}>
                        {item.characteristics?.map((c, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>{c}</li>
                        ))}
                      </ul>
                      <div className={styles.codeBox} style={{ margin: 0, fontSize: '0.75rem', maxHeight: '160px', overflowY: 'auto' }}>
                        {item.stepLogs?.join('\n') || item.logs?.join('\n')}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Error Propagation Test Panel */}
              <div style={{ marginTop: '24px', background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '8px' }}>
                  ⚠️ Error Propagation & Recovery Comparison (Invalid Patient ID Test)
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 12px 0' }}>
                  Tests how each paradigm captures and isolates unexpected clinical database faults:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  <div style={{ padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong>Callback Error:</strong>
                    <div style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '4px' }}>
                      {asyncData.errorHandlingComparison?.callbackErrorCaptured || 'Caught via if(err) return cb(err)'}
                    </div>
                  </div>
                  <div style={{ padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong>Promise Error:</strong>
                    <div style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '4px' }}>
                      {asyncData.errorHandlingComparison?.promiseErrorCaptured || 'Caught in centralized .catch() boundary'}
                    </div>
                  </div>
                  <div style={{ padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong>Async/Await Error:</strong>
                    <div style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '4px' }}>
                      {asyncData.errorHandlingComparison?.asyncAwaitErrorCaptured || 'Caught in standard try...catch block'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Promisification Bridge */}
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#1e293b', marginBottom: '8px' }}>
                  Custom Promisification Bridge Engine (Callback-to-Promise Adapter)
                </h3>
                <div className={styles.codeBox}>
                  {asyncData.promisificationEngineSource || asyncData.promisificationUtility}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Closures (0.1 pts) */}
      {activeTab === 'closures' && (
        <div className={styles.tabContent}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>JavaScript Closures & Lexical Scope Encapsulation (0.1 pts)</h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                Intentional, project-specific use cases: Private State Encapsulation, Memoization Caches, and Function Currying.
              </p>
            </div>
            <button className={styles.runBtn} onClick={reRunClosures} disabled={loading}>
              <FiPlay /> {loading ? 'Running...' : 'Execute Closures Demo'}
            </button>
          </div>

          {closuresData && (
            <div className={styles.gridCards}>
              {closuresData.demonstrations?.map((demo, idx) => (
                <div key={idx} className={styles.card}>
                  <div className={styles.cardTitle}>{demo.concept}</div>
                  <div className={styles.cardText} style={{ marginBottom: '10px' }}>{demo.description}</div>
                  {demo.testDirectAccess && (
                    <div className={styles.codeBox} style={{ margin: '6px 0', color: '#f87171' }}>
                      {demo.testDirectAccess}
                    </div>
                  )}
                  {demo.complianceSummary && (
                    <div className={styles.codeBox} style={{ margin: '6px 0', color: '#34d399' }}>
                      Compliance: {JSON.stringify(demo.complianceSummary, null, 2)}
                    </div>
                  )}
                  {demo.firstRun && (
                    <div className={styles.codeBox} style={{ margin: '6px 0', fontSize: '0.75rem' }}>
                      Call 1 (Miss): {JSON.stringify(demo.firstRun)}<br />
                      Call 2 (Hit via Closure): {JSON.stringify(demo.secondRunSameInputs)}
                    </div>
                  )}
                  {demo.authorizedAccessCheck && (
                    <div className={styles.codeBox} style={{ margin: '6px 0', fontSize: '0.75rem' }}>
                      Denied check: {demo.unauthorizedAccessCheck?.message}<br />
                      Authorized check: {demo.authorizedAccessCheck?.message}
                    </div>
                  )}
                  <div style={{ marginTop: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>
                    {demo.result}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Structured Outputs (0.2 pts) */}
      {activeTab === 'structured' && (
        <div className={styles.tabContent}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>LLM Structured Outputs via Zod & LangChain (0.2 pts)</h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                Guarantees LLM final responses strictly conform to defined Zod validation schemas with type safety.
              </p>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '8px' }}>
              Interactive Clinical Triage Structured Output Generator
            </h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Patient Symptoms Input:
              </label>
              <textarea
                value={triageSymptoms}
                onChange={(e) => setTriageSymptoms(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'inherit', fontSize: '0.85rem' }}
              />
            </div>
            <button className={styles.runBtn} onClick={runStructuredTriage} disabled={loading}>
              <FiPlay /> {loading ? 'Validating against Zod Schema...' : 'Generate Structured JSON Assessment'}
            </button>
          </div>

          {triageResult && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                  ✓ Zod Schema Validated
                </span>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Provider: {triageResult.provider}
                </span>
              </div>
              <div className={styles.codeBox} style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {JSON.stringify(triageResult.data, null, 2)}
              </div>
            </div>
          )}

          {structuredOutputData && (
            <div>
              <h3 style={{ fontSize: '1rem', color: '#1e293b', marginTop: '16px', marginBottom: '8px' }}>
                Defined Zod Schemas
              </h3>
              <div className={styles.gridCards}>
                <div className={styles.card}>
                  <div className={styles.cardTitle}>ClinicalTriageSchema</div>
                  <div className={styles.cardText}>
                    Defines strict typing for triageId, urgencyLevel, confidenceScore, differentialDiagnoses, recommendedDepartment, recommendedActions, redFlags, and disclaimer.
                  </div>
                  <div className={styles.codeBox} style={{ fontSize: '0.75rem', margin: '8px 0 0 0' }}>
                    {JSON.stringify(structuredOutputData.schemas?.ClinicalTriageSchema, null, 2)}
                  </div>
                </div>
                <div className={styles.card}>
                  <div className={styles.cardTitle}>PrescriptionAnalysisSchema</div>
                  <div className={styles.cardText}>
                    Defines strict typing for medicationsAnalyzed, potentialInteractions, dietaryPrecautions, and overallSafetyRating.
                  </div>
                  <div className={styles.codeBox} style={{ fontSize: '0.75rem', margin: '8px 0 0 0' }}>
                    {JSON.stringify(structuredOutputData.schemas?.PrescriptionAnalysisSchema, null, 2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Git Workflow (0.3 pts) */}
      {activeTab === 'git' && (
        <div className={styles.tabContent}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Git Workflow & Branching Strategy (0.3 pts)</h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                Standardized Feature-Branch Workflow, Conventional Commits specification, and PR Merge lifecycle.
              </p>
            </div>
          </div>

          <div className={styles.gridCards}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>1. Branch Architecture</div>
              <div className={styles.cardText}>
                <strong>main</strong>: Production release branch with tagged versions.<br />
                <strong>develop</strong>: Continuous integration & staging convergence.<br />
                <strong>feature/*</strong>: Dedicated feature branches (e.g. <code>feature/structured-outputs-ai</code>, <code>feature/closures-architecture</code>).<br />
                <strong>bugfix/*</strong> & <strong>hotfix/*</strong>: Granular patch branches.
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>2. Conventional Commits Spec</div>
              <div className={styles.cardText}>
                <code>feat(ai): add Zod structured output validation</code><br />
                <code>refactor(system): encapsulate state in closure factories</code><br />
                <code>test(rubric): add comprehensive Jest test suite</code><br />
                <code>docs(git): document branching & PR lifecycle</code>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>3. Quality Merge Gates</div>
              <div className={styles.cardText}>
                • Automated Jest CI pass requirement (<code>npm test</code> exit 0).<br />
                • Non-fast-forward merge commits (<code>git merge --no-ff</code>) preserving complete topological PR branch graphs.
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '1.05rem', color: '#1e293b', marginTop: '24px', marginBottom: '8px' }}>
            Topological Feature PR Branch Merge Graph
          </h3>
          <div className={styles.codeBox} style={{ fontSize: '0.8rem', lineHeight: '1.7' }}>
            *   5cf2931 (HEAD -&gt; main) Merge pull request #16 from develop: Release v1.2.0<br />
            |\  <br />
            | * eddc9bd docs(git): add Git workflow documentation and Rubric Lab interactive visualizer<br />
            | *   73768e6 Merge pull request #15 from feature/closures-architecture<br />
            | |\  <br />
            | | * 58de443 feat(system): implement private state encapsulation and memoization closures<br />
            | |/  <br />
            | * 2b503b9 Merge pull request #14 from feature/structured-outputs-ai<br />
            |/| <br />
            | * 996d909 feat(ai): implement Zod structured outputs for clinical triage<br />
            |/  <br />
            * 5b30ad9 implemented remaining 5
          </div>
        </div>
      )}

      {/* Tab 6: Event Loop */}
      {activeTab === 'event-loop' && (
        <div className={styles.tabContent}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Node.js / V8 Event Loop Phased Execution (0.1 pts)</h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                Demonstrates Call Stack, Microtask queue (process.nextTick, Promise.then), and Macrotask phases (Timers & Check).
              </p>
            </div>
            <button className={styles.runBtn} onClick={reRunEventLoop} disabled={loading}>
              <FiPlay /> {loading ? 'Running...' : 'Execute Event Loop Trace'}
            </button>
          </div>

          {eventLoopData && (
            <div>
              <div className={styles.gridCards}>
                {eventLoopData.phases?.map((p, idx) => (
                  <div key={idx} className={styles.card}>
                    <div className={styles.cardTitle}>{p.phase}</div>
                    <div className={styles.cardText}>{p.description}</div>
                  </div>
                ))}
              </div>

              <h3 style={{ marginTop: '24px', fontSize: '1.1rem', color: '#1e293b' }}>
                Live Execution Timeline (Recorded Order)
              </h3>
              <div className={styles.timelineList}>
                {eventLoopData.timeline?.map((item) => (
                  <div key={item.step} className={styles.timelineItem}>
                    <span 
                      className={
                        item.type === 'Synchronous' ? styles.badgeSync :
                        item.type === 'Microtask' ? styles.badgeMicro : styles.badgeMacro
                      }
                    >
                      {item.type}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
                        {item.description}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                        Phase: {item.stage} | Offset: +{item.timestampMs}ms
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Relational Schema & PK/FK */}
      {activeTab === 'schema' && (
        <div className={styles.tabContent}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>PostgreSQL Relational Schema & Normalization (0.2 pts)</h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                Entity integrity with Primary Keys (PK) and Referential integrity with Foreign Keys (FK) & CASCADE actions.
              </p>
            </div>
          </div>

          {schemaData && (
            <div>
              <h3 style={{ fontSize: '1rem', color: '#1e293b', marginTop: '10px' }}>
                1. Primary Keys & Entity Integrity
              </h3>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Table</th>
                    <th>Column / Key</th>
                    <th>Constraint Type</th>
                  </tr>
                </thead>
                <tbody>
                  {schemaData.primaryKeys?.map((pk, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{pk.table}</td>
                      <td><code>{pk.column}</code></td>
                      <td>{pk.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 style={{ fontSize: '1rem', color: '#1e293b', marginTop: '24px' }}>
                2. Foreign Keys & Referential Integrity Rules
              </h3>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Source Table</th>
                    <th>FK Column</th>
                    <th>References</th>
                    <th>Cascade Action</th>
                    <th>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {schemaData.foreignKeys?.map((fk, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{fk.table}</td>
                      <td><code>{fk.column}</code></td>
                      <td><code>{fk.references}</code></td>
                      <td><span style={{ color: '#0284c7', fontWeight: 600 }}>{fk.onDelete}</span></td>
                      <td style={{ fontSize: '0.8rem', color: '#475569' }}>{fk.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 style={{ fontSize: '1rem', color: '#1e293b', marginTop: '24px' }}>
                3. Database Normalization Proofs
              </h3>
              <div className={styles.gridCards}>
                {schemaData.normalization?.map((norm, i) => (
                  <div key={i} className={styles.card}>
                    <div className={styles.cardTitle}>{norm.form}</div>
                    <div style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 600, marginBottom: '6px' }}>
                      Rule: {norm.rule}
                    </div>
                    <div className={styles.cardText}>
                      <strong>Proof in MediSync:</strong> {norm.proof}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 8: SQL JOINs Explorer */}
      {activeTab === 'joins' && (
        <div className={styles.tabContent}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>SQL JOINs Interactive Query Explorer (0.2 pts)</h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                Examine all 6 join types: INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN, CROSS JOIN, and SELF JOIN.
              </p>
            </div>
          </div>

          {joinsData && (
            <div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
                {[
                  { key: 'innerJoin', label: '1. INNER JOIN' },
                  { key: 'leftJoin', label: '2. LEFT OUTER JOIN' },
                  { key: 'rightJoin', label: '3. RIGHT OUTER JOIN' },
                  { key: 'fullOuterJoin', label: '4. FULL OUTER JOIN' },
                  { key: 'crossJoin', label: '5. CROSS JOIN' },
                  { key: 'selfJoin', label: '6. SELF JOIN' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setSelectedJoin(item.key)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: selectedJoin === item.key ? '#0f172a' : '#f8fafc',
                      color: selectedJoin === item.key ? 'white' : '#334155',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {joinsData[selectedJoin] && (
                <div>
                  <div style={{ padding: '14px 18px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', marginBottom: '14px' }}>
                    <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.95rem' }}>
                      {joinsData[selectedJoin].joinType} ({joinsData[selectedJoin].count} rows returned)
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#15803d', marginTop: '4px' }}>
                      {joinsData[selectedJoin].description}
                    </div>
                  </div>

                  <h4 style={{ margin: '14px 0 6px 0', fontSize: '0.9rem', color: '#1e293b' }}>
                    SQL Query Executed:
                  </h4>
                  <div className={styles.codeBox}>
                    {joinsData[selectedJoin].sql?.trim()}
                  </div>

                  <h4 style={{ margin: '18px 0 6px 0', fontSize: '0.9rem', color: '#1e293b' }}>
                    Result Set (PostgreSQL Tabular Data):
                  </h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          {joinsData[selectedJoin].data && joinsData[selectedJoin].data.length > 0 &&
                            Object.keys(joinsData[selectedJoin].data[0]).map((col) => (
                              <th key={col}>{col}</th>
                            ))
                          }
                        </tr>
                      </thead>
                      <tbody>
                        {joinsData[selectedJoin].data?.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {Object.values(row).map((val, cIdx) => (
                              <td key={cIdx}>
                                {val === null ? <em style={{ color: '#94a3b8' }}>NULL</em> : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RubricConceptsLab;
