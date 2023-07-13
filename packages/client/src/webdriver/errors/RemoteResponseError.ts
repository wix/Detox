import { AxiosResponse } from 'axios';

export class RemoteResponseError extends Error {
  readonly data: unknown;

  constructor(axiosResponse: AxiosResponse) {
    super(`Received HTTP ${axiosResponse.status}: ${axiosResponse.statusText} from: ${axiosResponse.config.url}`);
    this.name = 'RemoteResponseError';
    this.data = axiosResponse.data;
  }
}
