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

#import <EarlGrey/CGGeometry+GREYAdditions.h>
#import <EarlGrey/GREYVisibilityChecker.h>

#import "FTRBaseIntegrationTest.h"

@interface FTRVisibilityTest : FTRBaseIntegrationTest
@end

@implementation FTRVisibilityTest {
  UIView *_outerview;
}

- (void)setUp {
  [super setUp];
  [self openTestViewNamed:@"Visibility Tests"];
}

- (void)tearDown {
  [_outerview removeFromSuperview];
  [super tearDown];
}

- (void)testTranslucentViews {
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"translucentLabel")]
      assertWithMatcher:grey_sufficientlyVisible()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"translucentOverlappingView")]
      assertWithMatcher:grey_sufficientlyVisible()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"translucentOverlappingView")]
      assert:[GREYAssertionBlock assertionWithName:@"translucentOverlappingViewVisibleArea"
                           assertionBlockWithError:^BOOL(id element,
                                                         NSError *__strong *errorOrNil) {
        CGRect visibleRect = [GREYVisibilityChecker rectEnclosingVisibleAreaOfElement:element];
        CGRect expectedRect = CGRectMake(0, 0, 50, 50);
        GREYAssertTrue(CGSizeEqualToSize(visibleRect.size, expectedRect.size),
                     @"rects must be equal");
        return YES;
      }
  ]];
}

- (void)testNonPixelBoundaryAlignedLabel {
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"unalignedPixel1")]
      assertWithMatcher:grey_sufficientlyVisible()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"unalignedPixel2")]
      assertWithMatcher:grey_sufficientlyVisible()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"unalignedPixel3")]
      assertWithMatcher:grey_sufficientlyVisible()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"unalignedPixel4")]
      assertWithMatcher:grey_sufficientlyVisible()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"unalignedPixelWithOnePixelSize")]
      assertWithMatcher:grey_sufficientlyVisible()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"unalignedPixelWithHalfPixelSize")]
      assertWithMatcher:grey_notVisible()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"unalignedPixelWithFractionPixelSize")]
      assertWithMatcher:grey_sufficientlyVisible()];
}

- (void)testButtonIsVisible {
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"FTRVisibilityButton")]
      assertWithMatcher:grey_sufficientlyVisible()];
}

- (void)testObscuredButtonIsNotVisible {
  [[[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"FTRVisibilityButton")]
      performAction:grey_tap()] assertWithMatcher:grey_notVisible()];
}

- (void)testRasterization {
  UIWindow *currentWindow = [[[UIApplication sharedApplication] delegate] window];
  _outerview = [[UIView alloc] initWithFrame:currentWindow.frame];
  _outerview.isAccessibilityElement = YES;
  _outerview.layer.shouldRasterize = YES;
  _outerview.layer.rasterizationScale = 0.001f;
  _outerview.accessibilityLabel = @"RasterizedLayer";
  _outerview.backgroundColor = [UIColor blueColor];
  [currentWindow.rootViewController.view addSubview:_outerview];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"RasterizedLayer")]
      assertWithMatcher:grey_sufficientlyVisible()];
}

- (void)testVisibleRectOfPartiallyObscuredView {
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"FTRRedSquare")]
      assert:[GREYAssertionBlock assertionWithName:@"TestVisibleRectangle"
                           assertionBlockWithError:^BOOL(id element,
                                                         NSError *__strong *errorOrNil) {
        CGRect visibleRect = [GREYVisibilityChecker rectEnclosingVisibleAreaOfElement:element];
        GREYAssertTrue(CGSizeEqualToSize(visibleRect.size, CGSizeMake(50, 50)),
                     @"Visible rect must be 50X50. It is currently %@",
                     NSStringFromCGSize(visibleRect.size));
        return YES;
      }
  ]];
}

- (void)testVisibleEnclosingRectangleOfVisibleViewIsEntireView {
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"FTRVisibilityButton")]
      assert:[GREYAssertionBlock assertionWithName:@"TestVisibleRectangle"
                           assertionBlockWithError:^BOOL(id element,
                                                         NSError *__strong *errorOrNil) {
        GREYAssertNotNil(element, @"element must not be nil");
        GREYAssertTrue([element isKindOfClass:[UIView class]], @"element must be UIView");
        UIView *view = element;
        CGRect expectedRect = view.accessibilityFrame;
        // Visiblity checker should first convert to pixel, then get integral inside,
        // then back to points.
        expectedRect = CGRectPointToPixel(expectedRect);
        expectedRect = CGRectIntegralInside(expectedRect);
        expectedRect = CGRectPixelToPoint(expectedRect);
        CGRect actualRect = [GREYVisibilityChecker rectEnclosingVisibleAreaOfElement:view];
        GREYAssertTrue(CGRectEqualToRect(actualRect, expectedRect),
                     @"expected: %@, actual: %@",
                     NSStringFromCGRect(expectedRect),
                     NSStringFromCGRect(actualRect));
        return YES;
      }
  ]];
}

- (void)testVisibleEnclosingRectangleOfObscuredViewIsCGRectNull {
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"FTRVisibilityButton")]
      performAction:grey_tap()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"FTRVisibilityButton")]
      assert:[GREYAssertionBlock assertionWithName:@"TestVisibleRectangle"
                           assertionBlockWithError:^BOOL(id element,
                                                         NSError *__strong *errorOrNil) {
        GREYAssertNotNil(element, @"element must not be nil");
        GREYAssertTrue([element isKindOfClass:[UIView class]], @"element must be UIView");
        UIView *view = element;
        CGRect visibleRect = [GREYVisibilityChecker rectEnclosingVisibleAreaOfElement:view];
        GREYAssertTrue(CGRectIsEmpty(visibleRect), @"rect must be CGRectIsZero");
        return YES;
      }
  ]];
}

- (void)testVisibilityFailsWithHiddenActivationPoint {
  // Verify FTRRedBar cannot be interacted with hidden activation point.
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"FTRRedBar")]
      assertWithMatcher:grey_not(grey_interactable())];

  // Unhide the activation point.
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"FTRShowActivationPoint")]
      performAction:[GREYActions actionForTurnSwitchOn:YES]];

  // Verify FTRRedBar can now be interacted with.
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"FTRRedBar")]
      assertWithMatcher:grey_interactable()];
}

@end
