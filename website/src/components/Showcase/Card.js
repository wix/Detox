import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import styles from './Card.module.css';

function Card({ className, title, titleFontSize, image, linkGoogle, linkApple, linkGitHub }) {
  return (
    <li className={clsx(className, styles.card)}>
      <img src={require(`@site/static/${image}`).default} className={styles.image} />
      <span className={styles.title} style={{ fontSize: titleFontSize }}>
        {title}
      </span>
      <div>
        {linkGoogle && (
          <Link className={styles.storeButton} href={linkGoogle}>
            Google Play
          </Link>
        )}
        {linkApple && (
          <Link className={styles.storeButton} href={linkApple}>
            App Store
          </Link>
        )}
        {linkGitHub && (
          <Link className={styles.storeButton} href={linkGitHub}>
            GitHub
          </Link>
        )}
      </div>
    </li>
  );
}

export default Card;
