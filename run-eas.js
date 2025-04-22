// run-eas.js
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    moduleResolution: 'node'
  }
});

// Redirect to EAS CLI
require('child_process').spawn(
  process.execPath,
  [require.resolve('eas-cli/bin/run'), ...process.argv.slice(2)],
  { stdio: 'inherit', env: { ...process.env, NODE_OPTIONS: '' } }
).on('exit', process.exit);
