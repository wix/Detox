function resolveModuleFromPath(modulePath) {
  const resolvedModulePath = require.resolve(modulePath, { paths: [process.cwd()] });
  return require(resolvedModulePath);
}

module.exports = resolveModuleFromPath;
