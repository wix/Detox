import React from 'react';
import { kebabCase } from 'lodash';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import isInternalUrl from '@docusaurus/isInternalUrl';
import clsx from 'clsx';

export default function FooterLinkItem({ item }) {
  const { to, href, label, prependBaseUrlToHref, ...props } = item;
  const toUrl = useBaseUrl(to);
  const normalizedHref = useBaseUrl(href, { forcePrependBaseUrl: true });
  return (
    <Link
      {...(href
        ? {
            href: prependBaseUrlToHref ? normalizedHref : href
          }
        : {
            to: toUrl
          })}
      {...props}
      className={clsx('footer__link-item', !!href && `footer__link-item_${kebabCase(item.label)}`)}>
      {label}
      {href && !isInternalUrl(href)}
    </Link>
  );
}
