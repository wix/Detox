import React from 'react';
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
function Column({ column, className }) {
  return (
    <div className="col footer__col">
      <div className="footer__title">{column.title}</div>
      <ul className={clsx('footer__items clean-list', className)}>
        {column.items.map((item, i) => (
          <ColumnLinkItem key={i} item={item} />
        ))}
      </ul>
    </div>
  );
}
export default function FooterLinksMultiColumn({ columns }) {
  return (
    <div className="row footer__links">
      {columns.map((column, i) => (
        <Column key={i} column={column} className={column.title === 'More' ? 'socialNetLinks' : ''} />
      ))}
    </div>
  );
}
