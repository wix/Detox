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
  const alwaysOnTop = cardList.filter(card => card.shouldStayOnTop);
  const shuffled = cardList.filter(card => !card.shouldStayOnTop).sort(() => Math.random() - 0.5);
  return alwaysOnTop.concat(shuffled);
}

const _makeCard = (props) => <Card key={props.title} {...props} />;

const _makeCardsContainer = (cards) =>
  (
    <section className={clsx('container', styles.container)}>
      <ul className={clsx('col', 'col--12', styles.list)}>{cards}</ul>
    </section>
  );

export default Showcase;
