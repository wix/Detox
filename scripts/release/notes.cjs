const adapter = require('./detox.cjs');

// Conventional commits: only feat/fix reach the notes; docs, ci, chore, test, etc. are omitted.
const TYPES = { feat: 'Features', fix: 'Fixes' };
const PLATFORMS = { ios: 'iOS', android: 'Android' };
const CONVENTIONAL = /^(\w+)(?:\(([^)]*)\))?!?:\s*(.+)$/;

function escapeMarkdown(value) {
  return String(value ?? '')
    .replace(/[<>]/g, (char) => (char === '<' ? '&lt;' : '&gt;'))
    .replace(/[\\`*_{}\[\]()#+!|~]/g, '\\$&');
}

function parseCommit({ sha, subject, pr }) {
  const match = CONVENTIONAL.exec(String(subject ?? '').trim());
  if (!match || !TYPES[match[1].toLowerCase()]) return null;
  const scopes = (match[2] || '').toLowerCase().split(/[\s,/]+/).filter(Boolean);
  const platforms = [...new Set(scopes.filter((scope) => PLATFORMS[scope]))];
  const description = match[3].replace(/\s*\(#(\d+)\)$/, '');
  const number = pr?.number ?? Number(/\(#(\d+)\)$/.exec(match[3])?.[1]);
  return {
    sha,
    type: TYPES[match[1].toLowerCase()],
    platform: platforms.length === 1 ? PLATFORMS[platforms[0]] : 'General',
    description: description.charAt(0).toUpperCase() + description.slice(1),
    number: Number.isSafeInteger(number) && number > 0 ? number : null,
    author: pr?.user?.login,
  };
}

function renderEntry(entry, repository) {
  const link = entry.number
    ? `[#${entry.number}](https://github.com/${repository}/pull/${entry.number})`
    : `[${entry.sha.slice(0, 9)}](https://github.com/${repository}/commit/${entry.sha})`;
  const author = entry.author ? ` — @${escapeMarkdown(entry.author)}` : '';
  return `- ${escapeMarkdown(entry.description)} (${link})${author}`;
}

function renderNotes({ version, previousTag, sourceSha, commits, repository = adapter.repository }) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new TypeError('Invalid GitHub repository');
  if (typeof version !== 'string' || !version) throw new TypeError('A release version is required');
  if (!/^[a-f0-9]{40}$/i.test(sourceSha))
    throw new TypeError('A full source commit SHA is required');

  const entries = [];
  const seen = new Set();
  for (const entry of (commits || []).map(parseCommit).filter(Boolean)) {
    const key = entry.number ? `#${entry.number}` : entry.sha;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push(entry);
  }

  const lines = [
    `# ${escapeMarkdown(version)}`,
    '',
    `Source commit: [${sourceSha}](https://github.com/${repository}/commit/${sourceSha})`,
  ];
  if (previousTag) {
    lines.push(
      `Full changes: [${escapeMarkdown(
        previousTag
      )}...${sourceSha}](https://github.com/${repository}/compare/${encodeURIComponent(
        previousTag
      )}...${sourceSha})`
    );
  }
  for (const platform of [...Object.values(PLATFORMS), 'General']) {
    const group = entries.filter((entry) => entry.platform === platform);
    if (!group.length) continue;
    lines.push('', `## ${platform}`);
    for (const type of Object.values(TYPES)) {
      const typed = group.filter((entry) => entry.type === type);
      if (!typed.length) continue;
      lines.push('', `### ${type}`, '', ...typed.map((entry) => renderEntry(entry, repository)));
    }
  }
  return `${lines.join('\n')}\n`;
}

module.exports = { renderNotes };
