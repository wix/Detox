/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* List of projects/orgs using your project for the users page */
const users = [
  {
    caption: 'Wix',
    image: 'http://d26gg7w375vuv5.cloudfront.net/Design+Assets/White+Wix+Logo+Assets/White+Wix+logo+Assets.jpg',
    infoLink: 'https://wix.com',
    pinned: true,
  },
];

const siteConfig = {
  title: 'Detox' /* title for your website */,
  tagline: 'Gray Box E2E Tests and Automation Library for Mobile Apps',
  url: 'https://wix.github.io' /* your website url */,
  baseUrl: '/detox/' /* base url for your project */,
  projectName: 'detox',
  headerLinks: [
    { doc: 'Introduction.GettingStarted', label: 'Getting Started' },
    { href: 'https://github.com/wix/detox', label: 'GitHub' },
  ],
  users,
  /* path to images for header/footer */
  headerIcon: '',
  footerIcon: '',
  favicon: 'img/favicon.png',
  /* colors for website */
  colors: {
    primaryColor: '#2E8555',
    secondaryColor: '#205C3B',
  },
  // This copyright info is used in /core/Footer.js and blog rss/atom feeds.
  copyright:
    'Copyright © ' +
    new Date().getFullYear() +
    ' Wix.com',
  organizationName: 'wix', // or set an env variable ORGANIZATION_NAME
  projectName: 'detox', // or set an env variable PROJECT_NAME
  highlight: {
    // Highlight.js theme to use for syntax highlighting in code blocks
    theme: 'default',
  },
  scripts: ['https://buttons.github.io/buttons.js'],
  // You may provide arbitrary config keys to be used as needed by your template.
  repoUrl: 'https://github.com/wix/detox',
};

module.exports = siteConfig;
