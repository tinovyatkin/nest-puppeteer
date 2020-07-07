module.exports = {
  clearMocks: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  coverageReporters: ['text', 'json', 'lcovonly'],
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  moduleFileExtensions: ['ts', 'js'],
  coverageProvider: 'v8',
  testRunner: 'jest-circus/runner',
  rootDir: '.',
  testRegex: '.e2e-spec.ts$',
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.sonarlint/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/',
    '<rootDir>/.vscode/',
  ],
  reporters: [
    'default',
    [
      'jest-sonar',
      {
        outputDirectory: './reports',
        outputName: 'jest-reporter.xml',
      },
    ],
  ],
};
