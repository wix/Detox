const format = require('./SyncStatusFormatter').formatJSONStatus;

describe('Sync Status Formatter', () => {
  describe('assertions', () => {
    test('should throw error when `app_status` is missing', async () => {
      let invalidStatus = {
        busy_resource: []
      };

      await expect(() => { format(invalidStatus); }).toThrowError(`Given sync status is not compatible with ` +
        `the status schema, given status: ${JSON.stringify(invalidStatus)}`);
    });

    test('should throw error when `app_status` is invalid', async () => {
      let invalidStatus = {
        app_status: 'foo'
      };

      await expect(() => { format(invalidStatus); }).toThrowError(`Given sync status is not compatible with ` +
        `the status schema, given status: ${JSON.stringify(invalidStatus)}`);
    });

    test('should throw error when `app_status` is `busy` but `busy_resources` is missing', async () => {
      let invalidStatus = {
        app_status: 'busy'
      };

      await expect(() => { format(invalidStatus); }).toThrowError(`Given sync status is invalid, app is busy ` +
        `but busy-resources are not defined`);
    });

    test('should throw error when resource `name` is missing', async () => {
      let invalidStatus = {
        app_status: 'busy',
        busy_resources: [
          {
            description: {
              foo: 'bar'
            }
          }
        ]
      };

      await expect(() => { format(invalidStatus); }).toThrowError(`Given sync status is not compatible with ` +
        `the status schema, given status: ${JSON.stringify(invalidStatus)}`);
    });

    test('should throw error when a busy resource is invalid', async () => {
      let invalidStatus = {
        app_status: 'busy',
        busy_resources: [
          {
            name: 'foo'
          }
        ]
      };

      await expect(() => { format(invalidStatus); }).toThrowError(`Given sync status is invalid, cannot find ` +
        `resource name: \`foo\``);
    });
  });

  test('should format idle status correctly', async () => {
    let idleStatus = {
      app_status: 'idle'
    };

    await expect(format(idleStatus)).toEqual(`The app seems to be idle`);
  });

  describe('busy status', () => {
    test('should format "delayed_perform_selector" correctly', async () => {
      let busyStatus = {
        app_status: 'busy',
        busy_resources: [
          {
            name: 'delayed_perform_selector',
            description: {
              pending_selectors: 123
            }
          }
        ]
      };

      await expect(format(busyStatus)).toEqual(`The app is busy with the following tasks:\n` +
        `• There are 123 pending delayed selectors to be performed.`);
    });

    test('should format "dispatch_queue" correctly', async () => {
      let busyStatus = {
        app_status: 'busy',
        busy_resources: [
          {
            name: 'dispatch_queue',
            description: {
              queue: 'foo',
              works_count: 123
            }
          }
        ]
      };

      await expect(format(busyStatus)).toEqual(`The app is busy with the following tasks:\n` +
        `• There are 123 work items pending on the dispatch queue: "foo".`);
    });

    test('should format "run_loop" correctly', async () => {
      let busyStatus = {
        app_status: 'busy',
        busy_resources: [
          {
            name: 'run_loop',
            description: {
              name: 'foo'
            }
          }
        ]
      };

      await expect(format(busyStatus)).toEqual(`The app is busy with the following tasks:\n` +
        `• Run loop "foo" is awake.`);
    });

    test('should format "one_time_events" correctly', async () => {
      let busyStatus = {
        app_status: 'busy',
        busy_resources: [
          {
            name: 'one_time_events',
            description: {
              event: 'foo',
              object: 'bar'
            }
          }
        ]
      };

      await expect(format(busyStatus)).toEqual(`The app is busy with the following tasks:\n` +
        `• The event "foo" is taking place with object: "bar".`);
    });

    test('should format "timers" correctly when there is no description', async () => {
      let busyStatus = {
        app_status: 'busy',
        busy_resources: [
          {
            name: 'timers'
          }
        ]
      };

      await expect(format(busyStatus)).toEqual(`The app is busy with the following tasks:\n` +
        `• There are enqueued timers.`);
    });

    test('should format "timers" correctly when there are timers in description', async () => {
      let busyStatus = {
        app_status: 'busy',
        busy_resources: [
          {
            name: 'timers',
            description: {
              timers: [
                {
                  fire_date: "foo",
                  time_until_fire: 0.468978,
                  repeat_interval: 1,
                  is_recurring: true
                },
                {
                  fire_date: "bar",
                  time_until_fire: 0.98798,
                  repeat_interval: 0,
                  is_recurring: false
                }
              ]
            }
          }

        ]
      };

      await expect(format(busyStatus)).toEqual(`The app is busy with the following tasks:\n` +
        `• 2 enqueued native timers:\n` +
        `  - Timer #1:\n` +
        `    + Fire date: foo.\n    + Time until fire: 0.469.\n    + Repeat interval: 1.\n    + Is recurring: YES.\n` +
        `  - Timer #2:\n` +
        `    + Fire date: bar.\n    + Time until fire: 0.988.\n    + Repeat interval: 0.\n    + Is recurring: NO.`);
    });

    test('should format "ui" correctly #1', async () => {
      let busyStatus = {
        app_status: 'busy',
        busy_resources: [
          {
            name: 'ui',
            description: {
              layer_animation_pending_count: 3,
              layer_needs_display_count: 5,
              layer_needs_layout_count: 1,
              layer_pending_animation_count: 12
            }
          }

        ]
      };

      await expect(format(busyStatus)).toEqual(`The app is busy with the following tasks:\n` +
        `• UI elements are busy:\n` +
        `  - Layer animations pending: 3.\n` +
        `  - Layers needs display: 5.\n` +
        `  - Layers needs layout: 1.\n` +
        `  - Layers pending animations: 12.`);
    });

    test('should format "ui" correctly #2', async () => {
      let busyStatus = {
        app_status: 'busy',
        busy_resources: [
          {
            name: 'ui',
            description: {
              view_animation_pending_count: 3,
              view_controller_will_appear_count: 5,
              view_controller_will_disappear_count: 1,
              view_needs_display_count: 12,
              view_needs_layout_count: 15
            }
          }

        ]
      };

      await expect(format(busyStatus)).toEqual(`The app is busy with the following tasks:\n` +
        `• UI elements are busy:\n` +
        `  - View animations pending: 3.\n` +
        `  - View controllers will appear: 5.\n` +
        `  - View controllers will disappear: 1.\n` +
        `  - View needs display: 12.\n` +
        `  - View needs layout: 15.`);
    });

    test('should format "ui" correctly #3', async () => {
      let busyStatus = {
        app_status: 'busy',
        busy_resources: [
          {
            name: 'ui',
            description: {
              reason: 'foo'
            }
          }
        ]
      };

      await expect(format(busyStatus)).toEqual(`The app is busy with the following tasks:\n` +
        `• UI elements are busy:\n  - Reason: foo.`);
    });

    test('should format "network" correctly', async () => {
      let busyStatus = {
        app_status: 'busy',
        busy_resources: [
          {
            name: 'network',
            description: {
              urls: [
                'foo://bar.baz',
                'qux://quux.quuz'
              ]
            }
          }
        ]
      };

      await expect(format(busyStatus)).toEqual(`The app is busy with the following tasks:\n` +
        `• 2 network requests with URLs:\n  - URL #1: foo://bar.baz.\n  - URL #2: qux://quux.quuz.`);
    });

    test('should format "js_timers" corrrectly', async () => {
      let busyStatus = {
        app_status: 'busy',
        busy_resources: [
          {
            name: 'js_timers',
            description: {
              timers: [
                {
                  timer_id: 4,
                  duration: 1,
                  is_recurring: false
                },
                {
                  timer_id: 12,
                  duration: 2,
                  is_recurring: true
                }
              ]
            }
          }

        ]
      };

      await expect(format(busyStatus)).toEqual(`The app is busy with the following tasks:\n` +
        `• 2 enqueued JavaScript timers:\n` +
        `  - Timer #1:\n` +
        `    + JS timer ID: 4.\n    + Duration: 1.\n    + Is recurring: NO.\n` +
        `  - Timer #2:\n` +
        `    + JS timer ID: 12.\n    + Duration: 2.\n    + Is recurring: YES.`);
    });

    test('should format "looper" correctly #1', async () => {
      let busyStatus = {
        app_status: 'busy',
        busy_resources: [
          {
            name: 'looper',
            description: {
              thread: 'Foo Looper',
              execution_type: 'baz execution'
            }
          }
        ]
      };

      await expect(format(busyStatus)).toEqual(`The app is busy with the following tasks:\n` +
        `• Foo Looper is executing (baz execution).`);
    });

    test('should format "looper" correctly', async () => {
      let busyStatus = {
        app_status: 'busy',
        busy_resources: [
          {
            name: 'looper',
            description: {
              thread: 'Foo Looper'
            }
          }
        ]
      };

      await expect(format(busyStatus)).toEqual(`The app is busy with the following tasks:\n` +
        `• Foo Looper is executing.`);
    });

    test('should format "io" correctly', async () => {
      let busyStatus = {
        app_status: 'busy',
        busy_resources: [
          {
            name: 'io'
          }
        ]
      };

      await expect(format(busyStatus)).toEqual(`The app is busy with the following tasks:\n` +
        `• Disk I/O activity.`);
    });

    test('should format "unknown" correctly', async () => {
      let busyStatus = {
        app_status: 'busy',
        busy_resources: [
          {
            name: 'unknown',
            description: {
              identifier: 'foo.bar#baz'
            }
          }
        ]
      };

      await expect(format(busyStatus)).toEqual(`The app is busy with the following tasks:\n` +
        `• Resource "foo.bar#baz" is busy.`);
    });
  });
});
