//
// Copyright 2016 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

#import <EarlGrey/GREYAppStateTracker.h>
#import <EarlGrey/GREYPrivate.h>

#import "FTRBaseIntegrationTest.h"
#import "FTRNetworkProxy.h"

// Required for testing UIWebView states.
@interface GREYAppStateTracker (GREYExposedForTesting)
- (GREYAppState)grey_lastKnownStateForElement:(id)element;
@end

@interface UIWebView (GREYExposedForTesting)
- (void)grey_trackAJAXLoading;
@end

// These web view tests are not run by default since they require network access
// and have a possibility of flakiness.
@interface FTRLocalUIWebViewTest : FTRBaseIntegrationTest<UIWebViewDelegate>
@end

@implementation FTRLocalUIWebViewTest

- (void)setUp {
  [super setUp];
  [self openTestViewNamed:@"Web Views"];
  [FTRNetworkProxy ftr_setProxyEnabled:NO];
}

- (void)tearDown {
  [[GREYAppStateTracker sharedInstance] grey_clearState];
  [FTRNetworkProxy ftr_setProxyEnabled:YES];
  [super tearDown];
}

- (void)testSuccessiveTaps {
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"loadGoogle")]
      performAction:grey_tap()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"IMAGES")]
      performAction:[GREYActions actionForTap]];

  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"APPS")]
      performAction:[GREYActions actionForTap]];

  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"NEWS")]
      performAction:[GREYActions actionForTap]];

  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"ALL")]
      performAction:[GREYActions actionForTap]];
}

- (void)testAJAXLoad {
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"loadGoogle")]
      performAction:grey_tap()];
  id<GREYMatcher> nextPageMatcher =
      grey_allOf(grey_accessibilityLabel(@"Next page"), grey_interactable(), nil);
  [[[EarlGrey selectElementWithMatcher:nextPageMatcher]
      usingSearchAction:grey_scrollInDirection(kGREYDirectionDown, 200)
      onElementWithMatcher:grey_kindOfClass([UIWebView class])]
      performAction:grey_tap()];
  [self waitForWebElementWithName:@"APPS" elementMatcher:grey_accessibilityLabel(@"APPS")];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"APPS")]
      assertWithMatcher:grey_sufficientlyVisible()];
}

- (void)testTextFieldInteraction {
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"loadGoogle")]
      performAction:grey_tap()];
  id<GREYMatcher> searchButtonMatcher = grey_accessibilityHint(@"Search");
  [self waitForWebElementWithName:@"Search Button" elementMatcher:searchButtonMatcher];
  [[[EarlGrey selectElementWithMatcher:searchButtonMatcher]
      performAction:grey_clearText()]
      performAction:grey_typeText(@"20 + 22\n")];

  [self waitForWebElementWithName:@"Search Button" elementMatcher:grey_accessibilityLabel(@"42")];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"42")]
      assertWithMatcher:grey_sufficientlyVisible()];

  // We need to tap because the second time we do typeAfterClearning, it passes firstResponder check
  // and never ends up auto-tapping on search field.
  [[EarlGrey selectElementWithMatcher:searchButtonMatcher]
      performAction:grey_tap()];

  [[[EarlGrey selectElementWithMatcher:searchButtonMatcher]
      performAction:grey_clearText()]
      performAction:grey_typeText(@"Who wrote Star Wars IV - A New Hope?\n")];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Google Search")]
      performAction:grey_tap()];
  id<GREYMatcher> resultMatcher = grey_allOf(grey_accessibilityLabel(@"George Lucas"),
                                             grey_accessibilityTrait(UIAccessibilityTraitHeader),
                                             nil);
  [self waitForWebElementWithName:@"Search Result" elementMatcher:resultMatcher];
  [[EarlGrey selectElementWithMatcher:resultMatcher] assertWithMatcher:grey_sufficientlyVisible()];
}

- (void)testJavaScriptExecution {
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"loadGoogle")]
      performAction:grey_tap()];
  id<GREYAction> jsAction =
      grey_javaScriptExecution(@"window.location.href='http://images.google.com'", nil);
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"FTRTestWebView")]
      performAction:jsAction];

  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"IMAGES")]
      assertWithMatcher:grey_sufficientlyVisible()];

  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"FTRTestWebView")] performAction:
      grey_javaScriptExecution(@"window.location.href='http://translate.google.com'", nil)];

  id<GREYAction> executeJavascript =
      grey_javaScriptExecution(@"window.location.href='http://play.google.com'", nil);
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"FTRTestWebView")]
      performAction:executeJavascript];

  NSString *jsResult;
  NSString *expected = @"4";
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"FTRTestWebView")]
      performAction:[GREYActions actionForJavaScriptExecution:@"2 + 2" output:&jsResult]];

  GREYAssertTrue([jsResult isEqualToString:expected], @"Expected:%@, Actual:%@",
                 expected, jsResult);
}

#pragma mark - Private

/**
 *  Waits for the element matching @c matcher to become visible or 3 seconds whichever happens
 *  first.
 *
 *  @param name    Name of the element to wait for.
 *  @param matcher Matcher that uniquely matches the element to wait for.
 */
- (void)waitForWebElementWithName:(NSString *)name elementMatcher:(id<GREYMatcher>)matcher {
  // TODO: Improve EarlGrey webview synchronization so that it automatically waits for the page to
  // load removing the need for conditions such as this.
  [[GREYCondition conditionWithName:[name stringByAppendingString:@" Condition"]
                              block:^BOOL {
    NSError *error = nil;
    [[EarlGrey selectElementWithMatcher:matcher]
        assertWithMatcher:grey_sufficientlyVisible() error:&error];
    return error == nil;
  }] waitWithTimeout:3.0];
}

@end
