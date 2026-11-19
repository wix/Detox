import React from 'react';
import styles from './ArchivedNotice.module.scss';
import Link from '@docusaurus/Link';

const ArchivedNotice = () => {
  return (
    <div className={styles.banner}>
      <span className={styles.text}>
        This project is archived and no longer maintained by Wix.{' '}
        <Link to="https://github.com/topics/detox-community-fork" className={styles.link}>
          Looking for community forks?
        </Link>
      </span>
    </div>
  );
};

export default ArchivedNotice;
