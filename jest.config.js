module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  moduleNameMapper: {
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFiles: [
    // Add any setup files here
    '<rootDir>/jest.setup.js',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/build/'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
