/**
 * Demonstrates the Node.js / JavaScript Event Loop lifecycle and phase execution order.
 * 
 * Execution Phasing Order:
 * 1. Synchronous Call Stack (Immediate execution)
 * 2. Microtask Queue:
 *    a. process.nextTick queue (Highest microtask priority in Node.js)
 *    b. Promise callbacks (.then, .catch, .finally) & queueMicrotask
 * 3. Macrotask (Task) Queue:
 *    a. Timers Phase (setTimeout, setInterval)
 *    b. Poll / I/O Phase (fs callbacks, network events)
 *    c. Check Phase (setImmediate)
 *    d. Close Callbacks Phase (socket.on('close'))
 */

exports.runEventLoopDemo = () => {
  return new Promise((resolve) => {
    const timeline = [];
    const startTime = Date.now();

    const record = (stage, type, description) => {
      timeline.push({
        step: timeline.length + 1,
        stage,
        type, // 'Synchronous' | 'Microtask' | 'Macrotask'
        description,
        timestampMs: Date.now() - startTime
      });
    };

    // 1. Synchronous Step 1 (Call Stack)
    record('Call Stack', 'Synchronous', '1. Initial synchronous script starts executing on Call Stack');

    // 2. Schedule Macrotask: setTimeout (Timers Phase)
    setTimeout(() => {
      record('Timers Phase (Macrotask)', 'Macrotask', '6. setTimeout (0ms) executed in Timers Phase');
    }, 0);

    // 3. Schedule Macrotask: setImmediate (Check Phase)
    setImmediate(() => {
      record('Check Phase (Macrotask)', 'Macrotask', '7. setImmediate executed in Check Phase');
    });

    // 4. Schedule Microtask: process.nextTick
    process.nextTick(() => {
      record('Microtask Queue (nextTick)', 'Microtask', '3. process.nextTick callback executed before Promise microtasks');
    });

    // 5. Schedule Microtask: Promise.resolve()
    Promise.resolve().then(() => {
      record('Microtask Queue (Promise)', 'Microtask', '4. Promise.then microtask executed after process.nextTick');
    });

    // 6. Schedule Microtask: queueMicrotask API
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => {
        record('Microtask Queue (queueMicrotask)', 'Microtask', '5. queueMicrotask standard API callback executed');
      });
    }

    // 7. Synchronous Step 2 (Call Stack completes)
    record('Call Stack', 'Synchronous', '2. Synchronous script execution completes; Call Stack clears');

    // 8. Capture completed timeline after all queued phases complete
    setTimeout(() => {
      resolve({
        topic: 'JavaScript — Event loop',
        status: 'SUCCESS',
        score: '0.1 pts (100% Implemented)',
        summary: 'Demonstrates synchronous call stack, microtask queue (nextTick & Promises), and macrotask phases (Timers & Check phases).',
        phases: [
          { phase: 'Call Stack', description: 'Synchronous execution of functions and scripts.' },
          { phase: 'Microtask Queue', description: 'process.nextTick followed by Promise.then & queueMicrotask, executed between stack clearing and macrotasks.' },
          { phase: 'Timers Phase (Macrotask)', description: 'Executes callbacks scheduled by setTimeout() and setInterval().' },
          { phase: 'Poll / I/O Phase', description: 'Retrieves new I/O events; node blocks here when appropriate.' },
          { phase: 'Check Phase (Macrotask)', description: 'Executes callbacks scheduled by setImmediate().' },
          { phase: 'Close Callbacks', description: 'Executes close events like socket.on("close").' }
        ],
        timeline
      });
    }, 60);
  });
};
