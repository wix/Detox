import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

const FeatureList = [
  {
    title: 'Supports Different Test Runners',
    img: require('../../static/img/test-runner.png').default, // taken from: https://iconarchive.com/show/flatastic-9-icons-by-custom-icon-design/Accept-icon.html
    description: (
      <>
        Use Jest or Mocha as the test runner (spoiler: we have our favorite).
      </>
    ),
  },
  {
    title: 'Cross Platform',
    img: require('../../static/img/cross-platform.png').default, // taken from: https://iconarchive.com/show/flatastic-9-icons-by-custom-icon-design/Wizard-icon.html
    description: (
      <>
        Write cross-platform end-to-end tests in JavaScript.
        Currently supports iOS and Android.
      </>
    ),
  },
  {
    title: 'Debuggable',
    img: require('../../static/img/debug.png').default, // taken from: https://iconarchive.com/show/phuzion-icons-by-kyo-tux/Misc-Bug-icon.html
    description: (
      <>
        Modern async-await API allows breakpoints in asynchronous tests to work as expected.
      </>
    ),
  },
  {
    title: 'Automatically Synchronized',
    img: require('../../static/img/sync.png').default, // taken from: https://iconarchive.com/show/firefox-os-icons-by-vcferreira/clock-icon.html
    description: (
      <>
        Stops flakiness at the core by monitoring asynchronous operations in your app.
      </>
    ),
  },
  {
    title: 'Made For CI',
    img: require('../../static/img/ci.png').default, // taken from: https://iconarchive.com/show/flatastic-9-icons-by-custom-icon-design/Semi-success-icon.html
    description: (
      <>
        Execute your E2E tests on CI platforms like Travis CI, CircleCI or Jenkins without grief.
      </>
    ),
  },
  {
    title: 'Runs on Devices',
    img: require('../../static/img/devices.png').default, // taken from: https://iconarchive.com/show/flatastic-9-icons-by-custom-icon-design/Iphone-icon.html
    description: (
      <>
        Gain confidence to ship by testing your app on a device/simulator just like a real user (not yet supported on iOS).
      </>
    ),
  },
];

function Feature({img, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <img src={img} className={styles.featureImage} alt={title} />
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
