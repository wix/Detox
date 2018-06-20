class DetoxChildProcessError extends Error {
  constructor({ message, command, code, stdout, stderr, error }) {
    super(message || `Command failed with an error code (${code})`);

    this.command = command || "";
    this.stdout = stdout || "";
    this.stderr = stderr || "";
    this.error = error || null;
  }
}

module.exports = DetoxChildProcessError;
