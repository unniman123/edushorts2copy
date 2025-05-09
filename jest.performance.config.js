module.exports = {
  preset: 'react-native',
  setupFiles: [
    './jest.performance.setup.js'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-safe-area-context|@react-navigation|@react-native-community|@expo|expo|@unimodules|unimodules|sentry-expo|native-base|react-native-svg)/)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironment: 'jsdom',
  reporters: ['default', './performance-reporter.js'],
  globals: {
    __PERFORMANCE_METRICS__: {
      tests: {},
      currentTest: null
    }
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^../../App$': '<rootDir>/__tests__/mocks/App.tsx'
  },
  testTimeout: 10000,
  verbose: true,
  rootDir: '.'
};
