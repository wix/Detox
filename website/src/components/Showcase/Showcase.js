import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import Card from './Card';
import cardList from '@site/showcase.json';
import styles from './Showcase.module.css';
import _ from 'lodash';
import { TailSpin } from 'react-loader-spinner';

const Showcase = () => {
  const [cards, setCards] = useState([]);
  const [toRender, setToRender] = useState([<TailSpin />]);

  useEffect(() => {
    setCards(_makeShuffledCardList(cardList).map(_makeCard));
  }, []);

  useEffect(() => {
    setToRender(cards.length > 0 ? _makeCardsContainer(cards) : _makeLoadingSpinner());
  }, [cards]);

  return toRender;
};

const _makeShuffledCardList = (cardList) => {
  const partition = _.partition(cardList, 'shouldStayOnTop');
  const shouldShuffle = new URLSearchParams(window.location.search).get('shuffle');
  const toConcat = shouldShuffle !== 'disabled' ? _.shuffle(partition[1]) : partition[1];
  return partition[0].concat(toConcat);
};

const _makeCard = (props) => <Card key={props.title} {...props} />;

const _makeCardsContainer = (cards) => (
  <section className={clsx('container', styles.container)}>
    <ul className={clsx('col', 'col--12', styles.list)}>{cards}</ul>
  </section>
);

const _makeLoadingSpinner = () => (
  <TailSpin height="60" width="60" color="#dddddd" ariaLabel="loading" radius="2" wrapperClass={styles.spinner} visible={true} />
);

export default Showcase;
