import axios, { AxiosInstance } from 'axios';
import { WebDriverFetchWrapper } from './WebDriverFetchWrapper';

export interface WebDriverHTTPClientConfig {
  fetch: AxiosInstance;
  sessionId: string;
}

export class WebDriverHTTPClient {
  public readonly session: WebDriverFetchWrapper;

  constructor(
    config: WebDriverHTTPClientConfig,
  ) {
    const sessionFetch = axios.create({
      ...config.fetch.defaults,
      baseURL: `${config.fetch.defaults.baseURL}/session/${config.sessionId}`,
    });

    this.session = new WebDriverFetchWrapper(sessionFetch);
  }

  async destroy() {
    return this.session.delete();
  }

  async getTimeouts() {
    return this.session.get('/timeouts');
  }

  async setTimeouts(timeouts: any) {
    return this.session.post(`/timeouts`, timeouts);
  }

  async navigateTo(url: string) {
    return this.session.post('/url', { url });
  }

  async getCurrentUrl() {
    return this.session.get('/url');
  }

  async goBack() {
    return this.session.post('/back');
  }

  async goForward() {
    return this.session.post('/forward');
  }

  async refreshPage() {
    return this.session.post('/refresh');
  }

  async getPageTitle() {
    return this.session.get('/title');
  }

  async getWindowHandle() {
    return this.session.get('/window');
  }

  async closeWindow() {
    return this.session.delete('/window');
  }

  async switchToWindow(windowHandle: string) {
    return this.session.post('/window', { handle: windowHandle });
  }

  async getWindowHandles() {
    return this.session.get('/window/handles');
  }

  async newWindow(type: string) {
    return this.session.post('/window/new', { type });
  }

  async switchToFrame(frameId: string) {
    return this.session.post('/frame', { id: frameId });
  }

  async switchToParentFrame() {
    return this.session.post('/frame/parent');
  }

  async getWindowRect() {
    return this.session.get('/window/rect');
  }

  async setWindowRect(rect: any) {
    return this.session.post('/window/rect', { rect });
  }

  async maximizeWindow() {
    return this.session.post('/window/maximize');
  }

  async minimizeWindow() {
    return this.session.post('/window/minimize');
  }

  async fullscreenWindow() {
    return this.session.post('/window/fullscreen');
  }

  async getActiveElement() {
    return this.session.get('/element/active');
  }

  async getElementShadowRoot(elementId: string) {
    return this.session.get(`/element/${elementId}/shadow`);
  }

  async findElement(locatorStrategy: string, locatorValue: string) {
    return this.session.post('/element', { using: locatorStrategy, value: locatorValue });
  }

  async findElements(locatorStrategy: string, locatorValue: string) {
    return this.session.post('/elements', { using: locatorStrategy, value: locatorValue });
  }

  async findElementFromElement(elementId: string, locatorStrategy: string, locatorValue: string) {
    return this.session.post(`/element/${elementId}/element`, { using: locatorStrategy, value: locatorValue });
  }

  async findElementsFromElement(elementId: string, locatorStrategy: string, locatorValue: string) {
    return this.session.post(`/element/${elementId}/elements`, { using: locatorStrategy, value: locatorValue });
  }

  async findElementFromShadowRoot(shadowRootId: string, locatorStrategy: string, locatorValue: string) {
    return this.session.post(`/shadow/${shadowRootId}/element`, { using: locatorStrategy, value: locatorValue });
  }

  async findElementsFromShadowRoot(shadowRootId: string, locatorStrategy: string, locatorValue: string) {
    return this.session.post(`/shadow/${shadowRootId}/elements`, { using: locatorStrategy, value: locatorValue });
  }

  async isElementSelected(elementId: string) {
    return this.session.get(`/element/${elementId}/selected`);
  }

  async getElementAttribute(elementId: string, attributeName: string) {
    return this.session.get(`/element/${elementId}/attribute/${attributeName}`);
  }

  async getElementProperty(elementId: string, propertyName: string) {
    return this.session.get(`/element/${elementId}/property/${propertyName}`);
  }

  async getElementCSSValue(elementId, propertyName) {
    return this.session.get(`/element/${elementId}/css/${propertyName}`);
  }

  async getElementText(elementId) {
    return this.session.get(`/element/${elementId}/text`);
  }

  async getElementTagName(elementId) {
    return this.session.get(`/element/${elementId}/name`);
  }

  async getElementRect(elementId) {
    return this.session.get(`/element/${elementId}/rect`);
  }

  async isElementEnabled(elementId) {
    return this.session.get(`/element/${elementId}/enabled`);
  }

  async getComputedRole(elementId) {
    return this.session.get(`/element/${elementId}/computedrole`);
  }

  async getComputedLabel(elementId) {
    return this.session.get(`/element/${elementId}/computedlabel`);
  }

  async clickElement(elementId) {
    return this.session.post(`/element/${elementId}/click`);
  }

  async clearElement(elementId) {
    return this.session.post(`/element/${elementId}/clear`);
  }

  async sendKeysToElement(elementId, keys) {
    return this.session.post(`/element/${elementId}/value`, { text: keys });
  }

  async getPageSource() {
    return this.session.get('/source');
  }

  async executeSyncScript(script, args) {
    return this.session.post(`/execute/sync`, { script, args });
  }

  async executeAsyncScript(script, args) {
    return this.session.post(`/execute/async`, { script, args });
  }

  async getAllCookies() {
    return this.session.get('/cookie');
  }

  async getNamedCookie(cookieName) {
    return this.session.get(`/cookie/${cookieName}`);
  }

  async addCookie(cookie) {
    return this.session.post(`/cookie`, { cookie });
  }

  async deleteCookie(cookieName) {
    return this.session.delete(`/cookie/${cookieName}`);
  }

  async deleteAllCookies() {
    return this.session.delete('/cookie');
  }

  async performActions(actions) {
    return this.session.post('/actions', { actions });
  }

  async releaseActions() {
    return this.session.delete('/actions');
  }

  async dismissAlert() {
    return this.session.post('/alert/dismiss');
  }

  async acceptAlert() {
    return this.session.post('/alert/accept');
  }

  async getAlertText() {
    return this.session.get('/alert/text');
  }

  async sendAlertText(text) {
    return this.session.post('/alert/text', { text });
  }

  async takeScreenshot() {
    return this.session.get('/screenshot');
  }

  async takeElementScreenshot(elementId) {
    return this.session.get(`/element/${elementId}/screenshot`);
  }

  async printPage() {
    return this.session.post('/print');
  }
}
