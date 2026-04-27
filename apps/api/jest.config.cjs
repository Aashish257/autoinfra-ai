const { pathsToModuleNameMapper } = require('ts-jest');
const fs = require('fs');

// Safely parse tsconfig.json by stripping comments
const tsconfigContent = fs.readFileSync('./tsconfig.json', 'utf8');
const cleanConfig = tsconfigContent.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
const { compilerOptions } = JSON.parse(cleanConfig);

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    // Automatically pull aliases from tsconfig.json
    ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
    // Handle the .js extension for relative imports
    '^(\\.\\.?/.*)\\.js$': '$1',
    // Specifically handle the @generated alias with .js extension
    '^@generated/(.*)\\.js$': '<rootDir>/src/generated/$1',
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
  resolver: require.resolve('./jest.resolver.cjs'),
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  forceExit: true,
  detectOpenHandles: true,
};
