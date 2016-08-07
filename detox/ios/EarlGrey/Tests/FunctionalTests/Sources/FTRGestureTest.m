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

#import "FTRBaseIntegrationTest.h"

@interface FTRGestureTest : FTRBaseIntegrationTest
@end

@implementation FTRGestureTest

- (void)setUp {
  [super setUp];
  [self openTestViewNamed:@"Gesture Tests"];
}

- (void)testTaps {
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Grey Box")]
      performAction:[self tapWithAmount:1]];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"single tap")]
      assertWithMatcher:grey_sufficientlyVisible()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Grey Box")]
      performAction:[self tapWithAmount:2]];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"double tap")]
      assertWithMatcher:grey_sufficientlyVisible()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Grey Box")]
      performAction:[self tapWithAmount:3]];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"triple tap")]
      assertWithMatcher:grey_sufficientlyVisible()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Grey Box")]
      performAction:[self tapWithAmount:4]];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"quadruple tap")]
      assertWithMatcher:grey_sufficientlyVisible()];
}

- (void)testLongPress {
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Grey Box")]
      performAction:grey_longPressWithDuration(0.5f)];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"single long press")]
      assertWithMatcher:grey_sufficientlyVisible()];
}

- (void)testLongPressAtPoint {
  // Find the bounds of the element.
  __block CGRect targetBounds;
  GREYActionBlock *boundsFinder =
      [[GREYActionBlock alloc] initWithName:@"Frame finder"
                                constraints:nil
                               performBlock:^BOOL(UIView *view, NSError *__strong *error) {
    targetBounds = view.bounds;
    return YES;
  }];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Grey Box")]
      performAction:boundsFinder];

  // Verify tapping outside the bounds does not cause long press.
  CGFloat midX = CGRectGetMidX(targetBounds);
  CGFloat midY = CGRectGetMidY(targetBounds);
  CGPoint outsidePoints[4] = {
    CGPointMake(CGRectGetMinX(targetBounds) - 1, midY),
    CGPointMake(CGRectGetMaxX(targetBounds) + 1, midY),
    CGPointMake(midX, CGRectGetMinY(targetBounds) - 1),
    CGPointMake(midX, CGRectGetMaxY(targetBounds) + 1)
  };
  for (NSInteger i = 0; i < 4; i++) {
    [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Grey Box")]
        performAction:grey_longPressAtPointWithDuration(outsidePoints[i], 0.5f)];
    [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"single long press")]
        assertWithMatcher:grey_nil()];
  }

  // Verify that tapping inside the bounds causes the long press.
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Grey Box")]
      performAction:grey_longPressAtPointWithDuration(CGPointMake(midX, midX), 0.5f)];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"single long press")]
      assertWithMatcher:grey_sufficientlyVisible()];
}

// Asserts that the given gesture has been recognised regardless of the gesture's start point.
- (void)grey_assertGestureRecognized:(NSString *)gesture {
  MatchesBlock gestureMatcherBlock = ^BOOL (id element) {
    NSString *text = [(UILabel *)element text];
    GREYAssert([text hasPrefix:gesture], @"Gesture prefix '%@' not found in '%@'.", gesture, text);
    return YES;
  };
  DescribeToBlock gestureMatcherDescriptionBlock = ^(id<GREYDescription> description) {
    [description appendText:@"Gesture Matcher"];
  };
  GREYElementMatcherBlock *gestureElementMatcher =
      [[GREYElementMatcherBlock alloc] initWithMatchesBlock:gestureMatcherBlock
                                           descriptionBlock:gestureMatcherDescriptionBlock];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"gesture")]
      assertWithMatcher:gestureElementMatcher];
}

- (void)testSwipeWorksInAllDirectionsInPortraitMode {
  [self assertSwipeWorksInAllDirections];
}

- (void)testSwipeWorksInAllDirectionsInUpsideDownMode {
  [EarlGrey rotateDeviceToOrientation:UIDeviceOrientationPortraitUpsideDown errorOrNil:nil];
  [self assertSwipeWorksInAllDirections];
}

- (void)testSwipeWorksInAllDirectionsInLandscapeLeftMode {
  [EarlGrey rotateDeviceToOrientation:UIDeviceOrientationLandscapeLeft errorOrNil:nil];
  [self assertSwipeWorksInAllDirections];
}

- (void)testSwipeWorksInAllDirectionsInLandscapeRightMode {
  [EarlGrey rotateDeviceToOrientation:UIDeviceOrientationLandscapeRight errorOrNil:nil];
  [self assertSwipeWorksInAllDirections];
}

- (void)testSwipeOnWindow {
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Window swipes start here")]
      performAction:grey_swipeFastInDirection(kGREYDirectionUp)];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"swipe up on window")]
      assertWithMatcher:grey_sufficientlyVisible()];

  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Window swipes start here")]
      performAction:grey_swipeFastInDirection(kGREYDirectionDown)];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"swipe down on window")]
      assertWithMatcher:grey_sufficientlyVisible()];

  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Window swipes start here")]
      performAction:grey_swipeFastInDirection(kGREYDirectionLeft)];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"swipe left on window")]
      assertWithMatcher:grey_sufficientlyVisible()];

  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Window swipes start here")]
      performAction:grey_swipeFastInDirection(kGREYDirectionRight)];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"swipe right on window")]
      assertWithMatcher:grey_sufficientlyVisible()];
}

- (void)testSwipeWithLocationForAllDirections {
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Grey Box")]
      performAction:grey_swipeFastInDirectionWithStartPoint(kGREYDirectionUp, 0.25, 0.25)];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"swipe up startX:70.0 startY:70.0")]
      assertWithMatcher:grey_sufficientlyVisible()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Grey Box")]
      performAction:grey_swipeFastInDirectionWithStartPoint(kGREYDirectionDown, 0.75, 0.75)];
  [[EarlGrey selectElementWithMatcher:
      grey_accessibilityLabel(@"swipe down startX:210.0 startY:210.0")]
      assertWithMatcher:grey_sufficientlyVisible()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Grey Box")]
      performAction:grey_swipeFastInDirectionWithStartPoint(kGREYDirectionLeft, 0.875, 0.5)];
  [[EarlGrey selectElementWithMatcher:
      grey_accessibilityLabel(@"swipe left startX:245.0 startY:140.0")]
      assertWithMatcher:grey_sufficientlyVisible()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Grey Box")]
      performAction:grey_swipeFastInDirectionWithStartPoint(kGREYDirectionRight, 0.125, 0.75)];
  [[EarlGrey selectElementWithMatcher:
      grey_accessibilityLabel(@"swipe right startX:35.0 startY:210.0")]
      assertWithMatcher:grey_sufficientlyVisible()];
}

#pragma mark - Private

- (id<GREYAction>)tapWithAmount:(int)amount {
  if (amount == 1) {
    return grey_tap();
  } else if (amount == 2) {
    return grey_doubleTap();
  } else {
    return grey_multipleTapsWithCount((NSUInteger)amount);
  }
}

// Asserts that Swipe works in all directions by verifying if the swipe gestures are correctly
// recognized.
- (void)assertSwipeWorksInAllDirections {
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Grey Box")]
      performAction:grey_swipeFastInDirection(kGREYDirectionUp)];
  [self grey_assertGestureRecognized:@"swipe up"];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Grey Box")]
      performAction:grey_swipeSlowInDirection(kGREYDirectionDown)];
  [self grey_assertGestureRecognized:@"swipe down"];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Grey Box")]
      performAction:grey_swipeFastInDirection(kGREYDirectionLeft)];
  [self grey_assertGestureRecognized:@"swipe left"];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Grey Box")]
      performAction:grey_swipeSlowInDirection(kGREYDirectionRight)];
  [self grey_assertGestureRecognized:@"swipe right"];
}

@end
