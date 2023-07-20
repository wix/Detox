import { WebDriverClient } from '../webdriver';

export class InvocationManager {
  #wd: WebDriverClient;

  constructor(wd: WebDriverClient) {
    this.#wd = wd;
  }

  async execute(invocation) {
    return this.#wd.http.session.post('/detox/invoke', invocation);
  }
}
