import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './HomepageHeader.module.css';

const HomepageHeader = () => {
  const { siteConfig } = useDocusaurusContext();

  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <div className="row">
          <div className="col">
            <h1 className={styles.heroBanner.h1}>{siteConfig.title}</h1>
            <h2 className={styles.heroBanner.h2}>{siteConfig.tagline}</h2>
            <div className={styles.buttons}>
              <Link className="button button--secondary button--lg" href="/docs/introduction/getting-started" target="_blank">
                Getting Started <strong>with Detox</strong>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HomepageHeader;
