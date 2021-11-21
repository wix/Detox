// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Detox',
  tagline: 'Gray box end-to-end testing and automation framework for mobile apps',
  url: 'https://wix.github.io',
  baseUrl: '/Detox/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: '/img/favicon.ico',
  organizationName: 'wix',
  projectName: 'Detox',

  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: '../docs',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/wix/Detox/edit/master/docs/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Detox',
        logo: {
          alt: 'Detox Logo',
          src: '/img/logo.png',
        },
        items: [
          {
            type: 'doc',
            docId: 'getting-started',
            position: 'left',
            label: 'Documentation',
          },
          {
            href: 'https://github.com/wix/Detox',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      algolia: {
        appId: 'BH4D9OD16A',
        apiKey: 'f621c2d74268df173153c887526aebb3',
        indexName: 'detox',
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Getting Started',
                to: 'docs/introduction/getting-started',
              },
              {
                label: 'Contributing to Detox',
                to: 'docs/contributing',
              },
            ],
          },
          {
            title: 'Support',
            items: [
              {
                label: 'Ask a question on Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/detox',
              },
              {
                label: 'Create new issue on Github',
                href: 'https://github.com/wix/Detox/issues/new/choose',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/wix/Detox',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/detoxe2e/',
              },
            ],
          },
        ]
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
