import React from 'react';
import { kebabCase } from 'lodash';
import LinkItem from '@theme/Footer/LinkItem';
import clsx from 'clsx';

function ColumnLinkItem({ item }) {
  return item.html ? (
    <li
      className="footer__item"
      // Developer provided the HTML, so assume it's safe.
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: item.html }}
    />
  ) : (
    <li key={item.href ?? item.to} className="footer__item">
      <LinkItem item={item} />
    </li>
  );
}

function Column({ column }) {
  return (
    <div className={clsx("col footer__col", `footer__col_${kebabCase(column.title)}`)}>
      <div className="footer__title">{column.title}</div>
      <ul className="footer__items clean-list">
        {column.items.map((item, i) => (
          <ColumnLinkItem key={i} item={item} />
        ))}
      </ul>
    </div>
  );
}

export default function FooterLinks({ links }) {
  return (
    <div className="row footer__links">
      {links.map((column, i) => (
        <Column key={i} column={column} />
      ))}
    </div>
  );
}
