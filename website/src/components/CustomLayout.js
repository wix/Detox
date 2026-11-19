import React from 'react';
import DocPage from '@theme/DocPage';
import ArchivedNotice from '@site/src/components/CustomBanner/ArchivedNotice';

const CustomLayout = (props) => {
  return (
    <>
      <ArchivedNotice />
      <DocPage {...props} />
    </>
  );
};

export default CustomLayout;
