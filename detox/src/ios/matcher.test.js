describe('ios matcher', async () => {
  let m;

  beforeEach(() => {
    m = require('./matchers');
  });

  // These snapshots preserve the output of the matchers against unwanted change
  it("snapshots", () => {
    const textBasedMatchers = ['LabelMatcher', 'IdMatcher', 'TypeMatcher', 'TextMatcher', 'ValueMatcher'];
    const chainableMatchers = ['withAncestor', 'withDescendant', 'and', 'not'];
    const noArgsMatchers = ['VisibleMatcher', 'NotVisibleMatcher', 'ExistsMatcher', 'NotExistsMatcher'];

    textBasedMatchers.forEach(matcher => {
      expect(new m[matcher]("mySelector")._call()).toMatchSnapshot();
    });

    chainableMatchers.forEach(matcher => {
      expect(new m.LabelMatcher("mySelector")[matcher](new m.LabelMatcher("myOtherSelector"))._call()).toMatchSnapshot()
    });

    noArgsMatchers.forEach(matcher => {
      expect(new m[matcher]()._call()).toMatchSnapshot();
    });
  });
});