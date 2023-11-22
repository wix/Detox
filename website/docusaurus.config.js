// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Detox',
  tagline: 'Gray box end-to-end testing and automation framework for React Native apps',
  url: 'https://wix.github.io',
  baseUrl: '/Detox/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: '/img/favicon.ico',
  organizationName: 'wix',
  projectName: 'Detox',
  plugins: ['docusaurus-plugin-sass'],

  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        blog: {
          path: 'blog',
          // Simple use-case: string editUrl
          // editUrl: 'https://github.com/facebook/docusaurus/edit/main/website/',
          // Advanced use-case: functional editUrl
          editUrl: ({ locale, blogDirPath, blogPath, permalink }) =>
            `https://github.com/wix/Detox/edit/master/website/${blogDirPath}/${blogPath}`,
          editLocalizedFiles: false,
          authorsMapPath: 'authors.yml',
          blogTitle: 'Blog',
          blogDescription:
            "All the important updates and announcements from Detox crew, tips and tricks and everything else that you don't want to miss.",
          blogSidebarCount: 5,
          blogSidebarTitle: 'All our posts',
          routeBasePath: 'blog',
          include: ['**/*.{md,mdx}'],
          exclude: ['**/_*.*', '**/_*/**'],
          postsPerPage: 10,
          truncateMarker: /<!--\s*(truncate)\s*-->/,
          showReadingTime: true
        },
        docs: {
          path: '../docs',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/wix/Detox/edit/master/docs/',
          docLayoutComponent: '@site/src/components/CustomLayout',
          remarkPlugins: [[require('@docusaurus/remark-plugin-npm2yarn'), { sync: true }]]
        },
        pages: {
          remarkPlugins: [[require('@docusaurus/remark-plugin-npm2yarn'), { sync: true }]]
        },
        theme: {
          customCss: require.resolve('./src/css/custom.scss')
        }
      })
    ]
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Detox',
        logo: {
          alt: 'Detox Logo',
          src: '/img/logo.png'
        },
        items: [
          {
            type: 'doc',
            docId: 'introduction/getting-started',
            position: 'left',
            label: 'Docs'
          },
          {
            type: 'doc',
            docId: 'config/overview',
            position: 'left',
            label: 'API'
          },
          {
            type: 'doc',
            docId: 'contributing',
            position: 'left',
            label: 'Contribute'
          },
          {
            to: 'blog',
            label: 'Blog',
            position: 'left'
          },
          {
            to: 'showcase',
            label: 'Showcase',
            position: 'left',
            className: 'header-showcase-link'
          },
          {
            type: 'docsVersionDropdown',
            position: 'right',
            dropdownActiveClassDisabled: true
          },
          {
            href: 'https://github.com/wix/Detox',
            position: 'right',
            className: 'header-github-link',
            'aria-label': 'GitHub repository'
          }
        ]
      },
      algolia: {
        appId: 'KTM5GBP42S',
        apiKey: 'd01d9c1bae30c64fa2b9bfbdad9adbfd',
        indexName: 'detox'
      },
      footer: {
        style: 'light',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Getting Started',
                to: 'docs/introduction/getting-started'
              },
              {
                label: 'Contributing to Detox',
                to: 'docs/contributing'
              }
            ]
          },
          {
            title: 'Support',
            items: [
              {
                label: 'Ask a question on Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/detox'
              },
              {
                label: 'Create new issue on Github',
                href: 'https://github.com/wix/Detox/issues/new/choose'
              }
            ]
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/wix/Detox'
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/detoxe2e/'
              },
              {
                label: 'Discord',
                href: 'https://discord.gg/CkD5QKheF5'
              }
            ]
          }
        ]
      },
      docs: {
        sidebar: {
          autoCollapseCategories: true
        }
      },
      prism: {
        additionalLanguages: ['gradle', 'ini', 'java'],
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme
      },
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: false
      }
    }),
  scripts: [
    {
      src: 'https://platform.twitter.com/widgets.js',
      async: true
    }
  ]
};

module.exports = config;
