import React from 'react';
import Search from '@theme-original/Navbar/Search';
import styles from './styles.module.scss';

export default function SearchWrapper(props) {
  return (
    <>
      <Search className={styles.searchWrapper} {...props} />
    </>
  );
}
