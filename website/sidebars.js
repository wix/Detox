/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Introduction',
      items: [
        'introduction/getting-started',
        'introduction/building-with-detox',
        'introduction/writing-first-test',
        'introduction/preparing-for-ci',
        'introduction/debugging'
      ]
    },
    {
      type: 'category',
      label: 'Configuration',
      items: [
        'config/overview',
        'config/devices',
        'config/apps',
        'config/artifacts',
        'config/behavior',
        'config/logger',
        'config/session',
        'config/testRunner',
      ]
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/detox-cli',
        'api/device',
        'api/matchers',
        'api/actions',
        'api/expect',
        'api/logger',
        'api/internals',
      ]
    },
    {
      type: 'category',
      label: 'Troubleshooting',
      items: [
        'building-the-app',
        'running-tests',
        'synchronization',
        'flakiness',
      ]
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'parallel-test-execution',
        'guide/genymotion-cloud',
        'guide/taking-screenshots',
        'mocking',
        'launch-args',
        'mocking-open-with-url',
        'mocking-user-notifications',
        'mocking-user-activity',
        'developing-while-writing-tests',
        'android-dev-env',
        'proguard-configuration',
        'uninstalling',
      ]
    },
    {
      type: 'category',
      label: 'Articles',
      items: [
        'articles/design-principles',
        'articles/how-detox-works',
        'articles/third-party-drivers',
      ]
    },
    {
      type: 'doc',
      id: 'migration',
    },
    {
      type: 'doc',
      label: 'Contributing',
      id: 'contributing'
    },
  ],
};

module.exports = sidebars;
