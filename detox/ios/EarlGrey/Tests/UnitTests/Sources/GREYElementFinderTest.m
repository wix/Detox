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

#import <EarlGrey/GREYElementFinder.h>
#import <EarlGrey/GREYElementMatcherBlock.h>
#import <EarlGrey/GREYElementProvider.h>
#import <EarlGrey/GREYUIWindowProvider.h>
#import <OCMock.h>

#import "GREYBaseTest.h"

static NSMutableArray *gAppWindows;

@interface GREYElementFinderTest : GREYBaseTest
@end

@implementation GREYElementFinderTest {
  GREYElementFinder *elementFinder;
  UIWindow *rootWindow;
  UIView *leafA;
  UIView *leafB;
  UIView *leafA1;
  id<GREYMatcher> niceMatcher;
  GREYElementProvider *viewProvider;
}

- (void)setUp {
  [super setUp];

  rootWindow = [[UIWindow alloc] init];
  leafA = [[UIView alloc] init];
  leafB = [[UIButton alloc] init];
  leafA1 = [[UILabel alloc] init];
  [rootWindow addSubview:leafA];
  [rootWindow addSubview:leafB];
  [leafA addSubview:leafA1];
  niceMatcher = [GREYElementMatcherBlock matcherWithMatchesBlock:^BOOL(id item) {
    return YES;
  } descriptionBlock:^(id<GREYDescription> desc) { }];

  viewProvider = [[GREYElementProvider alloc]
                     initWithRootProvider:[GREYUIWindowProvider providerWithAllWindows]];

  gAppWindows = [[NSMutableArray alloc] init];
  [[[self.mockSharedApplication stub] andReturn:gAppWindows] windows];
}

- (void)testEmptyMatcherReturnsAllViews {
  [gAppWindows addObject:rootWindow];
  elementFinder = [[GREYElementFinder alloc] initWithMatcher:niceMatcher];

  NSArray *expectedArray = @[ rootWindow, leafB, leafA, leafA1 ];
  NSArray *resultArray = [elementFinder elementsMatchedInProvider:viewProvider];
  XCTAssertEqualObjects(expectedArray, resultArray, @"Should return the entire view hierarchy");
}

- (void)testNoMatchingViews {
  [gAppWindows addObject:rootWindow];
  id<GREYMatcher> switchMatcher = grey_kindOfClass([UISwitch class]);
  elementFinder = [[GREYElementFinder alloc] initWithMatcher:switchMatcher];
  XCTAssertEqual(0u,
                 [elementFinder elementsMatchedInProvider:viewProvider].count,
                 @"No matching views should return nil");
}

- (void)testMultipleMatchingViewsFromMultipleRoots {
  UIWindow *secondRoot = [[UIWindow alloc] init];
  UILabel *label1 = [[UILabel alloc] init];
  [secondRoot addSubview:label1];

  [gAppWindows addObjectsFromArray:@[ rootWindow, secondRoot ]];
  UILabel *label2 = [[UILabel alloc] init];
  [rootWindow addSubview:label2];
  id<GREYMatcher> labelMatcher = grey_kindOfClass([UILabel class]);
  elementFinder = [[GREYElementFinder alloc] initWithMatcher:labelMatcher];

  // second root should be matched first since it is top-most window.
  NSArray *expectedViews = @[ label1, label2, leafA1 ];
  NSArray *actualViews = [elementFinder elementsMatchedInProvider:viewProvider];
  XCTAssertEqualObjects(actualViews, expectedViews);
}

- (void)testMultipleMatchingViewsFromSingleRoot {
  [gAppWindows addObject:rootWindow];
  UILabel *label = [[UILabel alloc] init];
  [rootWindow addSubview:label];
  id<GREYMatcher> labelMatcher = grey_kindOfClass([UILabel class]);
  elementFinder = [[GREYElementFinder alloc] initWithMatcher:labelMatcher];
  NSArray *expectedViews = @[ label, leafA1 ];
  NSArray *actualViews = [elementFinder elementsMatchedInProvider:viewProvider];
  XCTAssertEqualObjects(actualViews, expectedViews, @"Matching views should be equal");
}

- (void)testElementFinderWorksWithHiddenElements {
  [gAppWindows addObject:rootWindow];
  UIView *view = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 10, 10)];
  view.isAccessibilityElement = YES;
  view.accessibilityLabel = @"hiddenAccessibilityLabel";
  [view setHidden:YES];
  [view setAlpha:1.0];
  [rootWindow addSubview:view];
  id<GREYMatcher> hiddenLabelMatcher = grey_accessibilityLabel(@"hiddenAccessibilityLabel");
  elementFinder = [[GREYElementFinder alloc] initWithMatcher:hiddenLabelMatcher];
  XCTAssertEqual([elementFinder elementsMatchedInProvider:viewProvider].count, 1u);
}

@end
