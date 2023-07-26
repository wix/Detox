const chalk = require('chalk');

// @ts-ignore
const bold = chalk.bold;

function getMaxWidth(text) {
  const lines = text.split('\n');
  return lines.reduce((acc, line) => Math.max(acc, line.length), 0);
}

function centerText(text, maxWidth = getMaxWidth(text)) {
  return text
    .split('\n')
    .map(line => {
      const padStart = Math.max(0, Math.floor((maxWidth - line.length) / 2));
      const padEnd = Math.max(0, maxWidth - line.length - padStart);
      return ' '.repeat(padStart) + line + ' '.repeat(padEnd);
    })
    .join('\n');
}

const header = `\
=========================  THE NEW JOURNEY BEGINS  =============================`;

console.error(centerText(`\

${bold(header)}

https://wix.github.io/Detox/docs/guide/migration

Sorry to say that Detox 20 comes without old adapters for Jest.
You have to rearrange your init code before you can continue your journey.

Navigate to the link and follow the migration guide steps.

Sincerely yours,
Detox team.

${bold(header)}

`, header.length));

const error = new Error('\nPlease follow the migration guide:\nhttps://wix.github.io/Detox/docs/guide/migration\n\n');
error.stack = '';
throw error;
