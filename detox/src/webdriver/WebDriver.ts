/* eslint-disable node/no-unsupported-features/es-syntax */

import { randomUUID } from 'crypto';
import http from 'http';
import { promisify } from 'util';

import express from 'express';
import WebSocket from 'ws';

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
  onGetStatus({ req, res }) {
    return {
      name: 'detox-server',
      version: '22.0.0-alpha.0',
    };
  }

  @Command('GET', '/session')
  onGetSessionList({ req, res }) {
    return Object.keys(this.#sessions);
  }

  @Command('POST', '/session')
  async onPostSession({ req, res }) {
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
  onGetSession({ req, res }) {
    return this.#getSession(req);
  }

  @Command('DELETE', '/session/:sessionId')
  async onDeleteSession({ req, res }) {
    const session = this.#getSession(req);
    delete this.#sessions[session.sessionId];
    await session.stop();
  }

  @Command('POST', '/session/:sessionId/url')
  async onPostSessionUrl({ req, res }) {
    const url = req.body.url;
    if (!url) {
      throw WebDriverError.invalidArgument('url is required');
    }

    const session = this.#getSession(req);
    const device = session.device;
    await device.launchApp({}, url);
  }

  @Command('GET', '/session/:sessionId/url')
  onGetSessionUrl({ req, res }) {
    const session = this.#getSession(req);
    const device = session.device;
    return device._currentApp.bundleId ?? '';
  }

  @Command('POST', '/session/:sessionId/back')
  async onPostSessionBack({ req, res }) {
    const session = this.#getSession(req);
    const device = session.device;

    await device.pressBack();
  }

  @Command('POST', '/session/:sessionId/forward')
  onPostSessionForward({ req, res }) {
    throw WebDriverError.unsupportedOperation('Posting a session forward is not implemented yet');
  }

  @Command('POST', '/session/:sessionId/refresh')
  async onPostSessionRefresh({ req, res }) {
    const session = this.#getSession(req);
    const device = session.device;
    await device.reloadReactNative();
  }

  @Command('POST', '/session/:sessionId/element')
  async onPostSessionElement({ req, res }) {
    const { element, by } = this.#getSession(req);
    const matcher = this.#getMatcher(req.body, by);
    const attrs = await element(matcher).getAttributes();
    return [attrs.identifier];
  }

  @Command('POST', '/session/:sessionId/elements')
  onPostSessionElements({ req, res }) {
    throw WebDriverError.unsupportedOperation('Posting session elements is not implemented yet');
  }

  @Command('POST', '/session/:sessionId/element/active')
  onPostSessionElementActive({ req, res }) {
    throw WebDriverError.unsupportedOperation('Posting an active session element is not implemented yet');
  }

  @Command('GET', '/session/:sessionId/element/:elementId/text')
  async onGetSessionElementText({ req, res }) {
    const { element, by } = this.#getSession(req);
    const attrs = await element(by.id(req.params.elementId)).getAttributes();
    return attrs.label;
  }

  @Command('GET', '/session/:sessionId/element/:elementId/attribute/:attributeName')
  async onGetSessionElementAttribute({ req, res }) {
    const { element, by } = this.#getSession(req);
    const attrs = await element(by.id(req.params.elementId)).getAttributes();
    const attributeName = req.params.attributeName;

    return attrs[attributeName];
  }

  @Command('POST', '/session/:sessionId/element/:elementId/click')
  async onPostSessionElementClick({ req, res }) {
    const { element, by } = this.#getSession(req);
    const id = req.params.elementId;

    await element(by.id(id)).tap();
  }

  @Command('POST', '/session/:sessionId/element/:elementId/value')
  onPostSessionElementValue({ req, res }) {
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
  async onPostSessionExecuteSync({ req, res }) {
    const session = this.#getSession(req);
    const script = req.body.script;

    await session.client.sendAction(JSON.parse(script));
  }

  @Command('POST', '/session/:sessionId/execute/async')
  onPostSessionExecuteAsync({ req, res }) {
    throw WebDriverError.unsupportedOperation('Posting a session execute async is not implemented yet');
  }

  @Command('GET', '/session/:sessionId/cookie')
  onGetSessionCookie({ req, res }) {
    throw WebDriverError.unsupportedOperation('Getting a session cookie is not implemented yet');
  }

  @Command('POST', '/session/:sessionId/cookie')
  onPostSessionCookie({ req, res }) {
    throw WebDriverError.unsupportedOperation('Posting a session cookie is not implemented yet');
  }

  @Command('DELETE', '/session/:sessionId/cookie/:name')
  onDeleteSessionCookie({ req, res }) {
    throw WebDriverError.unsupportedOperation('Deleting a session cookie is not implemented yet');
  }

  @Command('DELETE', '/session/:sessionId/cookie')
  onDeleteSessionAllCookies({ req, res }) {
    throw WebDriverError.unsupportedOperation('Deleting all session cookies is not implemented yet');
  }

  @Command('POST', '/session/:sessionId/alert/dismiss')
  onPostSessionAlertDismiss({ req, res }) {
    throw WebDriverError.unsupportedOperation('Posting a session alert dismiss is not implemented yet');
  }

  @Command('POST', '/session/:sessionId/alert/accept')
  onPostSessionAlertAccept({ req, res }) {
    throw WebDriverError.unsupportedOperation('Posting a session alert accept is not implemented yet');
  }

  @Command('GET', '/session/:sessionId/alert/text')
  onGetSessionAlertText({ req, res }) {
    throw WebDriverError.unsupportedOperation('Getting a session alert text is not implemented yet');
  }

  @Command('POST', '/session/:sessionId/alert/text')
  onPostSessionAlertText({ req, res }) {
    throw WebDriverError.unsupportedOperation('Posting a session alert text is not implemented yet');
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
