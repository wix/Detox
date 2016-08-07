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
#import <EarlGrey/GREYUIWebViewDelegate.h>

#import "FTRBaseIntegrationTest.h"
#import "FTRNetworkProxy.h"

/**
 *  A constant to wait for the locally loaded HTML page.
 */
static const NSTimeInterval kLocalHTMLPageLoadDelay = 10.0;

/**
 *  Required for testing UIWebView states.
 */
@interface GREYAppStateTracker (FTRExposedForTesting)
- (GREYAppState)grey_lastKnownStateForElement:(id)element;
@end

@interface UIWebView (FTRExposedForTesting)
- (void)grey_trackAJAXLoading;
@end

@interface FTRUIWebViewTest : FTRBaseIntegrationTest<UIWebViewDelegate>
@end

@implementation FTRUIWebViewTest

- (void)setUp {
  [super setUp];
  [FTRNetworkProxy ftr_setProxyEnabled:NO];
  [self openTestViewNamed:@"Web Views"];
}

- (void)tearDown {
  [[GREYAppStateTracker sharedInstance] grey_clearState];
  [FTRNetworkProxy ftr_setProxyEnabled:YES];
  [super tearDown];
}

- (void)verifyScrollingOnLocallyLoadedHTMLPagesWithBounce:(BOOL)bounceEnabled {
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"loadLocalFile")]
      performAction:grey_tap()];

  // Bounce is enabled by default, turn it off if not required.
  if (!bounceEnabled) {
    [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"bounceSwitch")]
        performAction:grey_turnSwitchOn(NO)];
  }

  // TODO: Add an GREYCondition to wait for webpage loads, to fix EarlGrey synchronization
  // issues with loading webpages. These issues induce flakiness in tests that have html files
  // loaded, whether local or over the web. The GREYCondition added in this test checks if the file
  // was loaded to mask issues in this particular set of tests, surfacing that the page load error
  // was what caused the test flake.
  GREYCondition *conditionForFirstRow =
    [GREYCondition conditionWithName:@"WaitForRow1" block:^BOOL{
        NSError *error;
        [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Row 1")]
            assertWithMatcher:grey_sufficientlyVisible() error:&error];
    return (error == nil);
  }];
  // Verify that the local HTML page was loaded.
  BOOL localWebPageLoaded = [conditionForFirstRow waitWithTimeout:kLocalHTMLPageLoadDelay];
  GREYAssertTrue(localWebPageLoaded, @"The local Web Page was not loaded.");

  // Verify we can scroll to the bottom of the web page.
  id<GREYMatcher> matcher = grey_allOf(grey_accessibilityLabel(@"Row 50"),
                                       grey_interactable(),
                                       grey_sufficientlyVisible(),
                                       nil);
  [[[EarlGrey selectElementWithMatcher:matcher]
         usingSearchAction:grey_scrollInDirection(kGREYDirectionDown, 200)
      onElementWithMatcher:grey_accessibilityID(@"FTRTestWebView")]
      assertWithMatcher:grey_sufficientlyVisible()];
  // Verify we can scroll to the top of the web page.
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"FTRTestWebView")]
      performAction:grey_scrollToContentEdge(kGREYContentEdgeTop)];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Row 1")]
      assertWithMatcher:grey_sufficientlyVisible()];
}

- (void)testScrollingOnLocallyLoadedHTMLPagesWithBounce {
  [self verifyScrollingOnLocallyLoadedHTMLPagesWithBounce:YES];
}

- (void)testScrollingOnLocallyLoadedHTMLPagesWithoutBounce {
  [self verifyScrollingOnLocallyLoadedHTMLPagesWithBounce:NO];
}

- (void)verifyScrollingOnPagesLoadedUsingLoadHTMLStringWithBounce:(BOOL)bounceEnabled {
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"loadHTMLString")]
      performAction:grey_tap()];

  // Bounce is enabled by default, turn it off if not required.
  if (!bounceEnabled) {
    [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"bounceSwitch")]
        performAction:grey_turnSwitchOn(NO)];
  }

  // Verify we can scroll to the bottom of the web page.
  id<GREYMatcher> matcher = grey_allOf(grey_accessibilityLabel(@"Row 50"),
                                       grey_interactable(),
                                       grey_sufficientlyVisible(),
                                       nil);
  [[[EarlGrey selectElementWithMatcher:matcher]
         usingSearchAction:grey_scrollInDirection(kGREYDirectionDown, 200)
      onElementWithMatcher:grey_accessibilityID(@"FTRTestWebView")]
      assertWithMatcher:grey_sufficientlyVisible()];
  // Verify we can scroll to the top of the web page.
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"FTRTestWebView")]
      performAction:grey_scrollToContentEdge(kGREYContentEdgeTop)];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Row 1")]
      assertWithMatcher:grey_sufficientlyVisible()];
}

- (void)testScrollingOnPagesLoadedUsingLoadHTMLStringWithBounce {
  [self verifyScrollingOnPagesLoadedUsingLoadHTMLStringWithBounce:YES];
}

- (void)testScrollingOnPagesLoadedUsingLoadHTMLStringWithoutBounce {
  [self verifyScrollingOnPagesLoadedUsingLoadHTMLStringWithBounce:NO];
}

- (void)testSynchronizationWhenSwitchingBetweenLoadingMethods {
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"loadLocalFile")]
      performAction:grey_tap()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Row 1")]
      assertWithMatcher:grey_sufficientlyVisible()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"loadHTMLString")]
      performAction:grey_tap()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Row 1")]
      assertWithMatcher:grey_sufficientlyVisible()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"loadLocalFile")]
      performAction:grey_tap()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Row 1")]
      assertWithMatcher:grey_sufficientlyVisible()];
}

/*
 * These tests are really unit tests but since we hit EXC_BAD_ACCESS initializing a UIWebView in
 * a unit test environment, we are moving these to UI test suite
 */
- (void)testDelegateIsProxyDelegate {
  UIWebView *webView = [[UIWebView alloc] init];
  GREYUIWebViewDelegate *delegate = [webView delegate];
  XCTAssertTrue([delegate isKindOfClass:[GREYUIWebViewDelegate class]], @"%@", [delegate class]);
}

- (void)testDelegateIsProxyDelegateAfterSettingCustomDelegate {
  UIWebView *webView = [[UIWebView alloc] init];
  webView.delegate = self;
  GREYUIWebViewDelegate *delegate = [webView delegate];
  XCTAssertTrue([delegate isKindOfClass:[GREYUIWebViewDelegate class]], @"%@", [delegate class]);

  webView.delegate = self;
  delegate = [webView delegate];
  XCTAssertTrue([delegate isKindOfClass:[GREYUIWebViewDelegate class]], @"%@", [delegate class]);
}

- (void)testDelegateIsNotNilAfterClearingDelegate {
  UIWebView *webView = [[UIWebView alloc] init];
  webView.delegate = nil;
  GREYUIWebViewDelegate *delegate = [webView delegate];
  XCTAssertTrue([delegate isKindOfClass:[GREYUIWebViewDelegate class]], @"%@", [delegate class]);
}

- (void)testDelegateIsNotDeallocAfterClearingDelegate {
  UIWebView *webView = [[UIWebView alloc] init];
  __weak GREYUIWebViewDelegate *delegate;
  {
    delegate = [webView delegate];
    XCTAssertTrue([delegate isKindOfClass:[GREYUIWebViewDelegate class]], @"%@", [delegate class]);
    [webView setDelegate:nil];
  }

  __weak GREYUIWebViewDelegate *secondDelegate;
  {
    secondDelegate = [webView delegate];
    XCTAssertTrue([secondDelegate isKindOfClass:[GREYUIWebViewDelegate class]],
        @"%@", [delegate class]);
    [webView setDelegate:nil];
  }

  XCTAssertNotNil(delegate);
  XCTAssertNotNil(secondDelegate);
  XCTAssertNotEqual(delegate, secondDelegate);
}

- (void)testWebViewDeallocClearsAllDelegates {
  __weak GREYUIWebViewDelegate *delegate;
  __weak GREYUIWebViewDelegate *secondDelegate;

  @autoreleasepool {
    __autoreleasing UIWebView *webView = [[UIWebView alloc] init];
    {
      delegate = [webView delegate];
      [webView setDelegate:nil];
    }

    {
      secondDelegate = [webView delegate];
      [webView setDelegate:nil];
    }
    XCTAssertTrue([delegate isKindOfClass:[GREYUIWebViewDelegate class]], @"%@", [delegate class]);
    XCTAssertTrue([secondDelegate isKindOfClass:[GREYUIWebViewDelegate class]],
        @"%@", [delegate class]);
  }
  XCTAssertNil(delegate);
  XCTAssertNil(secondDelegate);
}

- (void)testWebViewProxyDelegateClearsOutDeallocedDelegates {
  UIWebView *webView = [[UIWebView alloc] init];
  id<UIWebViewDelegate> delegate;

  @autoreleasepool {
    __autoreleasing id<UIWebViewDelegate> autoRelDelegate = [[FTRUIWebViewTest alloc] init];
    [webView setDelegate:autoRelDelegate];
    delegate = [webView delegate];
    XCTAssertTrue([delegate isKindOfClass:[GREYUIWebViewDelegate class]], @"%@", [delegate class]);
  }

  // Should not crash.
  [delegate webViewDidFinishLoad:webView];
}

- (void)testStopLoadingClearsStateInStateTracker {
  UIWebView *webView = [[UIWebView alloc] init];
  [webView grey_trackAJAXLoading];
  GREYAppState lastState =
      [[GREYAppStateTracker sharedInstance] grey_lastKnownStateForElement:webView];
  BOOL isAsyncRequestPending = ((lastState & kGREYPendingUIWebViewAsyncRequest) != 0);
  XCTAssertTrue(isAsyncRequestPending);

  [webView stopLoading];
  lastState = [[GREYAppStateTracker sharedInstance] grey_lastKnownStateForElement:webView];
  isAsyncRequestPending = ((lastState & kGREYPendingUIWebViewAsyncRequest) != 0);
  XCTAssertFalse(isAsyncRequestPending);
}

- (void)testAjaxTrackedWhenAJAXListenerSchemeIsStarting {
  UIWebView *webView = [[UIWebView alloc] init];
  NSURLRequest *req =
      [NSURLRequest requestWithURL:[NSURL URLWithString:@"greyajaxlistener://starting"]];
  // Invoke manually since loadRequest doesn't work.
  [[webView delegate] webView:webView
      shouldStartLoadWithRequest:req
                  navigationType:UIWebViewNavigationTypeOther];
  GREYAppState lastState =
      [[GREYAppStateTracker sharedInstance] grey_lastKnownStateForElement:webView];
  BOOL isAsyncRequestPending = ((lastState & kGREYPendingUIWebViewAsyncRequest) != 0);
  XCTAssertTrue(isAsyncRequestPending);
}

- (void)testAjaxUnTrackedWhenAJAXListenerSchemeIsCompleted {
  UIWebView *webView = [[UIWebView alloc] init];
  [webView grey_trackAJAXLoading];

  GREYAppState lastState =
      [[GREYAppStateTracker sharedInstance] grey_lastKnownStateForElement:webView];
  BOOL isAsyncRequestPending = ((lastState & kGREYPendingUIWebViewAsyncRequest) != 0);
  XCTAssertTrue(isAsyncRequestPending);

  NSURLRequest *req =
      [NSURLRequest requestWithURL:[NSURL URLWithString:@"greyajaxlistener://completed"]];
  // Invoke manually since loadRequest doesn't work.
  [[webView delegate] webView:webView
      shouldStartLoadWithRequest:req
                  navigationType:UIWebViewNavigationTypeOther];
  lastState = [[GREYAppStateTracker sharedInstance] grey_lastKnownStateForElement:webView];
  isAsyncRequestPending = ((lastState & kGREYPendingUIWebViewAsyncRequest) != 0);
  XCTAssertFalse(isAsyncRequestPending);
}

@end
