const { execWithRetriesAndLogs } = require('detox/src/utils/childProcess/exec');

const DEFAULT_HDC_BIN = 'hdc';

class HDC {
  constructor(binary = DEFAULT_HDC_BIN) {
    this.binary = binary;
  }

  async listTargets() {
    const { stdout } = await execWithRetriesAndLogs(`${this.binary} list targets`);
    return stdout
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && l !== '[Empty]' && !l.toLowerCase().startsWith('no'));
  }

  async install(serial, hapPath) {
    return execWithRetriesAndLogs(`${this.binary} -t ${serial} install "${hapPath}"`);
  }

  async uninstall(serial, bundleId) {
    return execWithRetriesAndLogs(`${this.binary} -t ${serial} uninstall ${bundleId}`, {
      retries: 1,
    });
  }

  async shell(serial, cmd) {
    const { stdout } = await execWithRetriesAndLogs(`${this.binary} -t ${serial} shell ${cmd}`);
    return stdout;
  }

  async startAbility(serial, bundleId, abilityName, params = []) {
    const psArgs = params.map(([k, v]) => `--ps ${k} ${v}`).join(' ');
    return execWithRetriesAndLogs(
      `${this.binary} -t ${serial} shell aa start -a ${abilityName} -b ${bundleId} ${psArgs}`,
    );
  }

  async startTestAbility(serial, bundleId, moduleName = 'entry_test', testRunner = 'OpenHarmonyTestRunner', params = [], waitSeconds = 300) {
    const sArgs = params.map(([k, v]) => `-s ${k} ${v}`).join(' ');
    return execWithRetriesAndLogs(
      `${this.binary} -t ${serial} shell aa test -b ${bundleId} -m ${moduleName} -s unittest ${testRunner} ${sArgs} -s timeout ${waitSeconds * 1000} -w ${waitSeconds}`,
      { retries: 0, timeout: waitSeconds * 1000 + 30000 },
    );
  }

  async stopAbility(serial, bundleId) {
    return execWithRetriesAndLogs(`${this.binary} -t ${serial} shell aa force-stop ${bundleId}`);
  }

  async fport(serial, localPort, remotePort) {
    return execWithRetriesAndLogs(
      `${this.binary} -t ${serial} fport tcp:${localPort} tcp:${remotePort}`,
    );
  }

  async rport(serial, remotePort, localPort) {
    return execWithRetriesAndLogs(
      `${this.binary} -t ${serial} rport tcp:${remotePort} tcp:${localPort}`,
    );
  }

  async fportRm(serial, localPort, remotePort) {
    return execWithRetriesAndLogs(
      `${this.binary} -t ${serial} fport rm tcp:${localPort} tcp:${remotePort}`,
    );
  }

  async getFile(serial, remotePath, localPath) {
    return execWithRetriesAndLogs(
      `${this.binary} -t ${serial} file recv ${remotePath} ${localPath}`,
    );
  }
}

module.exports = HDC;
