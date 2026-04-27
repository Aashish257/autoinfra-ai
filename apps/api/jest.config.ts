export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.ts'],
    setupFilesAfterFramework: ['./src/__tests__/setup.ts'],
};