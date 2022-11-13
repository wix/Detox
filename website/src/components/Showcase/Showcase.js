import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import Card from './Card';
import cardList from '@site/showcase.json';
import styles from './Showcase.module.css';
import _ from 'lodash';

function Showcase() {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    setCards(_makeShuffledCardList(cardList).map(_makeCard));
  }, []);

  return _makeCardsContainer(cards);
}

const _makeShuffledCardList = (cardList) => {
  const partition = _.partition(cardList, 'shouldStayOnTop');
  return partition[0].concat(_.shuffle(partition[1]));
}

const _makeCard = (props) => <Card key={props.title} {...props} />;

const _makeCardsContainer = (cards) =>
  (
    <section className={clsx('container', styles.container)}>
      <ul className={clsx('col', 'col--12', styles.list)}>{cards}</ul>
    </section>
  );

export default Showcase;
