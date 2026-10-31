const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderNotes } = require('./notes.cjs');

const sha = 'a'.repeat(40);
const commit = (n, subject, pr) => ({ sha: String(n).repeat(40).slice(0, 40), subject, pr });
const pr = (number, login = 'contributor') => ({ number, user: { login } });

test('groups feat/fix commits by platform scope and omits other types', () => {
  const markdown = renderNotes({
    version: '20.52.0',
    previousTag: '20.51.4',
    sourceSha: sha,
    commits: [
      commit(1, 'feat(ios): implement regex support for toHaveText', pr(4960)),
      commit(2, 'fix(android): quote adb device serials (#4950)', pr(4950, 'dev')),
      commit(3, 'fix(types): allow regex in toHaveText'),
      commit(4, 'feat: accept RegExp for URL blacklist (#4959)'),
      commit(5, 'fix(ios,android): shared fix (#4951)'),
      commit(6, 'chore: bump DetoxSync'),
      commit(7, 'docs(ios): explain things'),
      commit(8, 'Update package.json version to 20.51.4 [buildkite skip]'),
      commit(9, 'Bugfix/ascii swift fix (#4948)'),
    ],
  });
  assert.match(markdown, /compare\/20\.51\.4\.\.\.[a-f0-9]{40}/);
  assert.match(
    markdown,
    /## iOS\n\n### Features\n\n- Implement regex support for toHaveText \(\[#4960\]\(https:\/\/github\.com\/wix\/Detox\/pull\/4960\)\) — @contributor/
  );
  assert.match(markdown, /## Android\n\n### Fixes\n\n- Quote adb device serials \(\[#4950\][^\n]*@dev/);
  assert.match(
    markdown,
    /## General\n\n### Features\n\n- Accept RegExp for URL blacklist \(\[#4959\][^\n]*\n\n### Fixes\n\n- Allow regex in toHaveText \(\[3{9}\]\(https:\/\/github\.com\/wix\/Detox\/commit\/3{40}\)\)\n- Shared fix/
  );
  assert.doesNotMatch(markdown, /DetoxSync|explain|package\.json|ascii/i);
  assert.ok(markdown.indexOf('## iOS') < markdown.indexOf('## Android'));
  assert.ok(markdown.indexOf('## Android') < markdown.indexOf('## General'));
});

test('deduplicates commits of one PR and renders nothing but the header without entries', () => {
  const markdown = renderNotes({
    version: '20.52.0',
    previousTag: '',
    sourceSha: sha,
    commits: [commit(1, 'fix: one', pr(8)), commit(2, 'fix: two', pr(8)), commit(3, 'test: x')],
  });
  assert.equal((markdown.match(/\/pull\/8\)/g) || []).length, 1);
  assert.doesNotMatch(markdown, /two|Full changes/);
  assert.equal(
    renderNotes({ version: '1.0.0', previousTag: '', sourceSha: sha, commits: [] }).trim().split('\n').length,
    3
  );
});

test('escapes subject, author, and version content and uses the requested canonical repository', () => {
  const markdown = renderNotes({
    version: '8.9.0<script>',
    previousTag: 'release/8.8.9',
    sourceSha: sha,
    repository: 'example/project',
    commits: [
      commit(2, 'fix: bad ](https://evil.test) <img src=x> **title**', {
        number: 2,
        user: { login: 'name](javascript:alert(1))' },
      }),
    ],
  });
  assert.match(markdown, /# 8\.9\.0&lt;script&gt;/);
  assert.match(markdown, /https:\/\/github\.com\/example\/project\/pull\/2/);
  assert.match(markdown, /Bad \\\]\\\(https:\/\/evil\.test\\\)/);
  assert.match(markdown, /&lt;img src=x&gt;/);
  assert.match(markdown, /\\\*\\\*title\\\*\\\*/);
  assert.match(markdown, /@name\\\]\\\(javascript:alert\\\(1\\\)\\\)/);
});
