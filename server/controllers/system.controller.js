// System controller: pedagogical demonstrations for Node.js Event Loop and JavaScript Hoisting.
const hoistingDemo = require('../utils/hoistingDemo');

// ================= DEMONSTRATE NODE.JS EVENT LOOP PHASES =================
// Logic: Captures and logs the exact execution lifecycle order of Call Stack, Microtasks (process.nextTick, Promise), and Macrotasks (setTimeout, setImmediate)
exports.getEventLoopDemo = (req, res) => {
  const executionOrder = [];

  // 1. Synchronous Code (Call Stack) - Executes immediately on call stack
  executionOrder.push('1. Synchronous code executed');

  // 2. Microtask Queue (process.nextTick has highest priority in microtasks)
  process.nextTick(() => {
    executionOrder.push('3. process.nextTick callback executed');
  });

  // 3. Microtask Queue (Promises execute after process.nextTick)
  Promise.resolve().then(() => {
    executionOrder.push('4. Promise.resolve callback executed');
  });

  // 4. Timers Phase (Macrotask Queue - setTimeout)
  setTimeout(() => {
    executionOrder.push('5. setTimeout callback executed (Timers phase)');
  }, 0);

  // 5. Check Phase (Macrotask Queue - setImmediate)
  setImmediate(() => {
    executionOrder.push('6. setImmediate callback executed (Check phase)');
  });

  // 6. Deferred response timer to return aggregated sequence result
  setTimeout(() => {
    res.json({
      message: 'Event loop execution captured.',
      explanation: 'Notice that synchronous code runs first, followed by the Microtask queue (nextTick, then Promises). Finally, the event loop enters the Macrotask phases (Timers phase for setTimeout, Check phase for setImmediate).',
      executionOrder
    });
  }, 50);

  executionOrder.push('2. Synchronous code finishes');
};

// ================= DEMONSTRATE JAVASCRIPT HOISTING =================
// Logic: Runs hoisting demonstration testing behavior of var, let, const, and function declarations
exports.getHoistingDemo = (req, res) => {
  const result = hoistingDemo.runHoistingDemo();
  res.json(result);
};

