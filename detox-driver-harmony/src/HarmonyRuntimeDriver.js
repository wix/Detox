const path = require('path');

const EspressoDetoxApi = require('detox/src/android/espressoapi/EspressoDetox');
const UiDeviceProxy = require('detox/src/android/espressoapi/UiDeviceProxy');
const temporaryPath = require('detox/src/artifacts/utils/temporaryPath');
const getAbsoluteBinaryPath = require('detox/src/utils/getAbsoluteBinaryPath');
const logger = require('detox/src/utils/logger');
const DeviceDriverBase = require('detox/src/devices/runtime/drivers/DeviceDriverBase');

const HDC = require('./HDC');

const log = logger.child({ cat: 'device' });

class HarmonyRuntimeDriver extends DeviceDriverBase {
  constructor(deps, deviceCookie) {
    super(deps);
    this.hdcName = deviceCookie.hdcName;
    this.hdc = new HDC();
    this.invocationManager = deps.invocationManager;
    this.client = deps.client;
    // Serve app-side snapshot fetch requests (uitest dumpLayout via hdc).
    if (typeof this.client.setFetchLayoutHandler === 'function') {
      this.client.setFetchLayoutHandler(() => this.injectLayoutViaHdc());
    }
    // Serve app-side gesture injection requests: toward-top scrolls need a
    // host `uinput -T -m` drag — slow in-app injections are ignored by
    // FlatList, fast ones carry refresh-firing fling momentum.
    if (typeof this.client.setGestureInjectHandler === 'function') {
      this.client.setGestureInjectHandler(async (cmd) => {
        await this.hdc.shell(this.hdcName, String(cmd));
      });
    }
    this._launched = false;
    this._rportPort = null;

    this.uiDevice = new UiDeviceProxy(this.invocationManager).getUIDevice();
  }

  getExternalId() {
    return this.hdcName;
  }

  getDeviceName() {
    return this.hdcName;
  }

  declareArtifactPlugins() {
    return super.declareArtifactPlugins();
  }

  async getBundleIdFromBinary(_hapPath) {
    throw new Error('HarmonyOS bundleId must be set in detox config (apps.*.bundleId)');
  }

  async installApp(binaryPath, testBinaryPath) {
    // Enable AAMS test mode for UiTest Driver stability.
    try { await this.hdc.shell(this.hdcName, 'param set persist.ace.testmode.enabled 1'); } catch {}

    const hap = getAbsoluteBinaryPath(binaryPath);
    log.debug({ event: 'HARMONY_INSTALL' }, `installing main HAP: ${hap}`);
    await this.hdc.install(this.hdcName, hap);

    if (testBinaryPath) {
      const testHap = getAbsoluteBinaryPath(testBinaryPath);
      log.debug({ event: 'HARMONY_INSTALL' }, `installing test HAP: ${testHap}`);
      await this.hdc.install(this.hdcName, testHap);
    }
  }

  async uninstallApp(bundleId) {
    log.debug({ event: 'HARMONY_UNINSTALL' }, `uninstalling ${bundleId}`);
    await this.hdc.uninstall(this.hdcName, bundleId);
  }

  async _reverseServerPort() {
    const serverUrl = this.client.serverUrl;
    const serverPort = new URL(serverUrl).port;
    log.info({ event: 'HARMONY_RPORT_SETUP' }, `rport ${serverPort} for ${this.hdcName}`);
    await this.hdc.rport(this.hdcName, serverPort, serverPort);
    log.debug({ event: 'HARMONY_RPORT' }, `rport tcp:${serverPort} -> tcp:${serverPort}`);
    return serverPort;
  }

  async launchApp(bundleId, launchArgs = {}) {
    if (!this._rportPort) {
      this._rportPort = await this._reverseServerPort();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    const serverPort = this._rportPort;

    const newInstance = launchArgs.newInstance === true || (launchArgs.detoxServerUrl === undefined && !this._launched);
    if (this._launched && !newInstance) {
      return NaN;
    }

    if (this._launched) {
      await this.hdc.stopAbility(this.hdcName, bundleId);
      try {
        const pidOut = await this.hdc.shell(this.hdcName, `pidof ${bundleId}`);
        const pids = pidOut.trim().split(/\s+/).filter(Boolean);
        log.info({ event: 'HARMONY_KILL' }, `pidof ${bundleId} -> [${pids.join(', ')}]`);
        for (const pid of pids) {
          if (/^\d+$/.test(pid)) {
            await this.hdc.shell(this.hdcName, `kill -9 ${pid}`);
          }
        }
      } catch (_e) { /* best-effort */ }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const detoxServer = `ws://localhost:${serverPort}`;

    const testParams = [];
    testParams.push(['DetoxServer', detoxServer]);
    if (launchArgs.detoxSessionId) {
      testParams.push(['DetoxSessionId', String(launchArgs.detoxSessionId)]);
    }

    for (const [key, value] of Object.entries(launchArgs)) {
      if (key === 'detoxServerUrl' || key === 'detoxServer' || key === 'detoxSessionId' || key === 'entryAbility' || key === 'newInstance') continue;
      testParams.push([key, String(value)]);
    }

    const moduleName = launchArgs.testModuleName || 'entry_test';
    const testRunner = launchArgs.testRunner || 'OpenHarmonyTestRunner';
    const waitSeconds = launchArgs.testTimeout || 150;

    log.info({ event: 'HARMONY_AA_TEST' }, `aa test: bundle=${bundleId} module=${moduleName} params=${JSON.stringify(testParams)}`);
    this.hdc.startTestAbility(
      this.hdcName, bundleId, moduleName, testRunner, testParams, waitSeconds
    ).catch((err) => {
      log.error({ event: 'HARMONY_LAUNCH_ERROR' }, `aa test failed: ${err.message}`);
    });

    this._launched = true;
    return NaN;
  }

  async waitForAppLaunch() {
    return NaN;
  }

  async terminateApp(bundleId) {
    await this.hdc.stopAbility(this.hdcName, bundleId);
  }

  async cleanup(bundleId) {
    if (bundleId) {
      try { await this.hdc.stopAbility(this.hdcName, bundleId); } catch {}
    }
    // Kill residual uitest processes — uitest dumpLayout (injectLayoutViaHdc)
    // creates a second AAMS connection that corrupts the in-process Driver's
    // tree state. Must clean up before next suite's aa test to avoid
    // findComponent failures (by.label/toHaveToggleValue).
    try { await this.hdc.shell(this.hdcName, 'pkill -9 uitest'); } catch {}
    await super.cleanup(bundleId);
  }

  async takeScreenshot(screenshotName) {
    // All UI operations route through uitest — capture included
    // (uitest screenCap writes PNG regardless of extension).
    const localPath = temporaryPath.for.png(screenshotName);
    const remotePath = `/data/local/tmp/${path.basename(localPath)}`;
    await this.hdc.shell(this.hdcName, `uitest screenCap -p ${remotePath}`);
    await this.hdc.getFile(this.hdcName, remotePath, localPath);
    try { await this.hdc.shell(this.hdcName, `rm ${remotePath}`); } catch {}
    return localPath;
  }

  async pressBack() {
    await this.hdc.shell(this.hdcName, 'uitest uiInput keyEvent Back');
  }

  async sendToHome() {
    await this.hdc.shell(this.hdcName, 'uitest uiInput keyEvent Home');
  }

  async tap(point) {
    const x = point ? point.x : 100;
    const y = point ? point.y : 100;
    await this.hdc.shell(this.hdcName, `uitest uiInput click ${x} ${y}`);
  }

  async longPress(point) {
    const x = point ? point.x : 100;
    const y = point ? point.y : 100;
    await this.hdc.shell(this.hdcName, `uitest uiInput longClick ${x} ${y}`);
  }

  async reverseTcpPort(port) {
    // rport (Reverse): device-side 127.0.0.1:port -> host:port. This is the
    // adb-reverse semantic Detox expects. fport (forward) is host->device and
    // also makes hdcd listen on the host port — which collides with the
    // host-side mock server on the same port.
    await this.hdc.rport(this.hdcName, port, port);
  }

  async unreverseTcpPort(port) {
    try { await this.hdc.fportRm(this.hdcName, port, port); } catch {}
  }

  async setURLBlacklist(urlList) {
    try { await this.client.setSyncSettings({ blacklistUrl: urlList }); } catch {}
  }

  async disableSynchronization() {
    try { await this.client.setSyncSettings({ enabled: false }); } catch {}
  }

  async enableSynchronization() {
    try { await this.client.setSyncSettings({ enabled: true }); } catch {}
  }

  async captureViewHierarchy(name = 'capture') {
    try { return await this.client.captureViewHierarchy({ viewHierarchyURL: name }); } catch { return ''; }
  }

  /**
   * Fetch layout JSON via `hdc shell uitest dumpLayout` and inject it into the
   * native side as cached layout. This enables getTextFromLayout() to work on
   * API < 26 where in-process Driver.dumpLayout is unavailable.
   * Returns the JSON string, or '' on failure.
   */
  async injectLayoutViaHdc() {
    try {
      const dumpOut = await this.hdc.shell(this.hdcName, 'uitest dumpLayout -i');
      const pathMatch = String(dumpOut).match(/saved to:(\S+)/);
      if (pathMatch) {
        const json = await this.hdc.shell(this.hdcName, `cat ${pathMatch[1]}`);
        if (json) {
          const jsonStr = String(json);
          // Inject into native side for getTextFromLayout fallback
          try {
            await this.client.injectLayoutJson({ layoutJson: jsonStr });
          } catch { }
          return jsonStr;
        }
      }
    } catch { }
    return '';
  }

  async generateViewHierarchyXml(shouldInjectTestIds = false) {
    // Try 1: native in-process (API 26+: Driver.dumpLayout)
    try {
      const result = await Promise.race([
        this.client.generateViewHierarchyXml({ shouldInjectTestIds }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ]);
      if (result && !result.includes('dumpLayout unavailable') && result.includes('attributes')) {
        return result;
      }
    } catch { }
    // Try 2: hdc shell uitest dumpLayout + inject into native cache
    const hdcJson = await this.injectLayoutViaHdc();
    if (hdcJson) return hdcJson;
    return '';
  }

  getPlatform() {
    return 'harmony';
  }

  async setOrientation(orientation) {
    const code = orientation === 'landscape' ? 1 : 0;
    await this.invocationManager.execute(EspressoDetoxApi.changeOrientation(code));
  }

  async resetAppState() {
  }

  async shutdown() {
  }
}

module.exports = HarmonyRuntimeDriver;
