const { tracing } = require('detox/internals');

class CustomReporter {
  async onRunComplete() {
    let counts = {};
    await new Promise((resolve, reject) => {
      tracing.createEventStream()
        .on('error', reject)
        .on('end', resolve)
        .on('data', function (e) {
          counts[e.ph] = (counts[e.ph] || 0) + 1;
        });
    });

    const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log(`Collected ${totalCount} trace events during the test run:\n`, JSON.stringify(counts));
  }
}

module.exports = CustomReporter;
