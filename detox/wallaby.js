/*eslint-disable*/
'use strict';

module.exports = function(wallaby) {
  return {
    env: {
      type: 'node',
      runner: 'node'
    },

    testFramework: 'jest',

    files: [
      'package.json',
      'src/**/*.js',
      'src/**/*.mock.*',
      '!src/**/*.test.js',
    ],

    tests: [
      'src/**/*.test.js',
    ]
  };
};
