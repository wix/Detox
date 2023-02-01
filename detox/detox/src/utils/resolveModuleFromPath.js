function resolveModuleFromPath(modulePath) {
  const resolvedModulePath = require.resolve(modulePath, { paths: [process.cwd()] });
  console.log(resolvedModulePath, '123');
  return require(resolvedModulePath);
}

module.exports = resolveModuleFromPath;
