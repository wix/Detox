import React from 'react';
import styles from './HomepageSubHeader.module.scss';

const HomepageSubHeader = () => {
  return (
    <div className={styles.subHeader}>
      <div className="container">
        <div className={`row ${styles.row}`}>
          <div className={`col col--4 ${styles.col4Wrapper}`}>
            <div className={styles.subTextWrapper}>
              <span>
                Follow us on <strong>social networks:</strong>
              </span>
            </div>
          </div>
          <div className={`col col--8 flex-jc-fe ${styles.col8Wrapper}`}>
            <div className={styles.flexFrame}>
              <a className={styles.discordButton} href="https://discord.gg/CkD5QKheF5" target="_blank"></a>
            </div>
            <div className={styles.flexFrame}>
              <a className={styles.twitterButton} href="https://x.com/detoxe2e?s=20" target="_blank"></a>
              <span className={styles.arrow}></span>
              <a className={styles.twitterCounter} href="https://x.com/detoxe2e?s=20" target="_blank">
                <span>486</span>
                <span>&nbsp;followers</span>
              </a>
            </div>
            <div className={styles.flexFrame}>
              <a className={styles.githubButton} href="https://github.com/wix/detox" target="_blank"></a>
              <span className={styles.arrow}></span>
              <a className={styles.githubCounter} href="https://github.com/wix/detox/stargazers" target="_blank">
                <span>10,598</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomepageSubHeader;
