declare var describe: (test: string, callback: () => void) => void;
declare var beforeAll: (callback: () => void) => void;
declare var afterAll: (callback: () => void) => void;
declare var test: (name: string, callback: () => void) => void;

import { by, device, element, expect, waitFor, log, trace, traceCall } from 'detox';

describe('Test', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
    await device.launchApp({
      newInstance: false,
      permissions: {
        location: 'always',
        notifications: 'YES',
        calendar: 'NO',
        camera: 'YES',
        contacts: 'NO',
        health: 'YES',
        homekit: 'NO',
        medialibrary: 'YES',
        microphone: 'NO',
        motion: 'YES',
        photos: 'NO',
        reminders: 'YES',
        siri: 'NO',
        speech: 'YES',
        faceid: 'NO',
        userTracking: 'YES',
      },
      url: 'detoxtesturlscheme://such-string',
      userNotification: {},
      userActivity: {},
      delete: false,
      launchArgs: {
        someArg: 42,
      },
      languageAndLocale: {
        language: 'en',
        locale: 'en-CA',
      },
    });

    await device.relaunchApp();
    await device.relaunchApp({
      launchArgs: {
        someArg: 42,
      },
    });
  });

  afterAll(async () => {
    await element(by.id('element')).clearText();
  });

  test('Test', async () => {
    await element(by.id('element')).replaceText('text');
    await element(by.id('element')).tap();
    await element(by.id('element')).scroll(50, 'down');
    await element(by.id('element')).scroll(50, 'down', 0.5, 0.5);
    await element(by.id('scrollView')).scrollTo('bottom');
    await expect(element(by.id('element')).atIndex(0)).toNotExist();
    await element(by.id('scrollView')).swipe('down', 'fast', 0.2, 0.5, 0.5);
    await element(by.type('UIPickerView')).setColumnToValue(1, '6');

    await expect(element(by.id('element').withAncestor(by.id('parent_element')))).toNotExist();
    await expect(element(by.id('element').withDescendant(by.id('child_element')))).toNotExist();

    await waitFor(element(by.id('element')))
      .toBeVisible()
      .withTimeout(2000);
    await device.pressBack();
    await waitFor(element(by.text('Text5')))
      .toBeVisible()
      .whileElement(by.id('ScrollView630'))
      .scroll(50, 'down');

    await expect(element(by.id('element'))).not.toBeVisible();
    await expect(element(by.id('element'))).not.toExist();
  });

  test('Trace', async () => {
    trace.startSection('Long method');
    trace.endSection('Long method');

    await traceCall('Another long method', async () => {
      // do something
    });

    switch (log.level) {
      case 'fatal':
      case 'error':
      case 'warn':
      case 'info':
      case 'debug':
      case 'trace':
        break;
    }

    log.trace('msg');
    log.trace({ event: 'EVENT' }, 'msg');

    log.trace.begin('Outer section');
    log.debug.begin({ arg: 'value' }, 'Inner section');

    log.info.complete('Sync section', () => 'sync').toUpperCase();
    log.warn.complete('Async section', async () => 42).then(() => 84);
    log.error.complete('Promise section', Promise.resolve(42)).finally(() => {});
    log.fatal.complete('Value section', 42).toFixed(1);

    log.warn.end({ extra: 'data' });
    log.info.end();

    log.debug('msg');
    log.debug({ event: 'EVENT' }, 'msg');
    log.info('msg');
    log.info({ event: 'EVENT' }, 'msg');
    log.warn('msg');
    log.warn({ event: 'EVENT' }, 'msg');
    log.error('msg');
    log.error({ event: 'EVENT' }, 'msg');
    log.fatal('msg');
    log.fatal({ event: 'EVENT' }, 'msg');

    log.child().info('msg');
    log.child({ anything: 'value' }).trace('msg');

    const serverLogger = log.child({ cat: 'server', id: 4333 });
    serverLogger.info.begin({}, 'Starting server...');
    await serverLogger.trace.complete('something', async () => {
      // ... do something ...
    });

    serverLogger.trace.end();
  })
});
