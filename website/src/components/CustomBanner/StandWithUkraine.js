import React from 'react';
import styles from './StandWithUkraine.module.scss';
import Link from '@docusaurus/Link';

const StandWithUkraine = (props) => {
  return (
    <div className={styles.banner}>
      <Link to="https://stand-with-ukraine.pp.ua" className={styles.link}>
        <span className={styles.uaFlag}></span> This project is created with substantial contributions from our Ukrainian colleagues.{' '}
        <span className={styles.hashtag}>#StandWithUkraine</span>
      </Link>
    </div>
  );
};

export default StandWithUkraine;
