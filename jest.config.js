// File: jest.config.js
export default {
    testEnvironment: 'node',
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/app/$1'
    },
    transform: {
      '^.+\\.jsx?$': 'babel-jest',
    },
    moduleFileExtensions: ['js', 'jsx', 'json', 'node']
  };