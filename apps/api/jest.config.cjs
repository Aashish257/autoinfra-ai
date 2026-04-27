const path = require('path');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    // Handle ESM imports with .js extensions
    '^(\\.\\.?/.*)\\.js$': '$1',
    // Explicitly handle Prisma generated client
    '^../generated/prisma/client\\.js$': path.resolve(__dirname, './src/generated/prisma/client.ts'),
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  setupFilesAfterFramework: ['<rootDir>/src/__tests__/setup.ts'],
  // Add this to prevent the "torn down" error by ensuring Jest waits for all handles
  forceExit: true,
  detectOpenHandles: true,
};
