const fs = require('fs');

function bloatBundle() {
  const bundlePath = './app.js';

  try {
    const debugBundle = fs.openSync(bundlePath, 'a');
    try {
      /// Bloating the bundle with a lot of data.
      for (let i = 0; i < 25000; i++) {
        fs.writeSync(debugBundle, '/* junk */');
      }
    } finally {
      fs.closeSync(debugBundle);
    }
  } catch (err) {
    console.error(`Error while bloating the bundle: ${err}`);
  }
}

bloatBundle();
