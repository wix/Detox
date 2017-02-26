const log = require('npmlog');
const AsyncWebSocket = require('./AsyncWebSocket');
const actions = require('./actions/actions');
//const Queue = require('../commons/dataStructures').Queue;

class Client {
  constructor(config) {
    this.configuration = config;
    this.ws = new AsyncWebSocket(config.server);
    this.messageCounter = 0;
  }

  async connect() {
    await this.ws.open();
    return await this.sendAction(new actions.Login(this.configuration.sessionId));
  }

  //async sendAction(type, params) {
  //  const json = {
  //      type: type,
  //      params: params
  //    };
  //  const response = await this.ws.send(json);
  //  log.silly(`ws sendAction (tester):`, `${json}`);
  //  log.silly(`ws response:`, response);
  //  console.log(response);
  //  return response;
  //}
  
  async sendAction(action) {
    const response = await this.ws.send(action);
    return await action.handle(response);
  }
}

module.exports = Client;