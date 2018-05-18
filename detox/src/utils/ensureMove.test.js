const _ = require('lodash');
const fs = require('fs');
const tempfile = require('tempfile');
const ensureMove = require('./ensureMove');

describe(ensureMove, () => {
  it('should move file from one location to another', async () => {
    const txt = tempfile('.txt');
    const log = tempfile('.log');
    const content = String(Math.random());

    fs.writeFileSync(txt, content);
    await ensureMove(txt, log);

    expect(fs.readFileSync(log, 'utf8')).toBe(content);
    _.attempt(() => fs.unlinkSync(log));
  });
});
