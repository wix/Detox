const fs = require('fs');
const bundlePath = `${process.argv[2]}`;

function bloatBundle() {
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
