import { WebSocket, ClientOptions } from 'ws';

export interface WebDriverBidiClientConfig {
  sessionId: string;
  webSocketUrl: string;
  webSocketOptions?: ClientOptions;
}

export class WebDriverBiDiClient {
  public readonly ws: WebSocket;

  constructor(config: WebDriverBidiClientConfig) {
    this.ws = new WebSocket(config.webSocketUrl, config.webSocketOptions);
  }
}

