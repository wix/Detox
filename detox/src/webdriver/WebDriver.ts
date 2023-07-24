/* eslint-disable node/no-unsupported-features/es-syntax */

import { randomUUID } from 'crypto';
import http from 'http';
import { promisify } from 'util';

import express from 'express';
import WebSocket from 'ws';

import actions from '../client/actions/actions';
import DeviceRegistry from '../devices/DeviceRegistry';
import DetoxServer from '../server/DetoxServer';

import { WebDriverSession } from './WebDriverSession';
import { WebDriverError } from './errors';
import { Command, addRoutes, hasRoute } from './express-utils';

export class WebDriverServer {
  #express;
  #expressServer;
  #wss;
  #appGateway;
  #options;
  #sessions = {};

  constructor(options) {
    this.#options = options;
    this.#express = addRoutes(this, express().use(express.json()))
      .use(this.onUnknownMethod)
      .use(this.onUnknownCommand);

    this.#expressServer = http.createServer(this.#express);
    this.#wss = new WebSocket.Server({ server: this.#expressServer });
    this.#wss.on('connection', this.onWsConnection);
    this.#appGateway = new DetoxServer({
      port: 8099,
      standalone: true,
    });
  }

  async startServer() {
    await Promise.all([
      DeviceRegistry.forIOS().reset(),
      DeviceRegistry.forAndroid().reset(),
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

  #listen = promisify((callback) => this.#expressServer.listen(this.#options.port, callback));

  #close = promisify((callback) => this.#expressServer.close(callback));

  @Command('GET', '/status')
  onGetStatus() {
    return {
      name: 'detox-server',
      version: '22.0.0-alpha.0',
    };
  }

  @Command('GET', '/session')
  onGetSessionList() {
    return Object.keys(this.#sessions);
  }

  @Command('POST', '/session')
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

  @Command('GET', '/session/:sessionId')
  onGetSession({ req }) {
    return this.#getSession(req);
  }

  @Command('DELETE', '/session/:sessionId')
  async onDeleteSession({ req }) {
    const session = this.#getSession(req);
    delete this.#sessions[session.sessionId];
    await session.stop();
  }

  @Command('POST', '/session/:sessionId/url')
  async onPostSessionUrl({ req }) {
    const url = req.body.url;
    if (!url) {
      throw WebDriverError.invalidArgument('url is required');
    }

    const session = this.#getSession(req);
    const device = session.device;
    await device.launchApp({}, url);
  }

  @Command('GET', '/session/:sessionId/url')
  onGetSessionUrl({ req }) {
    const session = this.#getSession(req);
    const device = session.device;
    return device._currentApp.bundleId ?? '';
  }

  @Command('POST', '/session/:sessionId/back')
  async onPostSessionBack({ req }) {
    const session = this.#getSession(req);
    const device = session.device;

    await device.pressBack();
  }

  @Command('POST', '/session/:sessionId/forward')
  onPostSessionForward() {
    throw WebDriverError.unsupportedOperation('Posting a session forward is not implemented yet');
  }

  @Command('POST', '/session/:sessionId/refresh')
  async onPostSessionRefresh({ req }) {
    const session = this.#getSession(req);
    const device = session.device;
    await device.reloadReactNative();
  }

  @Command('POST', '/session/:sessionId/element')
  async onPostSessionElement({ req }) {
    const { element, by } = this.#getSession(req);
    const matcher = this.#getMatcher(req.body, by);
    const attrs = await element(matcher).getAttributes();
    return [attrs.identifier];
  }

  @Command('POST', '/session/:sessionId/elements')
  onPostSessionElements() {
    throw WebDriverError.unsupportedOperation('Posting session elements is not implemented yet');
  }

  @Command('POST', '/session/:sessionId/element/active')
  onPostSessionElementActive() {
    throw WebDriverError.unsupportedOperation('Posting an active session element is not implemented yet');
  }

  @Command('GET', '/session/:sessionId/element/:elementId/text')
  async onGetSessionElementText({ req }) {
    const { element, by } = this.#getSession(req);
    const attrs = await element(by.id(req.params.elementId)).getAttributes();
    return attrs.label;
  }

  @Command('GET', '/session/:sessionId/element/:elementId/attribute/:attributeName')
  async onGetSessionElementAttribute({ req }) {
    const { element, by } = this.#getSession(req);
    const attrs = await element(by.id(req.params.elementId)).getAttributes();
    const attributeName = req.params.attributeName;

    return attrs[attributeName];
  }

  @Command('POST', '/session/:sessionId/element/:elementId/click')
  async onPostSessionElementClick({ req }) {
    const { element, by } = this.#getSession(req);
    const id = req.params.elementId;

    await element(by.id(id)).tap();
  }

  @Command('POST', '/session/:sessionId/element/:elementId/value')
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

  @Command('POST', '/session/:sessionId/execute/sync')
  async onPostSessionExecuteSync({ req }) {
    const session = this.#getSession(req);
    const script = req.body.script;

    await session.client.sendAction(JSON.parse(script));
  }

  @Command('POST', '/session/:sessionId/execute/async')
  onPostSessionExecuteAsync() {
    throw WebDriverError.unsupportedOperation('Posting a session execute async is not implemented yet');
  }

  @Command('GET', '/session/:sessionId/cookie')
  onGetSessionCookie() {
    throw WebDriverError.unsupportedOperation('Getting a session cookie is not implemented yet');
  }

  @Command('POST', '/session/:sessionId/cookie')
  onPostSessionCookie() {
    throw WebDriverError.unsupportedOperation('Posting a session cookie is not implemented yet');
  }

  @Command('DELETE', '/session/:sessionId/cookie/:name')
  onDeleteSessionCookie() {
    throw WebDriverError.unsupportedOperation('Deleting a session cookie is not implemented yet');
  }

  @Command('DELETE', '/session/:sessionId/cookie')
  onDeleteSessionAllCookies() {
    throw WebDriverError.unsupportedOperation('Deleting all session cookies is not implemented yet');
  }

  @Command('POST', '/session/:sessionId/alert/dismiss')
  onPostSessionAlertDismiss() {
    throw WebDriverError.unsupportedOperation('Posting a session alert dismiss is not implemented yet');
  }

  @Command('POST', '/session/:sessionId/alert/accept')
  onPostSessionAlertAccept() {
    throw WebDriverError.unsupportedOperation('Posting a session alert accept is not implemented yet');
  }

  @Command('GET', '/session/:sessionId/alert/text')
  onGetSessionAlertText() {
    throw WebDriverError.unsupportedOperation('Getting a session alert text is not implemented yet');
  }

  @Command('POST', '/session/:sessionId/alert/text')
  onPostSessionAlertText() {
    throw WebDriverError.unsupportedOperation('Posting a session alert text is not implemented yet');
  }

  @Command('GET', '/session/:sessionId/screenshot')
  async onGetSessionScreenshot({ req }) {
    const { device } = this.#getSession(req);
    const filePath = await device.takeScreenshot('unknown');
    // TODO: read the file and return it as base64
    return filePath;
  }

  @Command('POST', '/session/:sessionId/detox/captureViewHierarchy')
  async onDetoxCaptureViewHierarchy({ req }) {
    const { device } = this.#getSession(req);
    const filePath = await device.captureViewHierarchy();
    // TODO: tar.gz the file
    return filePath;
  }

  @Command('POST', '/session/:sessionId/detox/clearKeychain')
  async onDetoxClearKeychain({ req }) {
    const { device } = this.#getSession(req);
    await device.clearKeychain();
  }

  @Command('POST', '/session/:sessionId/detox/disableSynchronization')
  async onDetoxDisableSynchronization({ req }) {
    const { device } = this.#getSession(req);
    await device.disableSynchronization();
  }

  @Command('POST', '/session/:sessionId/detox/enableSynchronization')
  async onDetoxEnableSynchronization({ req }) {
    const { device } = this.#getSession(req);
    await device.enableSynchronization();
  }

  @Command('POST', '/session/:sessionId/detox/installApp')
  async onDetoxInstallApp({ req }) {
    const { device } = this.#getSession(req);
    const { binaryPath, testBinaryPath } = req.body;
    await device.installApp(binaryPath, testBinaryPath);
  }

  @Command('POST', '/session/:sessionId/detox/installUtilBinaries')
  async onDetoxInstallUtilBinaries({ req }) {
    const { device } = this.#getSession(req);
    await device.installUtilBinaries();
  }

  @Command('POST', '/session/:sessionId/detox/launchApp')
  async onDetoxLaunchApp({ req }) {
    const { device } = this.#getSession(req);
    const { bundleId, ...options } = req.body;
    await device.launchApp(options, bundleId);
  }

  @Command('POST', '/session/:sessionId/detox/matchFace')
  async onDetoxMatchFace({ req }) {
    const { device } = this.#getSession(req);
    await device.matchFace();
  }

  @Command('POST', '/session/:sessionId/detox/matchFinger')
  async onDetoxMatchFinger({ req }) {
    const { device } = this.#getSession(req);
    await device.matchFinger();
  }

  @Command('POST', '/session/:sessionId/detox/openURL')
  async onDetoxOpenURL({ req }) {
    const { device } = this.#getSession(req);
    await device.openURL(req.body);
  }

  @Command('POST', '/session/:sessionId/detox/pressBack')
  async onDetoxPressBack({ req }) {
    const { device } = this.#getSession(req);
    await device.pressBack();
  }

  @Command('POST', '/session/:sessionId/detox/reloadReactNative')
  async onDetoxReloadReactNative({ req }) {
    const { device } = this.#getSession(req);
    await device.reloadReactNative();
  }

  @Command('POST', '/session/:sessionId/detox/resetContentAndSettings')
  async onDetoxResetContentAndSettings({ req }) {
    const { device } = this.#getSession(req);
    await device.resetContentAndSettings();
  }

  @Command('POST', '/session/:sessionId/detox/resetStatusBar')
  async onDetoxResetStatusBar({ req }) {
    const { device } = this.#getSession(req);
    await device.resetStatusBar();
  }

  @Command('POST', '/session/:sessionId/detox/selectApp')
  async onDetoxSelectApp({ req }) {
    const { device } = this.#getSession(req);
    const { appAlias } = req.body;
    await device.selectApp(appAlias);
  }

  @Command('POST', '/session/:sessionId/detox/sendToHome')
  async onDetoxSendToHome({ req }) {
    const { device } = this.#getSession(req);
    await device.sendToHome();
  }

  @Command('POST', '/session/:sessionId/detox/sendUserActivity')
  async onDetoxSendUserActivity({ req }) {
    const { device } = this.#getSession(req);
    await device.sendUserActivity(req.body);
  }

  @Command('POST', '/session/:sessionId/detox/sendUserNotification')
  async onDetoxSendUserNotification({ req }) {
    const { device } = this.#getSession(req);
    await device.sendUserNotification(req.body);
  }

  @Command('POST', '/session/:sessionId/detox/setBiometricEnrollment')
  async onDetoxSetBiometricEnrollment({ req }) {
    const { device } = this.#getSession(req);
    const { toggle } = req.body;
    await device.setBiometricEnrollment(toggle);
  }

  @Command('POST', '/session/:sessionId/detox/setLocation')
  async onDetoxSetLocation({ req }) {
    const { device } = this.#getSession(req);
    const { lat, lon } = req.body;
    await device.setLocation(lat, lon);
  }

  @Command('POST', '/session/:sessionId/detox/setOrientation')
  async onDetoxSetOrientation({ req }) {
    const { device } = this.#getSession(req);
    const { orientation } = req.body;
    await device.setOrientation(orientation);
  }

  @Command('POST', '/session/:sessionId/detox/setStatusBar')
  async onDetoxSetStatusBar({ req }) {
    const { device } = this.#getSession(req);
    await device.setStatusBar(req.body);
  }

  @Command('POST', '/session/:sessionId/detox/setURLBlacklist')
  async onDetoxSetURLBlacklist({ req }) {
    const { device } = this.#getSession(req);
    const { blacklist } = req.body;

    if (!Array.isArray(blacklist)) {
      throw WebDriverError.invalidArgument('blacklist should be an array');
    }

    await device.setURLBlacklist(blacklist);
  }

  @Command('POST', '/session/:sessionId/detox/shake')
  async onDetoxShake({ req }) {
    const { device } = this.#getSession(req);
    await device.shake();
  }

  @Command('POST', '/session/:sessionId/detox/terminateApp')
  async onDetoxTerminateApp({ req }) {
    const { device } = this.#getSession(req);
    const { bundleId } = req.body;
    await device.terminateApp(bundleId);
  }

  @Command('POST', '/session/:sessionId/detox/uninstallApp')
  async onDetoxUninstallApp({ req }) {
    const { device } = this.#getSession(req);
    const { bundleId } = req.body;
    await device.uninstallApp(bundleId);
  }

  @Command('POST', '/session/:sessionId/detox/unmatchFace')
  async onDetoxUnmatchFace({ req }) {
    const { device } = this.#getSession(req);
    await device.unmatchFace();
  }

  @Command('POST', '/session/:sessionId/detox/unmatchFinger')
  async onDetoxUnmatchFinger({ req }) {
    const { device } = this.#getSession(req);
    await device.unmatchFinger();
  }

  @Command('POST', '/session/:sessionId/detox/invoke')
  async onDetoxInvoke({ req }) {
    const { client } = this.#getSession(req);

    const invoke = new actions.Invoke(req.body);
    const result = await client.sendAction(invoke);
    return result;
  }

  @Command('POST', '/session/:sessionId/detox/enableSynchronization')
  async onPostSessionEnableSynchronization({ req }) {
    const session = this.#getSession(req);
    const device = session.device;
    await device.enableSynchronization();
  }

  @Command('POST', '/session/:sessionId/detox/disableSynchronization')
  async onPostSessionDisableSynchronization({ req }) {
    const session = this.#getSession(req);
    const device = session.device;
    await device.disableSynchronization();
  }

  onUnknownMethod = (req, res, next) => {
    if (hasRoute(this, req.path)) {
      const error = WebDriverError.unknownMethod(`Unknown method ${req.method} for route: ${req.path}`);
      return res.status(error.status).json({
        value: error.toJSON(),
      });
    }

    next();
  };

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
