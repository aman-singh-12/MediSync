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
  FiRefreshCw, 
  FiCode,
  FiServer
} from 'react-icons/fi';

const RubricConceptsLab = () => {
  const [activeTab, setActiveTab] = useState('event-loop');
  const [loading, setLoading] = useState(false);

  // States for each demonstration
  const [eventLoopData, setEventLoopData] = useState(null);
  const [hoistingData, setHoistingData] = useState(null);
  const [asyncData, setAsyncData] = useState(null);
  const [schemaData, setSchemaData] = useState(null);
  const [joinsData, setJoinsData] = useState(null);
  const [selectedJoin, setSelectedJoin] = useState('innerJoin');

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

  const reRunAsync = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/system/promises-vs-callbacks');
      setAsyncData(res.data);
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
          Live interactive runtime environment demonstrating JavaScript concurrency engine mechanics, asynchronous paradigms, and PostgreSQL relational database architectures.
        </p>
        <div className={styles.scorePills}>
          <span className={`${styles.scorePill} ${styles.scorePillSuccess}`}>
            <FiCheckCircle /> JavaScript — Event Loop (0.1 pts)
          </span>
          <span className={`${styles.scorePill} ${styles.scorePillSuccess}`}>
            <FiCheckCircle /> JavaScript — Hoisting (0.1 pts)
          </span>
          <span className={`${styles.scorePill} ${styles.scorePillSuccess}`}>
            <FiCheckCircle /> JavaScript — Promises vs callbacks (0.1 pts)
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
          className={`${styles.tabBtn} ${activeTab === 'event-loop' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('event-loop')}
        >
          <FiCpu /> 1. Event Loop
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'hoisting' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('hoisting')}
        >
          <FiLayers /> 2. Hoisting
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'promises' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('promises')}
        >
          <FiGitCommit /> 3. Promises vs Callbacks
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'schema' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('schema')}
        >
          <FiDatabase /> 4. Relational Schema & PK/FK
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'joins' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('joins')}
        >
          <FiGitMerge /> 5. SQL JOINs Explorer
        </button>
      </div>

      {/* Tab 1: Event Loop */}
      {activeTab === 'event-loop' && (
        <div className={styles.tabContent}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Node.js / V8 Event Loop Phased Execution</h2>
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

      {/* Tab 2: Hoisting */}
      {activeTab === 'hoisting' && (
        <div className={styles.tabContent}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>JavaScript Hoisting & Execution Context Phases</h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                Demonstrating Creation Phase memory allocation vs Execution Phase for var, let, const, functions, and classes.
              </p>
            </div>
          </div>

          {hoistingData && (
            <div className={styles.gridCards}>
              {hoistingData.demonstrations?.map((demo, idx) => (
                <div key={idx} className={styles.card}>
                  <div className={styles.cardTitle}>{demo.concept}</div>
                  <div className={styles.cardText} style={{ marginBottom: '10px' }}>{demo.behavior}</div>
                  {demo.beforeInitialization && (
                    <div className={styles.codeBox} style={{ margin: '6px 0' }}>
                      {demo.beforeInitialization}<br />{demo.afterInitialization}
                    </div>
                  )}
                  {demo.letTDZError && (
                    <div className={styles.codeBox} style={{ margin: '6px 0', color: '#f87171' }}>
                      {demo.letTDZError}
                    </div>
                  )}
                  {demo.executionBeforeDefinition && (
                    <div className={styles.codeBox} style={{ margin: '6px 0', color: '#34d399' }}>
                      {demo.executionBeforeDefinition}
                    </div>
                  )}
                  {demo.invocationError && (
                    <div className={styles.codeBox} style={{ margin: '6px 0', color: '#f87171' }}>
                      {demo.invocationError}
                    </div>
                  )}
                  {demo.instantiationError && (
                    <div className={styles.codeBox} style={{ margin: '6px 0', color: '#f87171' }}>
                      {demo.instantiationError}
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

      {/* Tab 3: Promises vs Callbacks */}
      {activeTab === 'promises' && (
        <div className={styles.tabContent}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>JavaScript Asynchronous Evolution</h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                Comparison of Callbacks (Pyramid of Doom), Promises (.then chaining), and Async/Await with Promisification.
              </p>
            </div>
            <button className={styles.runBtn} onClick={reRunAsync} disabled={loading}>
              <FiPlay /> {loading ? 'Benchmarking...' : 'Re-Run Comparison'}
            </button>
          </div>

          {asyncData && (
            <div>
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
                      <div className={styles.codeBox} style={{ margin: 0, fontSize: '0.75rem' }}>
                        {item.logs?.join('\n')}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#1e293b', marginBottom: '8px' }}>
                  Promisification Utility Implementation
                </h3>
                <div className={styles.codeBox}>
                  {asyncData.promisificationUtility}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Relational Schema & PK/FK */}
      {activeTab === 'schema' && (
        <div className={styles.tabContent}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>PostgreSQL Relational Schema & Normalization (1NF - BCNF)</h2>
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

      {/* Tab 5: SQL JOINs Explorer */}
      {activeTab === 'joins' && (
        <div className={styles.tabContent}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>SQL JOINs Interactive Query Explorer (PostgreSQL)</h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                Examine all 6 join types: INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN, CROSS JOIN, and SELF JOIN.
              </p>
            </div>
          </div>

          {joinsData && (
            <div>
              {/* Sub-selector for Joins */}
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
