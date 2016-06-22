var detox = require('detox');

detox.config({
  server: 'ws://localhost:8099',
  sessionId: 'example'
});

detox.connect(function () {

  // [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Click Me")] performAction:grey_tap()];
  const _getMatcher1 = detox.invoke.call(detox.invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityLabel:', 'Click Me');
  const _getElement1 = detox.invoke.call(detox.invoke.EarlGrey.instance, 'selectElementWithMatcher:', _getMatcher1);
  const _getAction1 = detox.invoke.call(detox.invoke.IOS.Class('GREYActions'), 'actionForTap');
  const _getInteraction1 = detox.invoke.call(_getElement1, 'performAction:', _getAction1);
  detox.invoke.execute(_getInteraction1);

  // [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Yay")] assertWithMatcher:grey_sufficientlyVisible()];
  const _getMatcher2 = detox.invoke.call(detox.invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityLabel:', 'Yay');
  const _getElement2 = detox.invoke.call(detox.invoke.EarlGrey.instance, 'selectElementWithMatcher:', _getMatcher2);
  const _getAssertMatcher2 = detox.invoke.call(detox.invoke.IOS.Class('GREYMatchers'), 'matcherForSufficientlyVisible');
  const _getInteraction2 = detox.invoke.call(_getElement2, 'assertWithMatcher:', _getAssertMatcher2);
  detox.invoke.execute(_getInteraction2);

  // [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Mitzi")] assertWithMatcher:grey_sufficientlyVisible()];
  const _getMatcher3 = detox.invoke.call(detox.invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityLabel:', 'Mitzi'); // change Mitzi to Yay to make the test pass
  const _getElement3 = detox.invoke.call(detox.invoke.EarlGrey.instance, 'selectElementWithMatcher:', _getMatcher3);
  const _getAssertMatcher3 = detox.invoke.call(detox.invoke.IOS.Class('GREYMatchers'), 'matcherForSufficientlyVisible');
  const _getInteraction3 = detox.invoke.call(_getElement3, 'assertWithMatcher:', _getAssertMatcher3);
  detox.invoke.execute(_getInteraction3);

  detox.done();

});
