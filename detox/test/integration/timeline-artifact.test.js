const path = require('path');

const _ = require('lodash');
const tempfile = require('tempfile');
const fs = require('fs-extra');
const { promisify } = require('util');
const { execCommand } = require('./utils/exec');

const TMPDIR = path.dirname(tempfile());
const readFile = promisify(fs.readFile);
const remove = promisify(fs.remove);

describe('Timeline integration test', () => {
  const artifactsDirectory = 'integration_artifacts/'
  const timelineArtifactFilename = 'detox.trace.json';
  const timelineArtifactPath = path.join(artifactsDirectory, timelineArtifactFilename);
  const clearAllArtifacts = () => remove(artifactsDirectory);
  const readTac = async () => {
    tac = JSON.parse(await readFile(timelineArtifactPath, 'utf8'));
  };

  let tac;

  describe('Flaky test', () => {
    beforeAll(clearAllArtifacts);
    beforeAll(() => execCommand(`detox test -c stub --config integration/e2e/config.js -a ${artifactsDirectory} -R 1 flaky`));
    beforeAll(readTac);

    it('should deterministically produce a timeline artifact', verifyTimelineSnapshot);

    it('should have balanced begin/end events', assertBalancedEvents);

    it('should have a credible list of categories', async () => {
      const cats = _.chain(tac)
        .flatMap(e => e.cat ? `${e.cat}`.split(',', 1) : [])
        .uniq()
        .sort()
        .value();

      expect(cats).toEqual([
        'artifacts-manager',
        'device',
        'ipc',
        'lifecycle',
        'user',
        'ws-client',
        'ws-server',
      ]);
    });

    it('should have a credible process and thread ids', async () => {
      const unique = _.mapValues({
        pid: tac.map(e => e.pid),
        tid: tac.map(e => e.tid),
        pid_tid: tac.map(e => `${e.pid}:${e.tid}`),
      }, v => _.uniq(v).sort());

      expect(unique.pid.length).toBe(3);
      expect(unique.tid.length).toBeLessThan(unique.pid_tid.length);
      expect(unique.pid_tid.length).toBeGreaterThan(10);
    });
  });

  describe('Skipped test', () => {
    beforeAll(clearAllArtifacts);
    beforeAll(() => execCommand(`detox test -c stub --config integration/e2e/config.js -a ${artifactsDirectory} -R 1 skipped`));
    beforeAll(readTac);

    it('should deterministically produce a timeline artifact', verifyTimelineSnapshot);

    it('should have balanced begin/end events', assertBalancedEvents);
  });

  describe('Focused test', () => {
    beforeAll(clearAllArtifacts);
    beforeAll(() => execCommand(`detox test -c stub --config integration/e2e/config.js -a ${artifactsDirectory} -R 1 focused`));
    beforeAll(readTac);

    it('should deterministically produce a timeline artifact', verifyTimelineSnapshot);

    it('should have balanced begin/end events', assertBalancedEvents);
  });

  function verifyTimelineSnapshot() {
    const sanitizeContext = { pid: new Map(), tid: new Map(), sessionId: '', cwd: '' };
    expect(tac.filter(isLifecycleEvent).map(sanitizeEvent.bind(sanitizeContext))).toMatchSnapshot();
  }

  function assertBalancedEvents() {
    for (const lane of _(tac).groupBy('tid').values()) {
      const beginCount = _.filter(lane, { ph: 'B' }).length;
      const endCount = _.filter(lane, { ph: 'E' }).length;
      if (beginCount !== endCount) {
        const { tid, cat } = lane[0];
        expect(`imbalanced begin (${beginCount}) vs end (${endCount}) events in thread ${tid} (category: ${cat})`).toBeNull();
      }
    }
  }
});

function isLifecycleEvent(e) {
  return `${e.cat}`.split(',').includes('lifecycle');
}

/** @this {{ pid: Map; tid: Map; sessionId: string; cwd: string; }} */
function sanitizeEvent(e, ts) {
  const r = { ...e };
  r.args = { ...r.args };

  if (ts === 0) {
    this.sessionId = r.args.data.id;
    this.cwd = r.args.cwd;
    r.name = r.name.replace(/^[^ ]*/, 'detox');
  }

  r.pid = (this.pid.has(e.pid) ? this.pid : this.pid.set(e.pid, this.pid.size)).get(e.pid);
  r.tid = (this.tid.has(e.tid) ? this.tid : this.tid.set(e.tid, this.tid.size)).get(e.tid);
  r.ts = ts;

  if (r.name) {
    r.name = r.name
      .replace(TMPDIR, '$TMPDIR')
      .replace(this.sessionId, '$SESSION_ID')
      .replace(this.cwd, '$CWD')
      .replace(this.cwd.replace(/\\/g, '/'), '$CWD')
      .replace(/\\/g, '/')
      .replace(/DETOX_[A-Z_]+=\S*\s*/g, '');
  }

  if (r.args.cwd) {
    r.args.cwd = '$CWD';
  }

  if (typeof r.args.error === 'string') {
    r.args.error = r.args.error.split('\n')[0];
  }

  if (r.args.data) {
    r.args.data = {};
  }

  if (r.args.env) {
    r.args.env = {};
  }

  return r;
}
