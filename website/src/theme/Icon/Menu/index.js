import React from 'react';
export default function IconMenu({ width = 19, height = 12, className, ...restProps }) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 19 12" fill="currentColor" aria-hidden="true" {...restProps}>
      <rect x="0.5" y="5.5" width="18" height="1" rx="0.5" stroke="currentColor" strokeLinecap="round" />
      <rect x="0.5" y="10.5" width="18" height="1" rx="0.5" stroke="currentColor" strokeLinecap="round" />
      <rect x="0.5" y="0.5" width="18" height="1" rx="0.5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}
