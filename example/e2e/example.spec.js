var detox = require('detox');

detox.config({
  server: 'ws://localhost:8099',
  sessionId: 'example'
});

detox.connect(function () {

  // [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Click Me")] performAction:grey_tap()];
  detox.invoke({
    target: {
      type: 'Invocation',
      value: {
        target: 'EarlGrey',
        class: 'EarlGreyImpl',
        method: 'selectElementWithMatcher',
        args: [{
          type: 'Invocation',
          value: {
            class: 'GREYMatchers',
            method: 'matcherForAccessibilityLabel',
            args: [{
              type: 'String',
              value: 'Click Me'
            }]
          }
        }]
      }
    },
    class: 'GREYElementInteraction',
    method: 'performAction',
    args: [{
      type: 'Invocation',
      value: {
        class: 'GREYActions',
        method: 'actionForTap',
        args: []
      }
    }]
  });

  // [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Yay")] assertWithMatcher:grey_sufficientlyVisible()];
  detox.invoke({
    target: {
      type: 'Invocation',
      value: {
        target: 'EarlGrey',
        class: 'EarlGreyImpl',
        method: 'selectElementWithMatcher',
        args: [{
          type: 'Invocation',
          value: {
            class: 'GREYMatchers',
            method: 'matcherForAccessibilityLabel',
            args: [{
              type: 'String',
              value: 'Yay'
            }]
          }
        }]
      }
    },
    class: 'GREYElementInteraction',
    method: 'assertWithMatcher',
    args: [{
      type: 'Invocation',
      value: {
        class: 'GREYMatchers',
        method: 'matcherForSufficientlyVisible',
        args: []
      }
    }]
  });

  // [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Mitzi")] assertWithMatcher:grey_sufficientlyVisible()];
  detox.invoke({
    target: {
      type: 'Invocation',
      value: {
        target: 'EarlGrey',
        class: 'EarlGreyImpl',
        method: 'selectElementWithMatcher',
        args: [{
          type: 'Invocation',
          value: {
            class: 'GREYMatchers',
            method: 'matcherForAccessibilityLabel',
            args: [{
              type: 'String',
              value: 'Mitzi' // change this to 'Yay' to see the test pass
            }]
          }
        }]
      }
    },
    class: 'GREYElementInteraction',
    method: 'assertWithMatcher',
    args: [{
      type: 'Invocation',
      value: {
        class: 'GREYMatchers',
        method: 'matcherForSufficientlyVisible',
        args: []
      }
    }]
  });

  detox.done();

});
