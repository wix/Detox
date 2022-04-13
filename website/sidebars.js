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
        'getting-started',
        'ios-dev-env',
        'android-dev-env',
        'ios',
        'android',
        'writing-first-test',
        'how-detox-works',
        'design-principles',
        'workflows'
      ]
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'detox-cli',
        'configuration',
        'detox-object-api',
        'device-object-api',
        'test-lifecycle',
        'matchers',
        'actions-on-element',
        'expect',
        'launch-args',
        'mocking-open-with-url',
        'mocking-user-notifications',
        'mocking-user-activity',
        'artifacts',
        'screenshots'
      ]
    },
    {
      type: 'category',
      label: 'Troubleshooting',
      items: [
        'troubleshooting',
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
        'running-locally',
        'developing-while-writing-tests',
        'running-on-ci',
        'debugging-in-xcode',
        'debugging-in-android-studio',
        'mocking',
        'migration',
        'jest',
        'parallel-test-execution',
        'third-party-drivers',
        'expo',
        'uninstalling',
      ]
    },
    {
      type: 'doc',
      label: 'Contributing',
      id: 'contributing'
    },
  ],
};

module.exports = sidebars;
