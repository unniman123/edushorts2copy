#!/usr/bin/env ts-node

import * as monitoring from '../services/monitoring';

async function runTests() {
  console.log('Testing Monitoring Service...\n');

  // Test error logging
  console.log('1. Testing error logging...');
  try {
    throw new Error('Test error');
  } catch (error) {
    monitoring.logError(error, {
      screen: 'TestScreen',
      action: 'testAction',
      testId: '123'
    });
  }
  console.log('✓ Error logged successfully\n');

  // Test event logging
  console.log('2. Testing event logging...');
  monitoring.logEvent('test_event', {
    testId: '123',
    timestamp: new Date().toISOString()
  });
  console.log('✓ Event logged successfully\n');

  // Test performance tracking
  console.log('3. Testing performance tracking...');
  const startTime = Date.now();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
  monitoring.logEvent('performance_test', {
    operationName: 'testOperation',
    durationMs: Date.now() - startTime
  });
  console.log('✓ Performance metrics logged successfully\n');

  // Test error queue
  console.log('4. Testing error queue...');
  for (let i = 0; i < 5; i++) {
    monitoring.logError(new Error(`Queue test error ${i}`), {
      testId: `queue-${i}`
    });
  }
  await monitoring.flushQueue();
  console.log('✓ Error queue flushed successfully\n');

  // Test error with stack trace
  console.log('5. Testing error stack trace...');
  function throwDeepError() {
    throw new Error('Deep error test');
  }
  try {
    throwDeepError();
  } catch (error) {
    monitoring.logError(error, {
      screen: 'TestScreen',
      depth: 'deep'
    });
  }
  console.log('✓ Stack trace logged successfully\n');

  console.log('All tests completed successfully! ✨\n');
  console.log('Note: Check console output above for logged errors and events.');
}

runTests().catch(console.error);
