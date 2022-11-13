import React from 'react';
import clsx from 'clsx';
import Card from './Card';
import cardList from '@site/showcase.json';
import styles from './Showcase.module.css';

function Showcase() {
  const cards = _makeShuffledCardList().map(_makeCard)
  return _makeCardsContainer(cards);
}

const _makeShuffledCardList = () => {
  return cardList.sort(() => 0.5 - Math.random());
}

const _makeCard = (props) => {
  return <Card key={props.title} {...props} />;
}

const _makeCardsContainer = (cards) => {
  return (
    <section className={clsx('container', styles.container)}>
      <ul className={clsx('col', 'col--12', styles.list)}>{cards}</ul>
    </section>
  );
}

export default Showcase;
