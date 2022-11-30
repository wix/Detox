import React from 'react';

const FeatureList = [
  {
    title: 'Cross Platform',
    Svg: require('@site/static/img/homepage/cross-platform.svg').default, // taken from: https://uxwing.com/magic-icon/
    description: <>Write cross-platform end-to-end tests in JavaScript. Currently supports iOS and Android.</>
  },
  {
    title: 'Debuggable',
    Svg: require('@site/static/img/homepage/debug.svg').default, // taken from: https://uxwing.com/bug-icon/
    description: <>Modern async-await API allows breakpoints in asynchronous tests to work as expected.</>
  },
  {
    title: 'Automatically Synchronized',
    Svg: require('@site/static/img/homepage/sync.svg').default, // taken from: https://uxwing.com/wait-sandclock-icon/
    description: <>Stops flakiness at the core by monitoring asynchronous operations in your app.</>
  },
  {
    title: 'Made For CI',
    Svg: require('@site/static/img/homepage/ci.svg').default, // taken from: https://iconarchive.com/show/flatastic-9-icons-by-custom-icon-design/Semi-success-icon.html
    description: <>Execute your E2E tests on CI platforms like Travis CI, CircleCI or Jenkins without grief.</>
  },
  {
    title: 'Runs on Devices',
    Svg: require('@site/static/img/homepage/devices.svg').default, // taken from: https://uxwing.com/mobile-phone-icon/
    description: <>Gain confidence to ship by testing your app on a device/simulator just like a real user (not yet supported on iOS).</>
  },
  {
    title: 'Test Runner Agnostic',
    Svg: require('@site/static/img/homepage/test-runner.svg').default, // taken from: https://uxwing.com/testing-icon/
    description: (
      <>
        Detox provides a set of APIs to use with any test runner or without it. It comes with{' '}
        <a href="https://jestjs.io" target="_blank" rel="noopener noreferrer">
          Jest
        </a>{' '}
        integration out of the box.
      </>
    )
  }
];

export default FeatureList;
