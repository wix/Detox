import React from 'react';
import CodeBlock from '@theme/CodeBlock';

const FlavorizedCodeBlock = ({ flavors, children, header, footer, ...codeBlockProps }) => {
  return (
    <CodeBlock {...codeBlockProps}>
      {header}
      {flavors.map(children).join('\n')}
      {footer}
    </CodeBlock>
  );
};

export default FlavorizedCodeBlock;
