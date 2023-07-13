import { AxiosInstance } from 'axios';
import { RemoteWebDriverError } from '../errors/RemoteWebDriverError';
import { RemoteResponseError } from '../errors/RemoteResponseError';

export class WebDriverFetchWrapper {
  #fetch: AxiosInstance;

  constructor(fetch: AxiosInstance) {
    this.#fetch = fetch;
  }

  async fetch(url, options) {
    const response = await this.#fetch(url, options).catch((err) => {
      if (err.response) {
        return err.response;
      }
      throw err;
    });

    if (response.status >= 400 && response.status < 600) {
      if (response.data.value) {
        throw new RemoteWebDriverError(response.data.value);
      } else {
        throw new RemoteResponseError(response);
      }
    }

    return response.data.value;
  }

  async get(url = '') {
    return this.fetch(url, { method: 'GET' });
  }

  async post(url = '', data = undefined) {
    return this.fetch(url, { method: 'POST', data });
  }

  async delete(url = '') {
    return this.fetch(url, { method: 'DELETE' });
  }
}
