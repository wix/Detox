import React from 'react';
import styles from './HomepageSubHeader.module.scss';

const HomepageSubHeader = () => {
  return (
    <div className={styles.subHeader}>
      <div className={styles.callToAction}>
        <span>
          Follow us on <strong>social networks:</strong>
        </span>
      </div>
      <div className={styles.socialNetworks}>
        <a className={styles.discordButton} href="https://discord.gg/CkD5QKheF5" target="_blank"></a>
        <a className={styles.twitterButton} href="https://x.com/detoxe2e?s=20" target="_blank">
          <span className={styles.twitterLogo}></span>
          <span className={styles.twitterFollowText}>Follow </span>
          <span className={styles.twitterFollowId}>@detoxe2e</span>
        </a>
        <a className={styles.twitterCounter} href="https://x.com/detoxe2e?s=20" target="_blank">
          <span>486</span>
          <span>&nbsp;followers</span>
        </a>
        <a className={styles.githubButton} href="https://github.com/wix/detox" target="_blank"></a>
        <a className={styles.githubCounter} href="https://github.com/wix/detox/stargazers" target="_blank">
          <span>10,598</span>
        </a>
      </div>
    </div>
  );
};

export default HomepageSubHeader;
