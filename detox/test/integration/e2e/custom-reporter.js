const { tracing } = require('detox/internals');

class CustomReporter {
  async onRunComplete() {
    let count = 0;
    await new Promise((resolve, reject) => {
      tracing.createEventStream()
        .on('error', reject)
        .on('end', resolve)
        .on('data', function (e) {
          count++;
        });
    });

    console.log(`Collected ${count} trace events during the test run`);
  }
}

module.exports = CustomReporter;
