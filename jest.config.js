// File: jest.config.js
module.exports = {
    testEnvironment: 'node',
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/app/$1'
    },
    transform: {
      '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
    },
    moduleFileExtensions: ['js', 'jsx', 'json', 'node']
  };