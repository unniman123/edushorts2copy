const chalk = require('chalk');

class PerformanceReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunComplete(contexts, results) {
    console.log(chalk.bold('\nPerformance Test Results:'));
    console.log(chalk.bold('========================\n'));
    
    // Debug log to see what metrics were collected
    console.log('Raw metrics data:', JSON.stringify(global.__PERFORMANCE_METRICS__, null, 2));

    if (!global.__PERFORMANCE_METRICS__ || !global.__PERFORMANCE_METRICS__.tests || Object.keys(global.__PERFORMANCE_METRICS__.tests).length === 0) {
      console.log(chalk.yellow('\nNo performance metrics collected or metrics object is empty.'));
      return;
    }

    const metrics = global.__PERFORMANCE_METRICS__.tests;
    Object.entries(metrics).forEach(([testName, data]) => {
      console.log(chalk.cyan(`Test: ${testName}`));
      
      // Timing metrics
      if (Object.keys(data.timing).length > 0) {
        console.log(chalk.green('  Timing:'));
        Object.entries(data.timing).forEach(([key, value]) => {
          console.log(`    ${key}: ${value}ms`);
        });
      }

      // Memory metrics
      if (Object.keys(data.memory).length > 0) {
        console.log(chalk.green('  Memory:'));
        Object.entries(data.memory).forEach(([key, value]) => {
          console.log(`    ${key}: ${formatBytes(value)}`);
        });
      }

      // Render count
      if (data.renders) {
        console.log(chalk.green(`  Render count: ${data.renders}`));
      }

      console.log(''); // Empty line between tests
    });

    // Print performance summary
    this._printSummary(metrics);
  }

  _getTimingColor(operation, time) {
    const thresholds = {
      'initial render': { warn: 200, error: 300 },
      'image load': { warn: 400, error: 500 },
      'scroll': { warn: 12, error: 16 },
      default: { warn: 100, error: 200 }
    };

    const { warn, error } = thresholds[operation] || thresholds.default;

    if (time > error) return chalk.red;
    if (time > warn) return chalk.yellow;
    return chalk.green;
  }

  _getMemoryColor(mb) {
    if (mb > 50) return chalk.red;
    if (mb > 20) return chalk.yellow;
    return chalk.green;
  }

  _getRenderColor(count) {
    if (count > 100) return chalk.red;
    if (count > 50) return chalk.yellow;
    return chalk.green;
  }

  _printSummary(metrics) {
    console.log('\n' + chalk.bold.underline('Performance Summary:'));

    // Calculate averages
    const averages = {
      timing: {},
      memory: 0,
      renders: 0
    };

    let testCount = 0;

    Object.values(metrics).forEach(data => {
      // Sum up timing averages
      Object.entries(data.timing).forEach(([op, time]) => {
        averages.timing[op] = (averages.timing[op] || 0) + time;
      });

      // Sum up memory usage
      const totalMemory = Object.values(data.memory).reduce((sum, val) => sum + val, 0);
      averages.memory += totalMemory / (1024 * 1024); // Convert to MB

      // Sum up render counts
      averages.renders += data.renders || 0;

      testCount++;
    });

    // Print timing averages
    console.log(chalk.yellow('\nAverage Timings:'));
    Object.entries(averages.timing).forEach(([op, total]) => {
      const avg = total / testCount;
      const color = this._getTimingColor(op, avg);
      console.log(`  ${op}: ${color(avg.toFixed(2) + 'ms')}`);
    });

    // Print memory average
    const avgMemory = averages.memory / testCount;
    const memoryColor = this._getMemoryColor(avgMemory);
    console.log(chalk.yellow('\nAverage Memory Usage:'));
    console.log(`  ${memoryColor(avgMemory.toFixed(2) + ' MB')}`);

    // Print render average
    const avgRenders = averages.renders / testCount;
    const renderColor = this._getRenderColor(avgRenders);
    console.log(chalk.yellow('\nAverage Render Count:'));
    console.log(`  ${renderColor(Math.round(avgRenders))}`);

    // Print compliance status
    const isCompliant = this._checkCompliance(averages);
    console.log('\n' + chalk.bold('Google Play Store Compliance:'));
    console.log(isCompliant ? 
      chalk.green('✓ Performance metrics meet requirements') :
      chalk.red('✗ Performance improvements needed'));
  }

  _checkCompliance(averages) {
    // Check against Google Play Store requirements
    const requirements = {
      timing: {
        'initial render': 300,
        'image load': 500,
        'scroll': 16
      },
      memory: 50, // MB
      renders: 100
    };

    let compliant = true;

    // Check timings
    Object.entries(requirements.timing).forEach(([op, limit]) => {
      if ((averages.timing[op] || 0) > limit) {
        compliant = false;
      }
    });

    // Check memory
    if (averages.memory > requirements.memory) {
      compliant = false;
    }

    // Check renders
    if (averages.renders > requirements.renders) {
      compliant = false;
    }

    return compliant;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

module.exports = PerformanceReporter;
