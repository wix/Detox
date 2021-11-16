import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

const FeatureList = [
  {
    title: 'Supports Different Test Runners',
    Svg: require('../../static/img/test-runner.svg').default, // taken from: https://uxwing.com/testing-icon/
    description: (
      <>
        Use Jest or Mocha as the test runner (spoiler: we have our favorite).
      </>
    ),
  },
  {
    title: 'Cross Platform',
    Svg: require('../../static/img/cross-platform.svg').default, // taken from: https://uxwing.com/magic-icon/
    description: (
      <>
        Write cross-platform end-to-end tests in JavaScript.
        Currently supports iOS and Android.
      </>
    ),
  },
  {
    title: 'Debuggable',
    Svg: require('../../static/img/debug.svg').default, // taken from: https://uxwing.com/bug-icon/
    description: (
      <>
        Modern async-await API allows breakpoints in asynchronous tests to work as expected.
      </>
    ),
  },
  {
    title: 'Automatically Synchronized',
    Svg: require('../../static/img/sync.svg').default, // taken from: https://uxwing.com/wait-sandclock-icon/
    description: (
      <>
        Stops flakiness at the core by monitoring asynchronous operations in your app.
      </>
    ),
  },
  {
    title: 'Made For CI',
    Svg: require('../../static/img/ci.svg').default, // taken from: https://iconarchive.com/show/flatastic-9-icons-by-custom-icon-design/Semi-success-icon.html
    description: (
      <>
        Execute your E2E tests on CI platforms like Travis CI, CircleCI or Jenkins without grief.
      </>
    ),
  },
  {
    title: 'Runs on Devices',
    Svg: require('../../static/img/devices.svg').default, // taken from: https://uxwing.com/mobile-phone-icon/
    description: (
      <>
        Gain confidence to ship by testing your app on a device/simulator just like a real user (not yet supported on iOS).
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureImage} alt={title} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
