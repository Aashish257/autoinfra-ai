const path = require('path');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    // Map .js imports to the local directory
    '^(\\.\\.?/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json',
        diagnostics: false,
      },
    ],
  },
  // Use a custom resolver to handle the ESM .js -> .ts mapping reliably
  resolver: path.resolve(__dirname, 'jest.resolver.cjs'),
  setupFilesAfterFramework: ['<rootDir>/src/__tests__/setup.ts'],
  forceExit: true,
  detectOpenHandles: true,
};
