#!/usr/bin/env zx

async function main({ olderThan }) {
  const now = new Date();
  const surgeListOutput = await $`FORCE_COLOR=0 surge list`;
  const lines = surgeListOutput.stdout.split('\n');
  for (let line of lines) {
    const parts = line.trim().split(/\s+/);
    const domain = parts[1];
    if (!domain || !domain.startsWith('allure-report-')) {
      continue;
    }

    const creationDateStr = domain.split('-')[2] // Extract YYYYMMDDHHMMSS
    const creationDate = new Date(
      creationDateStr.slice(0, 4),
      creationDateStr.slice(4, 6) - 1,
      creationDateStr.slice(6, 8),
      creationDateStr.slice(8, 10),
      creationDateStr.slice(10, 12),
      creationDateStr.slice(12, 14)
    )

    const daysDifference = (now - creationDate) / (1000 * 60 * 60 * 24);
    if (daysDifference > olderThan) {
      console.log(`Deleting ${domain}`)
      await $`surge teardown ${domain}`
    }
  }
}

await main({
  olderThan: argv.olderThan ?? 10,
});
