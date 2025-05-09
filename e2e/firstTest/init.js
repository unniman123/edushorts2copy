const detox = require('detox');
const adapter = require('detox/runners/jest/adapter');
const config = require('../../.detoxrc.json');

// Set the default timeout for all tests
jest.setTimeout(120000);
jasmine.getEnv().addReporter(adapter);

// The adapter sets the real context object as a global variable,
// we need to remove it after initialization
beforeAll(async () => {
  await detox.init(config);
  await device.launchApp();
});

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
}); 