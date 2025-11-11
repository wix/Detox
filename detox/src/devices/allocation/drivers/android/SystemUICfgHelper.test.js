describe('SystemUICfgHelper', () => {
  const minimalPreset = {
    keyboard: 'hide',
    touches: 'show',
    navigationMode: '3-button',
    statusBar: {
      notifications: 'hide',
      wifiSignal: 'strong',
      cellSignal: 'none',
      batteryLevel: 'full',
      charging: true,
      clock: '1337',
    },
  };

  let mockAdb;
  let mockSleep;
  let uut;

  beforeEach(() => {
    mockAdb = {
      shell: jest.fn().mockResolvedValue(undefined),
    };

    jest.mock('../../../../utils/sleep', () => jest.fn().mockResolvedValue(undefined));
    mockSleep = require('../../../../utils/sleep');

    const SystemUICfgHelper = require('./SystemUICfgHelper');
    uut = new SystemUICfgHelper({ adb: mockAdb });
  });

  describe('resolveConfig', () => {
    it('should return object as-is by default', () => {
      const systemUI = {
        keyboard: 'show',
        touches: 'hide',
        statusBar: {
          notifications: 'show',
        },
      };

      const result = uut.resolveConfig(systemUI);

      expect(result).toBe(systemUI);
      expect(result).toEqual({
        keyboard: 'show',
        touches: 'hide',
        statusBar: {
          notifications: 'show',
        },
      });
    });

    it('should use minimal preset', () => {
      const result = uut.resolveConfig('minimal');
      expect(result).toEqual(minimalPreset);
    });

    it('should (deep!) merge extended preset when extends is specified', () => {
      const systemUI = {
        extends: 'minimal',
        keyboard: 'show',
        statusBar: {
          notifications: 'show',
          wifiSignal: 'weak',
        },
      };

      const result = uut.resolveConfig(systemUI);

      expect(result).toEqual({
        extends: undefined,
        keyboard: 'show',
        statusBar: {
          notifications: 'show',
          wifiSignal: 'weak',

          // preset:
          cellSignal: 'none',
          batteryLevel: 'full',
          charging: true,
          clock: '1337',
        },
        // preset:
        touches: 'show',
        navigationMode: '3-button',
      });
    });
  });

  describe('setupKeyboardBehavior', () => {
    it('should set keyboard to show when keyboard is "show"', async () => {
      await uut.setupKeyboardBehavior({ keyboard: 'show' });
      expect(mockAdb.shell).toHaveBeenCalledWith('settings put Secure show_ime_with_hard_keyboard 1');
    });

    it('should set keyboard to hide when keyboard is "hide"', async () => {
      await uut.setupKeyboardBehavior({ keyboard: 'hide' });
      expect(mockAdb.shell).toHaveBeenCalledWith('settings put Secure show_ime_with_hard_keyboard 0');
    });

    it('should not call adb.shell when keyboard is undefined', async () => {
      await uut.setupKeyboardBehavior({});
      expect(mockAdb.shell).not.toHaveBeenCalled();
    });

    it('should not call adb.shell when keyboard is null', async () => {
      await uut.setupKeyboardBehavior({ keyboard: null });
      expect(mockAdb.shell).not.toHaveBeenCalled();
    });
  });

  describe('setupPointerIndicators', () => {
    describe('touches', () => {
      it('should set show_touches to 1 when touches is "show"', async () => {
        await uut.setupPointerIndicators({ touches: 'show' });
        expect(mockAdb.shell).toHaveBeenCalledWith('settings put system show_touches 1');
      });

      it('should set show_touches to 0 when touches is "hide"', async () => {
        await uut.setupPointerIndicators({ touches: 'hide' });
        expect(mockAdb.shell).toHaveBeenCalledWith('settings put system show_touches 0');
      });

      it('should not call adb.shell for show_touches when touches is undefined', async () => {
        await uut.setupPointerIndicators({});
        expect(mockAdb.shell).not.toHaveBeenCalled();
      });

      it('should not call adb.shell for show_touches when touches is null', async () => {
        await uut.setupPointerIndicators({ touches: null });
        expect(mockAdb.shell).not.toHaveBeenCalled();
      });
    });

    describe('pointerLocationBar', () => {
      it('should set pointer_location to 1 when pointerLocationBar is "show"', async () => {
        await uut.setupPointerIndicators({ pointerLocationBar: 'show' });
        expect(mockAdb.shell).toHaveBeenCalledWith('settings put system pointer_location 1');
      });

      it('should set pointer_location when pointerLocationBar is "hide"', async () => {
        await uut.setupPointerIndicators({ pointerLocationBar: 'hide' });
        expect(mockAdb.shell).toHaveBeenCalledWith('settings put system pointer_location 0');
      });

      it('should not call adb.shell for pointer_location when pointerLocationBar is undefined', async () => {
        await uut.setupPointerIndicators({});
        expect(mockAdb.shell).not.toHaveBeenCalled();
      });

      it('should not call adb.shell for pointer_location when pointerLocationBar is null', async () => {
        await uut.setupPointerIndicators({ pointerLocationBar: null });
        expect(mockAdb.shell).not.toHaveBeenCalled();
      });
    });

    it('should handle both touches and pointerLocationBar together', async () => {
      await uut.setupPointerIndicators({
        touches: 'show',
        pointerLocationBar: 'show',
      });

      expect(mockAdb.shell).toHaveBeenCalledWith('settings put system show_touches 1');
      expect(mockAdb.shell).toHaveBeenCalledWith('settings put system pointer_location 1');
      expect(mockAdb.shell).toHaveBeenCalledTimes(2);
    });
  });

  describe('setupNavigationMode', () => {
    it('should enable 3-button navigation when navigationMode is "3-button"', async () => {
      await uut.setupNavigationMode({ navigationMode: '3-button' });
      expect(mockAdb.shell).toHaveBeenCalledWith('cmd overlay enable com.android.internal.systemui.navbar.threebutton');
    });

    it('should enable gesture navigation when navigationMode is "gesture"', async () => {
      await uut.setupNavigationMode({ navigationMode: 'gesture' });
      expect(mockAdb.shell).toHaveBeenCalledWith('cmd overlay enable com.android.internal.systemui.navbar.gestural');
    });

    it('should not call adb.shell when navigationMode is undefined', async () => {
      await uut.setupNavigationMode({ navigationMode: undefined });
      expect(mockAdb.shell).not.toHaveBeenCalled();
    });

    it('should not call adb.shell when navigationMode is null', async () => {
      await uut.setupNavigationMode({ navigationMode: null });
      expect(mockAdb.shell).not.toHaveBeenCalled();
    });
  });

  describe('setupStatusBar', () => {
    /**
     * @param {object} opts
     * @returns {string}
     */
    const batteryCmd = ({ batteryLevel, charging }) =>
      `am broadcast -a com.android.systemui.demo -e command battery` +
        (batteryLevel !== undefined ? ` -e level ${batteryLevel}` : '') +
        (charging !== undefined ? ` -e plugged ${charging}` : '');

    const clockCmd = (time = '1234') => `am broadcast -a com.android.systemui.demo -e command clock -e hhmm ${time}`;

    it('should not call adb.shell when statusBar is undefined', async () => {
      await uut.setupStatusBar({});

      expect(mockAdb.shell).not.toHaveBeenCalled();
    });

    it('should initialize demo mode and enter it', async () => {
      await uut.setupStatusBar({ statusBar: {} });

      expect(mockAdb.shell).toHaveBeenCalledWith('settings put global sysui_demo_allowed 1');
      expect(mockAdb.shell).toHaveBeenCalledWith('am broadcast -a com.android.systemui.demo -e command exit');
      expect(mockAdb.shell).toHaveBeenCalledWith('am broadcast -a com.android.systemui.demo -e command enter');
    });

    describe('notifications', () => {
      it('should set notifications to visible when notifications is "show"', async () => {
        await uut.setupStatusBar({
          statusBar: { notifications: 'show' },
        });

        expect(mockAdb.shell).toHaveBeenCalledWith('am broadcast -a com.android.systemui.demo -e command notifications -e visible 1');
      });

      it('should set notifications to hidden when notifications is "hide"', async () => {
        await uut.setupStatusBar({
          statusBar: { notifications: 'hide' },
        });

        expect(mockAdb.shell).toHaveBeenCalledWith('am broadcast -a com.android.systemui.demo -e command notifications -e visible 0');
      });

      it('should not set notifications when notifications is undefined', async () => {
        await uut.setupStatusBar({ statusBar: {} });

        const notificationsCalls = mockAdb.shell.mock.calls.filter(call =>
          call[0].includes('notifications')
        );
        expect(notificationsCalls).toHaveLength(0);
      });

      it('should not set notifications when notifications is null', async () => {
        await uut.setupStatusBar({ statusBar: { notifications: null } });

        const notificationsCalls = mockAdb.shell.mock.calls.filter(call =>
          call[0].includes('notifications')
        );
        expect(notificationsCalls).toHaveLength(0);
      });
    });

    describe('wifiSignal', () => {
      it('should hide wifi when wifiSignal is "none"', async () => {
        await uut.setupStatusBar({
          statusBar: { wifiSignal: 'none' },
        });

        expect(mockAdb.shell).toHaveBeenCalledWith('am broadcast -a com.android.systemui.demo -e command network -e wifi hide');
        expect(mockAdb.shell).not.toHaveBeenCalledWith(
          expect.stringContaining('network -e wifi show')
        );
      });

      it('should show wifi with strong signal when wifiSignal is "strong"', async () => {
        await uut.setupStatusBar({
          statusBar: { wifiSignal: 'strong' },
        });

        expect(mockAdb.shell).toHaveBeenCalledWith('am broadcast -a com.android.systemui.demo -e command network -e wifi hide');
        expect(mockAdb.shell).toHaveBeenCalledWith('am broadcast -a com.android.systemui.demo -e command network -e wifi show -e level 4 -e fully true');
      });

      it('should show wifi with weak signal when wifiSignal is "weak"', async () => {
        await uut.setupStatusBar({
          statusBar: { wifiSignal: 'weak' },
        });

        expect(mockAdb.shell).toHaveBeenCalledWith('am broadcast -a com.android.systemui.demo -e command network -e wifi hide');
        expect(mockAdb.shell).toHaveBeenCalledWith('am broadcast -a com.android.systemui.demo -e command network -e wifi show -e level 2 -e fully true');
      });

      it('should not set wifi when wifiSignal is undefined', async () => {
        await uut.setupStatusBar({ statusBar: {} });

        const wifiCalls = mockAdb.shell.mock.calls.filter(call =>
          call[0].includes('network -e wifi')
        );
        expect(wifiCalls).toHaveLength(0);
      });

      it('should not set wifi when wifiSignal is null', async () => {
        await uut.setupStatusBar({ statusBar: { wifiSignal: null } });

        const wifiCalls = mockAdb.shell.mock.calls.filter(call =>
          call[0].includes('network -e wifi')
        );
        expect(wifiCalls).toHaveLength(0);
      });
    });

    describe('cellSignal', () => {
      it('should hide mobile when cellSignal is "none"', async () => {
        await uut.setupStatusBar({
          statusBar: { cellSignal: 'none' },
        });

        expect(mockAdb.shell).toHaveBeenCalledWith('am broadcast -a com.android.systemui.demo -e command network -e mobile hide');
        expect(mockAdb.shell).not.toHaveBeenCalledWith(
          expect.stringContaining('network -e mobile show')
        );
      });

      it('should show mobile with strong signal when cellSignal is "strong"', async () => {
        await uut.setupStatusBar({
          statusBar: { cellSignal: 'strong' },
        });

        expect(mockAdb.shell).toHaveBeenCalledWith('am broadcast -a com.android.systemui.demo -e command network -e mobile hide');
        expect(mockAdb.shell).toHaveBeenCalledWith('am broadcast -a com.android.systemui.demo -e command network -e mobile show -e level 4 -e fully true -e datatype none');
      });

      it('should show mobile with weak signal when cellSignal is "weak"', async () => {
        await uut.setupStatusBar({
          statusBar: { cellSignal: 'weak' },
        });

        expect(mockAdb.shell).toHaveBeenCalledWith('am broadcast -a com.android.systemui.demo -e command network -e mobile hide');
        expect(mockAdb.shell).toHaveBeenCalledWith('am broadcast -a com.android.systemui.demo -e command network -e mobile show -e level 2 -e fully true -e datatype none');
      });

      it('should not set mobile when cellSignal is undefined', async () => {
        await uut.setupStatusBar({ statusBar: {} });

        const mobileCalls = mockAdb.shell.mock.calls.filter(call =>
          call[0].includes('network -e mobile')
        );
        expect(mobileCalls).toHaveLength(0);
      });

      it('should not set mobile when cellSignal is null', async () => {
        await uut.setupStatusBar({ statusBar: { cellSignal: null } });

        const mobileCalls = mockAdb.shell.mock.calls.filter(call =>
          call[0].includes('network -e mobile')
        );
        expect(mobileCalls).toHaveLength(0);
      });
    });

    describe('clock', () => {
      it('should set clock when clock is provided', async () => {
        await uut.setupStatusBar({
          statusBar: { clock: '1234' },
        });

        expect(mockAdb.shell).toHaveBeenCalledWith(clockCmd());
      });

      it('should not set clock when clock is undefined', async () => {
        await uut.setupStatusBar({ statusBar: {} });

        const clockCalls = mockAdb.shell.mock.calls.filter(call =>
          call[0].includes('clock')
        );
        expect(clockCalls).toHaveLength(0);
      });

      it('should not set clock when clock is null', async () => {
        await uut.setupStatusBar({ statusBar: { clock: null } });

        const clockCalls = mockAdb.shell.mock.calls.filter(call =>
          call[0].includes('clock')
        );
        expect(clockCalls).toHaveLength(0);
      });
    });

    describe('batteryLevel', () => {
      it('should set battery level to 100 when batteryLevel is "full"', async () => {
        await uut.setupStatusBar({
          statusBar: { batteryLevel: 'full' },
        });

        expect(mockAdb.shell).toHaveBeenCalledWith(
          'am broadcast -a com.android.systemui.demo -e command battery -e level 100'
        );
        expect(mockSleep).toHaveBeenCalledWith(1500);
      });

      it('should set battery level to 50 when batteryLevel is "half"', async () => {
        await uut.setupStatusBar({
          statusBar: { batteryLevel: 'half' },
        });

        expect(mockAdb.shell).toHaveBeenCalledWith(
          'am broadcast -a com.android.systemui.demo -e command battery -e level 50'
        );
        expect(mockSleep).toHaveBeenCalledWith(1500);
      });

      it('should set battery level to 20 when batteryLevel is "low"', async () => {
        await uut.setupStatusBar({
          statusBar: { batteryLevel: 'low' },
        });

        expect(mockAdb.shell).toHaveBeenCalledWith(
          'am broadcast -a com.android.systemui.demo -e command battery -e level 20'
        );
        expect(mockSleep).toHaveBeenCalledWith(1500);
      });

      it('should not set battery level when batteryLevel is undefined', async () => {
        await uut.setupStatusBar({ statusBar: {} });

        const batteryCalls = mockAdb.shell.mock.calls.filter(call =>
          call[0].includes('battery')
        );
        expect(batteryCalls).toHaveLength(0);
      });

      it('should not set battery level when batteryLevel is null', async () => {
        await uut.setupStatusBar({ statusBar: { batteryLevel: null } });

        const batteryCalls = mockAdb.shell.mock.calls.filter(call =>
          call[0].includes('battery')
        );
        expect(batteryCalls).toHaveLength(0);
      });
    });

    describe('charging', () => {
      it('should set charging to true when charging is true', async () => {
        await uut.setupStatusBar({
          statusBar: { charging: true },
        });

        expect(mockAdb.shell).toHaveBeenCalledWith(batteryCmd({ charging: true }));
        expect(mockSleep).toHaveBeenCalledWith(1500);
      });

      it('should set charging to false when charging is false', async () => {
        await uut.setupStatusBar({
          statusBar: { charging: false },
        });

        expect(mockAdb.shell).toHaveBeenCalledWith(batteryCmd({ charging: false }));
        expect(mockSleep).toHaveBeenCalledWith(1500);
      });

      it('should not set charging when charging is undefined', async () => {
        await uut.setupStatusBar({ statusBar: {} });

        const adbCalls = mockAdb.shell.mock.calls.filter(call =>
          call[0].includes('battery')
        );
        expect(adbCalls).toHaveLength(0);
      });

      it('should not set charging when charging is null', async () => {
        await uut.setupStatusBar({ statusBar: { charging: null } });

        const adbCalls = mockAdb.shell.mock.calls.filter(call =>
          call[0].includes('battery')
        );
        expect(adbCalls).toHaveLength(0);
      });
    });

    describe('batteryLevel and charging combinations', () => {
      it('should set both battery level and charging when both are provided', async () => {
        await uut.setupStatusBar({
          statusBar: {
            batteryLevel: 'half',
            charging: true,
          },
        });

        expect(mockAdb.shell).toHaveBeenCalledWith(batteryCmd({ batteryLevel: 50, charging: true }));
        expect(mockSleep).toHaveBeenCalledWith(1500);
      });

      it('should set only battery level when charging is null', async () => {
        await uut.setupStatusBar({
          statusBar: {
            batteryLevel: 'full',
            charging: null,
          },
        });

        expect(mockAdb.shell).toHaveBeenCalledWith(batteryCmd({ batteryLevel: 100 }));
      });

      it('should set only charging when batteryLevel is null', async () => {
        await uut.setupStatusBar({
          statusBar: {
            batteryLevel: null,
            charging: false,
          },
        });

        expect(mockAdb.shell).toHaveBeenCalledWith('am broadcast -a com.android.systemui.demo -e command battery -e plugged false');
      });
    });

    it('should handle all statusBar properties together', async () => {
      await uut.setupStatusBar({
        statusBar: {
          notifications: 'show',
          wifiSignal: 'strong',
          cellSignal: 'weak',
          batteryLevel: 'half',
          charging: true,
          clock: '0915',
        },
      });

      expect(mockAdb.shell).toHaveBeenCalledWith('settings put global sysui_demo_allowed 1');
      expect(mockAdb.shell).toHaveBeenCalledWith('am broadcast -a com.android.systemui.demo -e command exit');
      expect(mockAdb.shell).toHaveBeenCalledWith('am broadcast -a com.android.systemui.demo -e command enter');
      expect(mockAdb.shell).toHaveBeenCalledWith('am broadcast -a com.android.systemui.demo -e command notifications -e visible 1');
      expect(mockAdb.shell).toHaveBeenCalledWith('am broadcast -a com.android.systemui.demo -e command network -e wifi hide');
      expect(mockAdb.shell).toHaveBeenCalledWith('am broadcast -a com.android.systemui.demo -e command network -e wifi show -e level 4 -e fully true');
      expect(mockAdb.shell).toHaveBeenCalledWith('am broadcast -a com.android.systemui.demo -e command network -e mobile hide');
      expect(mockAdb.shell).toHaveBeenCalledWith('am broadcast -a com.android.systemui.demo -e command network -e mobile show -e level 2 -e fully true -e datatype none');
      expect(mockAdb.shell).toHaveBeenCalledWith('am broadcast -a com.android.systemui.demo -e command clock -e hhmm 0915');
      expect(mockAdb.shell).toHaveBeenCalledWith('am broadcast -a com.android.systemui.demo -e command battery -e level 50 -e plugged true');
      expect(mockSleep).toHaveBeenCalledWith(1500);
    });
  });
});

