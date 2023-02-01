import clsx from 'clsx';
import React from 'react';
import Link from '@docusaurus/Link';
import styles from './Hero.module.css';

export default function ShowcaseHero() {
  return (
    <section className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">Users Showcase</h1>
        <p className="hero__subtitle">Check out who is using Detox to Gray box test their React Native Apps</p>

        <a href="https://forms.gle/C1BWzd8k5LhogDtM7" target="_blank" className={styles.button}>
          Join the Showcase!
        </a>
      </div>
    </section>
  );
}
