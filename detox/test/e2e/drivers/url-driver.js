const driver = {
  withDetoxArgs: {
    default: () => ({
      url: 'detoxtesturlscheme://such-string?arg1=first&arg2=second',
      launchArgs: undefined,
    }),

    andUserArgs: (launchArgs) => ({
      url: 'detoxtesturlscheme',
      launchArgs,
    }),

    forSingleInstanceActivityLaunch: () => ({
      url: 'detoxtesturlscheme.singleinstance://such-string',
      launchArgs: { detoxAndroidSingleInstanceActivity: true },
    }),
  },

  navToUrlScreen: () => element(by.text('Init URL')).tap(),
  assertUrl: (url) => expect(element(by.text(url))).toBeVisible(),
  assertNoUrl: (url) => expect(element(by.text(url))).not.toBeVisible(),
};

module.exports = {
  urlDriver: driver,
};
