import detox from 'detox/internals.js';

function printVariousMessages() {
  process.stdout.write('=== START OF THE TEST ===\n\n')
  console.assert('foo' === 'bar', 'foo is not bar');
  console.error('console.error', 10, { a: 1 });
  console.warn('console.warn', 20, { b: 2 });
  console.log('console.log', 30, { c: 3 });
  console.info('console.info', 30, { d: 4 });
  console.debug('console.debug', 40, { e: 5 });
  console.trace('console.trace', 50, { f: 6 });

  console.log('formatDecimal(%d)', 42);

  const metadata = { error: new Error('Sample error') };
  console.log(metadata, 'An error was caught.');
  console.log('An error was caught:', metadata);
  process.stdout.write('\n=== END OF THE TEST ===\n\n')
}

async function testPlain() {
  printVariousMessages();
}

async function testWithDetox(loglevel) {
  try {
    await detox.init({
      workerId: null,
      override: {
        selectedConfiguration: 'stub',
        logger: {
          level: loglevel,
          overrideConsole: true,
        },
      },
    });
    printVariousMessages();
  } finally {
    await detox.cleanup();
  }
}

async function main(argv) {
  switch (argv[2]) {
    case 'trace': return await testWithDetox('trace');
    case 'debug': return await testWithDetox('debug');
    case 'info': return await testWithDetox('info');
    default: return await testPlain();
  }
}

await main(process.argv);
