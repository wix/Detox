import React from 'react';
import clsx from 'clsx';
import Card from './Card';
import cardList from '@site/showcase.json';
import styles from './Showcase.module.css';

function Showcase() {
  const cards = cardList.map((props) => <Card key={props.title} {...props} />);

  return (
    <section className={clsx('container', styles.container)}>
      <ul className={clsx('col', 'col--12', styles.list)}>{cards}</ul>
    </section>
  );
}

export default Showcase;
