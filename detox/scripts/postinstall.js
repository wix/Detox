const { platform } = require('os');
const { exec } = require('child_process');
const { dirname } = require('path');

if (platform() === 'darwin') {
    exec(`${dirname(process.argv[1])}/build_framework.ios.sh`, console.log);
}