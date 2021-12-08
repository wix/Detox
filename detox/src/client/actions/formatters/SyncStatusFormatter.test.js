const format = require('./SyncStatusFormatter');

describe('Sync Status Formatter', () => {
  describe('assertions', () => {
    it('should throw error when `app_status` is missing', async () => {
      let invalidStatus = {
        busy_resource: []
      };

      await expect(() => { format(invalidStatus); }).toThrowErrorMatchingSnapshot();
    });

    it('should throw error when `app_status` is invalid', async () => {
      let invalidStatus = {
        app_status: 'foo'
      };

      await expect(() => { format(invalidStatus); }).toThrowErrorMatchingSnapshot();
    });

    it('should throw error when `app_status` is `busy` but `busy_resources` is missing', async () => {
      let invalidStatus = {
        app_status: 'busy'
      };

      await expect(() => { format(invalidStatus); }).toThrowErrorMatchingSnapshot();
    });

    it('should throw error when `app_status` is `busy` but `busy_resources` is empty', async () => {
      let invalidStatus = {
        app_status: 'busy',
        busy_resources: []
      };

      await expect(() => { format(invalidStatus); }).toThrowErrorMatchingSnapshot();
    });

    it('should throw error when resource `name` is missing', async () => {
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

      await expect(() => { format(invalidStatus); }).toThrowErrorMatchingSnapshot();
    });

    it('should throw error when a busy resource is invalid', async () => {
      let invalidStatus = {
        app_status: 'busy',
        busy_resources: [
          {
            name: 'foo'
          }
        ]
      };

      await expect(() => { format(invalidStatus); }).toThrowErrorMatchingSnapshot();
    });
  });

  it('should format idle status correctly', async () => {
    let idleStatus = {
      app_status: 'idle'
    };

    await expect(format(idleStatus)).toMatchSnapshot();
  });

  describe('busy status', () => {
    it('should format "delayed_perform_selector" correctly', async () => {
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

      await expect(format(busyStatus)).toMatchSnapshot();
    });

    it('should format "dispatch_queue" correctly', async () => {
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

      await expect(format(busyStatus)).toMatchSnapshot();
    });

    it('should format "run_loop" correctly', async () => {
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

      await expect(format(busyStatus)).toMatchSnapshot();
    });

    it('should format "one_time_events" correctly when there is no object', async () => {
      let busyStatus = {
        app_status: 'busy',
        busy_resources: [
          {
            name: 'one_time_events',
            description: {
              event: 'foo'
            }
          }
        ]
      };

      await expect(format(busyStatus)).toMatchSnapshot();
    });

    it('should format "one_time_events" correctly', async () => {
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

      await expect(format(busyStatus)).toMatchSnapshot();
    });

    it('should format "timers" correctly when there is no description', async () => {
      let busyStatus = {
        app_status: 'busy',
        busy_resources: [
          {
            name: 'timers'
          }
        ]
      };

      await expect(format(busyStatus)).toMatchSnapshot();
    });

    it('should format "timers" correctly when there are timers in description', async () => {
      let busyStatus = {
        app_status: 'busy',
        busy_resources: [
          {
            name: 'timers',
            description: {
              timers: [
                {
                  fire_date: 'foo',
                  time_until_fire: 0.468978,
                  repeat_interval: 1,
                  is_recurring: true
                },
                {
                  fire_date: 'bar',
                  time_until_fire: 0.98798,
                  repeat_interval: 0,
                  is_recurring: false
                }
              ]
            }
          }

        ]
      };

      await expect(format(busyStatus)).toMatchSnapshot();
    });

    it('should format "ui" correctly #1', async () => {
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

      await expect(format(busyStatus)).toMatchSnapshot();
    });

    it('should format "ui" correctly #2', async () => {
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

      await expect(format(busyStatus)).toMatchSnapshot();
    });

    it('should format "ui" correctly #3', async () => {
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

      await expect(format(busyStatus)).toMatchSnapshot();
    });

    it('should format "network" correctly', async () => {
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

      await expect(format(busyStatus)).toMatchSnapshot();
    });

    it('should format "js_timers" corrrectly', async () => {
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

      await expect(format(busyStatus)).toMatchSnapshot();
    });

    it('should format "looper" correctly #1', async () => {
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

      await expect(format(busyStatus)).toMatchSnapshot();
    });

    it('should format "looper" correctly', async () => {
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

      await expect(format(busyStatus)).toMatchSnapshot();
    });

    it('should format "io" correctly', async () => {
      let busyStatus = {
        app_status: 'busy',
        busy_resources: [
          {
            name: 'io'
          }
        ]
      };

      await expect(format(busyStatus)).toMatchSnapshot();
    });

    it('should format "bridge" correctly', async () => {
      let busyStatus = {
        app_status: 'busy',
        busy_resources: [
          {
            name: 'bridge'
          }
        ]
      };

      await expect(format(busyStatus)).toMatchSnapshot();
    });

    it('should format "unknown" correctly', async () => {
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

      await expect(format(busyStatus)).toMatchSnapshot();
    });
  });
});
