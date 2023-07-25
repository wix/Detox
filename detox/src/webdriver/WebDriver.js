/* eslint-disable node/no-unsupported-features/es-syntax */

const { randomUUID } = require('crypto');
const http = require('http');
const { promisify } = require('util');

const express = require('express');
const WebSocket = require('ws');

const actions = require('../client/actions/actions');
const DetoxServer = require('../server/DetoxServer');

const WebDriverSession = require('./WebDriverSession');
const { WebDriverError } = require('./errors');

class WebDriver {
  #express;
  /** @type {import('http').Server} */
  #expressServer;
  #wss;
  #appGateway;
  #options;
  #sessions = {};

  constructor(options) {
    this.#options = options;
    this.#express = express().use(express.json())
      .get('/status', this.#bind(this.onGetStatus))
      .get('/session', this.#bind(this.onGetSessionList))
      .post('/session', this.#bind(this.onPostSession))
      .get('/session/:sessionId', this.#bind(this.onGetSession))
      .delete('/session/:sessionId', this.#bind(this.onDeleteSession))
      .post('/session/:sessionId/url', this.#bind(this.onPostSessionUrl))
      .get('/session/:sessionId/url', this.#bind(this.onGetSessionUrl))
      .post('/session/:sessionId/back', this.#bind(this.onPostSessionBack))
      .post('/session/:sessionId/forward', this.#bind(this.onPostSessionForward))
      .post('/session/:sessionId/refresh', this.#bind(this.onPostSessionRefresh))
      .post('/session/:sessionId/element', this.#bind(this.onPostSessionElement))
      .post('/session/:sessionId/elements', this.#bind(this.onPostSessionElements))
      .post('/session/:sessionId/element/active', this.#bind(this.onPostSessionElementActive))
      .get('/session/:sessionId/element/:elementId/text', this.#bind(this.onGetSessionElementText))
      .get('/session/:sessionId/element/:elementId/attribute/:attributeName', this.#bind(this.onGetSessionElementAttribute))
      .post('/session/:sessionId/element/:elementId/click', this.#bind(this.onPostSessionElementClick))
      .post('/session/:sessionId/element/:elementId/value', this.#bind(this.onPostSessionElementValue))
      .post('/session/:sessionId/execute/sync', this.#bind(this.onPostSessionExecuteSync))
      .post('/session/:sessionId/execute/async', this.#bind(this.onPostSessionExecuteAsync))
      .get('/session/:sessionId/cookie', this.#bind(this.onGetSessionCookie))
      .post('/session/:sessionId/cookie', this.#bind(this.onPostSessionCookie))
      .delete('/session/:sessionId/cookie/:name', this.#bind(this.onDeleteSessionCookie))
      .delete('/session/:sessionId/cookie', this.#bind(this.onDeleteSessionAllCookies))
      .post('/session/:sessionId/alert/dismiss', this.#bind(this.onPostSessionAlertDismiss))
      .post('/session/:sessionId/alert/accept', this.#bind(this.onPostSessionAlertAccept))
      .get('/session/:sessionId/alert/text', this.#bind(this.onGetSessionAlertText))
      .post('/session/:sessionId/alert/text', this.#bind(this.onPostSessionAlertText))
      .get('/session/:sessionId/screenshot', this.#bind(this.onGetSessionScreenshot))
      .post('/session/:sessionId/detox/captureViewHierarchy', this.#bind(this.onDetoxCaptureViewHierarchy))
      .post('/session/:sessionId/detox/clearKeychain', this.#bind(this.onDetoxClearKeychain))
      .post('/session/:sessionId/detox/disableSynchronization', this.#bind(this.onDetoxDisableSynchronization))
      .post('/session/:sessionId/detox/enableSynchronization', this.#bind(this.onDetoxEnableSynchronization))
      .post('/session/:sessionId/detox/installApp', this.#bind(this.onDetoxInstallApp))
      .post('/session/:sessionId/detox/installUtilBinaries', this.#bind(this.onDetoxInstallUtilBinaries))
      .post('/session/:sessionId/detox/launchApp', this.#bind(this.onDetoxLaunchApp))
      .post('/session/:sessionId/detox/matchFace', this.#bind(this.onDetoxMatchFace))
      .post('/session/:sessionId/detox/matchFinger', this.#bind(this.onDetoxMatchFinger))
      .post('/session/:sessionId/detox/openURL', this.#bind(this.onDetoxOpenURL))
      .post('/session/:sessionId/detox/pressBack', this.#bind(this.onDetoxPressBack))
      .post('/session/:sessionId/detox/reloadReactNative', this.#bind(this.onDetoxReloadReactNative))
      .post('/session/:sessionId/detox/resetContentAndSettings', this.#bind(this.onDetoxResetContentAndSettings))
      .post('/session/:sessionId/detox/resetStatusBar', this.#bind(this.onDetoxResetStatusBar))
      .post('/session/:sessionId/detox/selectApp', this.#bind(this.onDetoxSelectApp))
      .post('/session/:sessionId/detox/sendToHome', this.#bind(this.onDetoxSendToHome))
      .post('/session/:sessionId/detox/sendUserActivity', this.#bind(this.onDetoxSendUserActivity))
      .post('/session/:sessionId/detox/sendUserNotification', this.#bind(this.onDetoxSendUserNotification))
      .post('/session/:sessionId/detox/setBiometricEnrollment', this.#bind(this.onDetoxSetBiometricEnrollment))
      .post('/session/:sessionId/detox/setLocation', this.#bind(this.onDetoxSetLocation))
      .post('/session/:sessionId/detox/setOrientation', this.#bind(this.onDetoxSetOrientation))
      .post('/session/:sessionId/detox/setStatusBar', this.#bind(this.onDetoxSetStatusBar))
      .post('/session/:sessionId/detox/setURLBlacklist', this.#bind(this.onDetoxSetURLBlacklist))
      .post('/session/:sessionId/detox/shake', this.#bind(this.onDetoxShake))
      .post('/session/:sessionId/detox/terminateApp', this.#bind(this.onDetoxTerminateApp))
      .post('/session/:sessionId/detox/uninstallApp', this.#bind(this.onDetoxUninstallApp))
      .post('/session/:sessionId/detox/unmatchFace', this.#bind(this.onDetoxUnmatchFace))
      .post('/session/:sessionId/detox/unmatchFinger', this.#bind(this.onDetoxUnmatchFinger))
      .post('/session/:sessionId/detox/invoke', this.#bind(this.onDetoxInvoke))
      .use(this.onUnknownCommand);

    this.#expressServer = http.createServer(this.#express);
    this.#wss = new WebSocket.Server({ server: this.#expressServer });
    this.#wss.on('connection', this.onWsConnection);
    this.#appGateway = new DetoxServer({
      port: 8099,
      standalone: true,
    });
  }

  #bind(method) {
    const jsonMethodWrapper = async (req, res) => {
      try {
        const result = await method.call(this, { req, res });
        res.status(200).json({ value: result });
      } catch (err) {
        const wderr = WebDriverError.cast(err);
        res.status(wderr.status).json({
          value: wderr.toJSON(),
        });
      }
    };

    return jsonMethodWrapper;
  }

  get port() {
    const address = this.#expressServer.address();
    // @ts-ignore
    return address.port;
  }

  async startServer() {
    await Promise.all([
      this.#listen(),
      this.#appGateway.open(),
    ]);
  }

  async stopServer() {
    await Promise.all([
      await this.#close(),
      await this.#appGateway.close(),
    ]);
  }

  // @ts-ignore
  #listen = promisify((callback) => this.#expressServer.listen(this.#options.port, callback));

  // @ts-ignore
  #close = promisify((callback) => this.#expressServer.close(callback));

  onGetStatus() {
    return {
      name: 'detox-server',
      version: '22.0.0-alpha.0',
    };
  }

  onGetSessionList() {
    return Object.keys(this.#sessions);
  }

  async onPostSession({ req }) {
    const request = req.body;
    let capabilities = request.capabilities ?? request.desiredCapabilities;
    if (!capabilities) {
      throw WebDriverError.invalidArgument('Session capabilities are required');
    }

    if (capabilities.alwaysMatch) {
      capabilities = capabilities.alwaysMatch;
    } else {
      capabilities = capabilities.firstMatch[0];
    }

    const sessionId = randomUUID();
    const session = new WebDriverSession({
      sessionId,
      capabilities: {
        ...capabilities,
        'detox:session': {
          debugSynchronization: 10000,
          ...capabilities['detox:session'],
          sessionId,
          autoStart: true,
          server: `ws://localhost:${this.#appGateway.port}`,
        },
      },
    });

    try {
      await session.start();
    } catch (err) {
      try {
        await session.stop();
      } finally {
        // eslint-disable-next-line no-unsafe-finally
        throw err;
      }
    }

    this.#sessions[session.sessionId] = session;
    return session;
  }

  #getSession(req) {
    const sessionId = req.params.sessionId;
    const session = this.#sessions[sessionId];
    if (!session) {
      throw WebDriverError.sessionNotCreated(`session ${sessionId} does not exist`);
    }

    return session;
  }

  onGetSession({ req }) {
    return this.#getSession(req);
  }

  async onDeleteSession({ req }) {
    const session = this.#getSession(req);
    delete this.#sessions[session.sessionId];
    await session.stop();
  }

  async onPostSessionUrl({ req }) {
    const url = req.body.url;
    if (!url) {
      throw WebDriverError.invalidArgument('url is required');
    }

    const session = this.#getSession(req);
    const device = session.device;
    await device.launchApp({}, url);
  }

  onGetSessionUrl({ req }) {
    const session = this.#getSession(req);
    const device = session.device;
    return device._currentApp.bundleId ?? '';
  }

  async onPostSessionBack({ req }) {
    const session = this.#getSession(req);
    const device = session.device;

    await device.pressBack();
  }

  onPostSessionForward() {
    throw WebDriverError.unsupportedOperation('Posting a session forward is not implemented yet');
  }

  async onPostSessionRefresh({ req }) {
    const session = this.#getSession(req);
    const device = session.device;
    await device.reloadReactNative();
  }

  async onPostSessionElement({ req }) {
    const { element, by } = this.#getSession(req);
    const matcher = this.#getMatcher(req.body, by);
    const attrs = await element(matcher).getAttributes();
    return [attrs.identifier];
  }

  onPostSessionElements() {
    throw WebDriverError.unsupportedOperation('Posting session elements is not implemented yet');
  }

  onPostSessionElementActive() {
    throw WebDriverError.unsupportedOperation('Posting an active session element is not implemented yet');
  }

  async onGetSessionElementText({ req }) {
    const { element, by } = this.#getSession(req);
    const attrs = await element(by.id(req.params.elementId)).getAttributes();
    return attrs.label;
  }

  async onGetSessionElementAttribute({ req }) {
    const { element, by } = this.#getSession(req);
    const attrs = await element(by.id(req.params.elementId)).getAttributes();
    const attributeName = req.params.attributeName;

    return attrs[attributeName];
  }

  async onPostSessionElementClick({ req }) {
    const { element, by } = this.#getSession(req);
    const id = req.params.elementId;

    await element(by.id(id)).tap();
  }

  onPostSessionElementValue() {
    throw WebDriverError.unsupportedOperation('Posting a session element value is not implemented yet');
  }

  #getMatcher(body, by) {
    const using = body.using;
    const value = body.value;

    switch (using) {
      case 'css selector':
        if (value.startsWith('*[id=')) {
          const capture = /\*\[id="([^"]+)"\]/.exec(value);
          if (!capture) {
            throw WebDriverError.invalidSelector(`Invalid css selector: ${value}`);
          }

          return by.id(capture[1]);
        } else {
          throw WebDriverError.unsupportedOperation(`Unsupported css selector: ${value}`);
        }
      case 'link text':
        return by.text(value);
      default:
        throw WebDriverError.unsupportedOperation(`Unsupported ${using}: ${value}`);
    }
  }

  async onPostSessionExecuteSync({ req }) {
    const session = this.#getSession(req);
    const script = req.body.script;

    await session.client.sendAction(JSON.parse(script));
  }

  onPostSessionExecuteAsync() {
    throw WebDriverError.unsupportedOperation('Posting a session execute async is not implemented yet');
  }

  onGetSessionCookie() {
    throw WebDriverError.unsupportedOperation('Getting a session cookie is not implemented yet');
  }

  onPostSessionCookie() {
    throw WebDriverError.unsupportedOperation('Posting a session cookie is not implemented yet');
  }

  onDeleteSessionCookie() {
    throw WebDriverError.unsupportedOperation('Deleting a session cookie is not implemented yet');
  }

  onDeleteSessionAllCookies() {
    throw WebDriverError.unsupportedOperation('Deleting all session cookies is not implemented yet');
  }

  onPostSessionAlertDismiss() {
    throw WebDriverError.unsupportedOperation('Posting a session alert dismiss is not implemented yet');
  }

  onPostSessionAlertAccept() {
    throw WebDriverError.unsupportedOperation('Posting a session alert accept is not implemented yet');
  }

  onGetSessionAlertText() {
    throw WebDriverError.unsupportedOperation('Getting a session alert text is not implemented yet');
  }

  onPostSessionAlertText() {
    throw WebDriverError.unsupportedOperation('Posting a session alert text is not implemented yet');
  }

  async onGetSessionScreenshot({ req }) {
    const { device } = this.#getSession(req);
    const filePath = await device.takeScreenshot('unknown');
    // TODO: read the file and return it as base64
    return filePath;
  }

  async onDetoxCaptureViewHierarchy({ req }) {
    const { device } = this.#getSession(req);
    const filePath = await device.captureViewHierarchy();
    // TODO: tar.gz the file
    return filePath;
  }

  async onDetoxClearKeychain({ req }) {
    const { device } = this.#getSession(req);
    await device.clearKeychain();
  }

  async onDetoxDisableSynchronization({ req }) {
    const { device } = this.#getSession(req);
    await device.disableSynchronization();
  }

  async onDetoxEnableSynchronization({ req }) {
    const { device } = this.#getSession(req);
    await device.enableSynchronization();
  }

  async onDetoxInstallApp({ req }) {
    const { device } = this.#getSession(req);
    const { binaryPath, testBinaryPath } = req.body;
    await device.installApp(binaryPath, testBinaryPath);
  }

  async onDetoxInstallUtilBinaries({ req }) {
    const { device } = this.#getSession(req);
    await device.installUtilBinaries();
  }

  async onDetoxLaunchApp({ req }) {
    const { device } = this.#getSession(req);
    const { bundleId, ...options } = req.body;
    await device.launchApp(options, bundleId);
  }

  async onDetoxMatchFace({ req }) {
    const { device } = this.#getSession(req);
    await device.matchFace();
  }

  async onDetoxMatchFinger({ req }) {
    const { device } = this.#getSession(req);
    await device.matchFinger();
  }

  async onDetoxOpenURL({ req }) {
    const { device } = this.#getSession(req);
    await device.openURL(req.body);
  }

  async onDetoxPressBack({ req }) {
    const { device } = this.#getSession(req);
    await device.pressBack();
  }

  async onDetoxReloadReactNative({ req }) {
    const { device } = this.#getSession(req);
    await device.reloadReactNative();
  }

  async onDetoxResetContentAndSettings({ req }) {
    const { device } = this.#getSession(req);
    await device.resetContentAndSettings();
  }

  async onDetoxResetStatusBar({ req }) {
    const { device } = this.#getSession(req);
    await device.resetStatusBar();
  }

  async onDetoxSelectApp({ req }) {
    const { device } = this.#getSession(req);
    const { appAlias } = req.body;
    await device.selectApp(appAlias);
  }

  async onDetoxSendToHome({ req }) {
    const { device } = this.#getSession(req);
    await device.sendToHome();
  }

  async onDetoxSendUserActivity({ req }) {
    const { device } = this.#getSession(req);
    await device.sendUserActivity(req.body);
  }

  async onDetoxSendUserNotification({ req }) {
    const { device } = this.#getSession(req);
    await device.sendUserNotification(req.body);
  }

  async onDetoxSetBiometricEnrollment({ req }) {
    const { device } = this.#getSession(req);
    const { toggle } = req.body;
    await device.setBiometricEnrollment(toggle);
  }

  async onDetoxSetLocation({ req }) {
    const { device } = this.#getSession(req);
    const { lat, lon } = req.body;
    await device.setLocation(lat, lon);
  }

  async onDetoxSetOrientation({ req }) {
    const { device } = this.#getSession(req);
    const { orientation } = req.body;
    await device.setOrientation(orientation);
  }

  async onDetoxSetStatusBar({ req }) {
    const { device } = this.#getSession(req);
    await device.setStatusBar(req.body);
  }

  async onDetoxSetURLBlacklist({ req }) {
    const { device } = this.#getSession(req);
    const { blacklist } = req.body;

    if (!Array.isArray(blacklist)) {
      throw WebDriverError.invalidArgument('blacklist should be an array');
    }

    await device.setURLBlacklist(blacklist);
  }

  async onDetoxShake({ req }) {
    const { device } = this.#getSession(req);
    await device.shake();
  }

  async onDetoxTerminateApp({ req }) {
    const { device } = this.#getSession(req);
    const { bundleId } = req.body;
    await device.terminateApp(bundleId);
  }

  async onDetoxUninstallApp({ req }) {
    const { device } = this.#getSession(req);
    const { bundleId } = req.body;
    await device.uninstallApp(bundleId);
  }

  async onDetoxUnmatchFace({ req }) {
    const { device } = this.#getSession(req);
    await device.unmatchFace();
  }

  async onDetoxUnmatchFinger({ req }) {
    const { device } = this.#getSession(req);
    await device.unmatchFinger();
  }

  async onDetoxInvoke({ req }) {
    const { client } = this.#getSession(req);

    const invoke = new actions.Invoke(req.body);
    const result = await client.sendAction(invoke);
    return result;
  }

  async onPostSessionEnableSynchronization({ req }) {
    const session = this.#getSession(req);
    const device = session.device;
    await device.enableSynchronization();
  }

  async onPostSessionDisableSynchronization({ req }) {
    const session = this.#getSession(req);
    const device = session.device;
    await device.disableSynchronization();
  }

  onUnknownCommand = (req, res) => {
    const error = WebDriverError.unknownCommand(`Unknown command: ${req.method} ${req.path}`);
    res.status(error.status).json({
      value: error.toJSON(),
    });
  };

  onWsConnection = (ws, request) => {
    const path = request.url;

    const match = /^\/session\/([^/]+)\/ws$/.exec(path);
    if (!match) {
      console.log(`Invalid path, closing connection: ${path}`);
      return ws.close();
    }

    const sessionId = match[1];
    console.log(`Established WS connection for session: ${sessionId}`);
    ws.on('message', (message) => {
      console.log(`Session message: ${message}`);
      ws.send(message);
    });

    ws.on('close', () => {
      console.log(`WS session closed: ${sessionId}`);
    });
  };
}

module.exports = WebDriver;
