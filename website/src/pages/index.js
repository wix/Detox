import React from 'react';
import Layout from '@theme/Layout';
import HomepageHeader from '@site/src/components/Homepage/Header/HomepageHeader';
import HomepageFeatures from '@site/src/components/Homepage/Features/HomepageFeatures';
import HomepageSubHeader from '@site/src/components/Homepage/SubHeader/HomepageSubHeader';
import ArchivedNotice from '@site/src/components/CustomBanner/ArchivedNotice';

const Home = () => {
  return (
    <>
      <ArchivedNotice />
      <Layout>
        <HomepageHeader />
        <HomepageSubHeader />
        <main>
          <HomepageFeatures />
        </main>
      </Layout>
    </>
  );
};

export default Home;
