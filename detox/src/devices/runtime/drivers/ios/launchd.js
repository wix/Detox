const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

/**
 * Runs the specified command using launchd on macOS.
 *
 * @param {string} binary The binary to execute.
 * @param {Array} flags The flags to pass to the binary.
 * @param {Object} options The options to pass to the binary.
 * @returns {Promise<Object>} A Promise that resolves with the output and error of the command as an object.
 */
function launchd(binary, flags, options) {
  const env = options.env || process.env;

  return new Promise((resolve, reject) => {
    // Determine the launchd plist file path
    const plistFilePath = path.join(os.homedir(), `Library/LaunchAgents/com.example.launchd-${Date.now()}.plist`);

    // Create the launchd plist XML string
    const plistXml = `<?xml version="1.0" encoding="UTF-8"?>
      <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
      <plist version="1.0">
        <dict>
          <key>Label</key>
          <string>com.example.launchd</string>
          <key>ProgramArguments</key>
          <array>
            <string>${binary}</string>
            ${flags.map(flag => `<string>${flag}</string>`).join('\n')}
          </array>
          <key>EnvironmentVariables</key>
          <dict>
            ${Object.keys(env).map(key => `<key>${key}</key><string>${env[key]}</string>`).join('\n')}
          </dict>
          <key>RunAtLoad</key>
          <true/>
        </dict>
      </plist>
    `;

    // Write the launchd plist file to disk
    fs.writeFile(plistFilePath, plistXml, err => {
      if (err) {
        return reject(new Error(`Error writing launchd plist file: ${err.message}`));
      }

      // Load the launchd plist file using launchctl
      const launchctl = spawn('launchctl', ['load', plistFilePath]);
      launchctl.on('close', code => {
        if (code !== 0) {
          return reject(new Error(`Error loading launchd plist file (exit code ${code})`));
        }

        // Remove the launchd plist file
        fs.unlink(plistFilePath, err => {
          if (err) {
            console.warn(`Warning: Failed to remove launchd plist file: ${err.message}`);
          }
        });

        // Execute the command using spawn
        const child = spawn(binary, flags, options);

        let output = '';
        let error = '';

        child.stdout.on('data', data => {
          output += data;
        });

        child.stderr.on('data', data => {
          error += data;
        });

        child.on('close', code => {
          if (code !== 0) {
            return reject(new Error(`Command exited with code ${code}\n${error}`));
          }

          resolve({ output, error });
        });
      });
    });
  });
}

module.exports = { launchd };
