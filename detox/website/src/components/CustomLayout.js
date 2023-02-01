import React from 'react';
import DocPage from '@theme/DocPage';
import StandWithUkraine from '@site/src/components/CustomBanner/StandWithUkraine';

const CustomLayout = (props) => {
  return (
    <>
      <StandWithUkraine />
      <DocPage {...props} />
    </>
  );
};

export default CustomLayout;
