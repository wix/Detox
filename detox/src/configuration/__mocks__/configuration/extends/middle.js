module.exports = {
  extends: require.resolve('./base.json'),
  artifacts: {
    rootDir: 'someRootDir',
    plugins: {
      screenshot: 'all',
    },
  },
};
