const config = {
  transformer: {
    getTransformOptions: () => {
      return {
        transform: { inlineRequires: true },
      };
    },
  },
};

module.exports = config;