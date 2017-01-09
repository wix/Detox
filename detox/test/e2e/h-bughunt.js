require('/Users/danielzl/dev/detox/detox/test/node_modules/react-native/Libraries/Utilities/MessageQueue.js').MessageQueue.spy(true);

describe.only('bug hunt', () => {
  it('switch root works', () => {
    element(by.label('Switch Root')).tap();
    element(by.label('Switch Root NOW!')).tap();
    expect(element(by.label('this is a new root'))).toBeVisible();
  });
});
