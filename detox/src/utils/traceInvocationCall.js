function _getCallStackTrace() {
  return new Error().stack
    .split('\n')
    .slice(1) // Ignore Error message
    .map(line => line
      .replace(/^\s*at\s+/, '')
      .replace(process.cwd(), '')
    )
    .filter(line => !line.includes('/detox/src')) // Ignore detox internal calls
    .join('\n');
}

function invocationCall(logger, sectionName, invocation, action) {
  return logger.trace.complete({
    cat: 'ws-client,ws-client-invocation',
    data: invocation,
    stack: _getCallStackTrace(),
  }, sectionName, action);
}

module.exports = invocationCall;
