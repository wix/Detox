import React from 'react';
import styles from './Features.module.scss';
import clsx from 'clsx';

const Features = ({ Svg, title, description }) => {
  return (
    <div className={clsx('col col--4', styles.featuresGap)}>
      <Svg className={styles.featureImage} alt={title} />
      <div>
        <h3 className={styles.featureTitle}>{title}</h3>
        <p className={styles.featureText}>{description}</p>
      </div>
    </div>
  );
};

export default Features;
