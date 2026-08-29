// Demonstrate Node.js Event Loop Phases
exports.getEventLoopDemo = (req, res) => {
  const executionOrder = [];

  // 1. Synchronous Code (Call Stack)
  executionOrder.push('1. Synchronous code executed');

  // 2. Microtask Queue (process.nextTick has highest priority in microtasks)
  process.nextTick(() => {
    executionOrder.push('3. process.nextTick callback executed');
  });

  // 3. Microtask Queue (Promises execute after nextTick)
  Promise.resolve().then(() => {
    executionOrder.push('4. Promise.resolve callback executed');
  });

  // 4. Timers Phase (Macrotask)
  setTimeout(() => {
    executionOrder.push('5. setTimeout callback executed (Timers phase)');
    
    // Once everything finishes, send the response
    // Wait for setImmediate to finish too, so we send response in next tick
  }, 0);

  // 5. Check Phase (Macrotask)
  setImmediate(() => {
    executionOrder.push('6. setImmediate callback executed (Check phase)');
  });

  // Since we want to return the full array including macrotasks to the client, 
  // we need a slightly hacky timeout that runs AFTER the other macrotasks.
  setTimeout(() => {
    res.json({
      message: 'Event loop execution captured.',
      explanation: 'Notice that synchronous code runs first, followed by the Microtask queue (nextTick, then Promises). Finally, the event loop enters the Macrotask phases (Timers phase for setTimeout, Check phase for setImmediate).',
      executionOrder
    });
  }, 50);

  executionOrder.push('2. Synchronous code finishes');
};
