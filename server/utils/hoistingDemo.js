/**
 * Demonstrates JavaScript Hoisting explicitly for Kalvium requirements.
 */
exports.runHoistingDemo = () => {
    let results = [];
  
    // 1. Hoisting of 'var' variables
    try {
      // var is hoisted and initialized to undefined, so this doesn't throw a ReferenceError, but evaluates to undefined.
      results.push(`1. Before initialization, value of hoistedVar is: ${hoistedVar}`);
      var hoistedVar = "I am hoisted!";
      results.push(`2. After initialization, value of hoistedVar is: ${hoistedVar}`);
    } catch (err) {
      results.push(`Error: ${err.message}`);
    }
  
    // 2. Hoisting of Function Declarations
    try {
      // Function declarations are completely hoisted (both definition and initialization)
      results.push(`3. Calling hoistedFunction before its definition returns: ${hoistedFunction()}`);
      function hoistedFunction() {
        return "I am a hoisted function!";
      }
    } catch (err) {
      results.push(`Error: ${err.message}`);
    }
  
    // 3. Hoisting of 'let' / 'const' (Temporal Dead Zone)
    try {
      // let and const are hoisted but NOT initialized. Accessing them before initialization throws a ReferenceError.
      results.push(`4. Trying to access unhoistedLet before initialization...`);
      // The below line would normally crash the app, but we wrap in try-catch to prove the TDZ exists
      const temp = unhoistedLet; 
      let unhoistedLet = "I am a let variable";
    } catch (err) {
      results.push(`4. Caught expected ReferenceError for 'let': ${err.message} (Temporal Dead Zone demonstration)`);
    }
  
    return {
      message: "Hoisting concepts demonstrated successfully.",
      details: results
    };
  };
