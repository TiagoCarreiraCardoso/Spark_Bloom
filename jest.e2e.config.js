const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  testEnvironment: 'node',
  testMatch: ['**/tests/e2e/**/*.test.ts'],
}

module.exports = createJestConfig(customJestConfig)
