import { appendFile } from 'fs/promises';
const bundlePath = `${process.argv[2]}`;

async function bloatBundle() {
  const garbageToAppend = `/* ${ 'junk '.repeat(50000) } */`
  await appendFile(bundlePath, garbageToAppend, 'utf8');
}

setTimeout(() => {
  console.error('Bundle bloat timed out');
  process.exit(1);
}, 3000);

try {
  await bloatBundle();
  console.log('Bundle bloated');
  process.exit(0);
} catch (error) {
  console.error('Bundle bloat failed', error);
  process.exit(1);
}
