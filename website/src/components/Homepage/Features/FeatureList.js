import React from 'react';

const FeatureList = [
  {
    title: 'Cross Platform',
    Svg: require('@site/static/img/homepage/cross-platform-light.svg').default, // taken from: https://uxwing.com/magic-icon/
    image: require('@site/static/img/homepage/cross-platform-light.png').default, // taken from: https://uxwing.com/magic-icon/
    description: <>Write cross-platform end-to-end tests in JavaScript. Currently supports iOS and Android.</>
  },
  {
    title: 'Debuggable',
    Svg: require('@site/static/img/homepage/debug-light.svg').default, // taken from: https://uxwing.com/bug-icon/
    image: require('@site/static/img/homepage/debug-light.png').default, // taken from: https://uxwing.com/bug-icon/
    description: <>Modern async-await API allows breakpoints in asynchronous tests to work as expected.</>
  },
  {
    title: 'Automatically Synchronized',
    Svg: require('@site/static/img/homepage/sync-light.svg').default, // taken from: https://uxwing.com/wait-sandclock-icon/
    image: require('@site/static/img/homepage/sync-light.png').default, // taken from: https://uxwing.com/wait-sandclock-icon/
    description: <>Stops flakiness at the core by monitoring asynchronous operations in your app.</>
  },
  {
    title: 'Made For CI',
    Svg: require('@site/static/img/homepage/ci-light.svg').default, // taken from: https://iconarchive.com/show/flatastic-9-icons-by-custom-icon-design/Semi-success-icon.html
    image: require('@site/static/img/homepage/ci-light.png').default, // taken from: https://iconarchive.com/show/flatastic-9-icons-by-custom-icon-design/Semi-success-icon.html
    description: <>Execute your E2E tests on CI platforms like Travis CI, CircleCI or Jenkins without grief.</>
  },
  {
    title: 'Runs on Devices',
    Svg: require('@site/static/img/homepage/devices-light.svg').default, // taken from: https://uxwing.com/mobile-phone-icon/
    image: require('@site/static/img/homepage/devices-light.png').default, // taken from: https://uxwing.com/mobile-phone-icon/
    description: <>Gain confidence to ship by testing your app on a device/simulator just like a real user (not yet supported on iOS).</>
  },
  {
    title: 'Test Runner Agnostic',
    Svg: require('@site/static/img/homepage/test-runner-light.svg').default, // taken from: https://uxwing.com/testing-icon/
    image: require('@site/static/img/homepage/test-runner-light.png').default, // taken from: https://uxwing.com/testing-icon/
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
