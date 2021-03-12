const Telnet = require('telnet-client');
const path = require('path');
const os = require('os');
const fs = require('fs-extra');
const log = require('../../utils/logger').child({ __filename });

class EmulatorTelnet {
  constructor() {
    this.connection = new Telnet();
    this.connection.on('timeout', () => log.error({ event: 'TELNET_TIMEOUT' }));
    this.connection.on('error', (err) => log.error({ event: 'TELNET_ERROR', err }));
  }

  async connect(port) {
    const params = {
      host: 'localhost',
      port: port,
      shellPrompt: /^OK$/m,
      timeout: 1500,
      execTimeout: 1500,
      sendTimeout: 1500,
      echoLines: -2,
      stripShellPrompt: true
    };

    log.trace({ event: 'TELNET_CONNECTING' }, `port: ${port}, host: ${params.host}`);
    await this.connection.connect(params);
    const auth = await fs.readFile(path.join(os.homedir(), '.emulator_console_auth_token'), 'utf8');
    await this.exec(`auth ${auth}`);
  }

  async exec(command) {
    let res = await this.connection.exec(`${command}`);
    res = res.split('\n')[0];
    return res;
  }

  async shell(command) {
    return new Promise((resolve, reject) => {
      this.connection.shell((error, stream) => {
        stream.write(`${command}\n`);
        stream.on('data', (data) => {
            const result = data.toString();
            if (result.includes('\n')) {
              resolve(result);
            }
          }
        );
      });
    });
  }

  async avdName() {
    return this.exec('avd name');
  }

  async kill() {
    await this.shell('kill');
    await this.quit();
  }

  async quit() {
    await this.connection.end();
    await this.connection.destroy();
  }

  async rotate() {
    return this.shell('rotate');
  }
}

module.exports = EmulatorTelnet;
