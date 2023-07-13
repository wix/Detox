import { AxiosInstance } from 'axios';
import { WebDriverBiDiClient } from './bidi';
import { WebDriverHTTPClient } from './http';

export interface WebDriverClientConfig {
  fetch: AxiosInstance;
  sessionId: string;
  capabilities: {
    webSocketUrl?: string;
    [key: string]: any;
  };
}

export class WebDriverClient {
  bidi?: WebDriverBiDiClient;
  http: WebDriverHTTPClient;

  constructor(config: WebDriverClientConfig) {
    this.http = new WebDriverHTTPClient(config);

    if (config.capabilities.webSocketUrl) {
      this.bidi = new WebDriverBiDiClient({
        sessionId: config.sessionId,
        webSocketUrl: config.capabilities.webSocketUrl,
      });
    }
  }
}
