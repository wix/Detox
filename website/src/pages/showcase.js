import React from 'react';
import Head from '@docusaurus/Head';
import Layout from '@theme/Layout';
import ArchivedNotice from '@site/src/components/CustomBanner/ArchivedNotice';
import * as Showcase from '@site/src/components/Showcase';

export default function ShowcasePage() {
  return (
    <>
      <Head>
        <title>Showcase | Detox</title>
      </Head>
      <ArchivedNotice />
      <Layout>
        <main>
          <Showcase.Hero />
          <Showcase.List />
        </main>
      </Layout>
    </>
  );
}
