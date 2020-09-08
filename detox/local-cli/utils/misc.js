function getPlatformSpecificString(platform) {
  switch (platform) {
    case 'ios': return ':android:';
    case 'android': return ':ios:';
    default: return undefined;
  }
}

function printEnvironmentVariables(envObject) {
  return Object.entries(envObject).reduce((cli, [key, value]) => {
    if (value == null || value === '') {
      return cli;
    }

    return `${cli}${key}=${JSON.stringify(value)} `;
  }, '');
}

module.exports = {
  getPlatformSpecificString,
  printEnvironmentVariables,
};
