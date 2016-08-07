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

@interface FTROrientationChangeTest : FTRBaseIntegrationTest
@end

@implementation FTROrientationChangeTest

- (void)setUp {
  [super setUp];
  [self openTestViewNamed:@"Rotated Views"];
}

- (void)testBasicOrientationChange {
  // Begin by rotating to portrait, in case interface is in some other orientation.
  [EarlGrey rotateDeviceToOrientation:UIDeviceOrientationPortrait errorOrNil:nil];
  // Test rotating to landscape.
  [EarlGrey rotateDeviceToOrientation:UIDeviceOrientationLandscapeLeft errorOrNil:nil];
  XCTAssertTrue([UIDevice currentDevice].orientation == UIDeviceOrientationLandscapeLeft,
                @"Device orientation should now be left landscape");
  XCTAssertTrue([[UIApplication sharedApplication] statusBarOrientation]
                == UIInterfaceOrientationLandscapeRight,
                @"Interface orientation should now be right landscape");
  // Test rotating to portrait.
  [EarlGrey rotateDeviceToOrientation:UIDeviceOrientationPortrait errorOrNil:nil];
  XCTAssertTrue([UIDevice currentDevice].orientation == UIDeviceOrientationPortrait,
                @"Device orientation should now be portrait");
  XCTAssertTrue([[UIApplication sharedApplication] statusBarOrientation]
                == UIInterfaceOrientationPortrait,
                @"Interface orientation should now be portrait");
}

- (void)testRotateToCurrentOrientation {
  UIDeviceOrientation deviceOrientation =
      (UIDeviceOrientation) [[UIApplication sharedApplication] statusBarOrientation];

  // We have to rotate device twice to test behavior of rotating to the same deviceOrientation,
  // because device orientation could be unknown, or face up, or face down at this point.
  [EarlGrey rotateDeviceToOrientation:deviceOrientation errorOrNil:nil];
  XCTAssertTrue([UIDevice currentDevice].orientation == deviceOrientation,
                @"Device orientation should match");
  [EarlGrey rotateDeviceToOrientation:deviceOrientation errorOrNil:nil];
  XCTAssertTrue([UIDevice currentDevice].orientation == deviceOrientation,
                @"Device orientation should match");
}

- (void)testInteractingWithElementsAfterRotation {
  NSArray *buttonNames = @[ @"Top Left",
                            @"Top Right",
                            @"Bottom Right",
                            @"Bottom Left",
                            @"Center" ];

  NSArray *orientations = @[ @(UIDeviceOrientationLandscapeLeft),
                             @(UIDeviceOrientationPortraitUpsideDown),
                             @(UIDeviceOrientationLandscapeRight),
                             @(UIDeviceOrientationPortrait),
                             @(UIDeviceOrientationFaceUp),
                             @(UIDeviceOrientationFaceDown) ];

  for (NSNumber *orientation in orientations) {
    [EarlGrey rotateDeviceToOrientation:[orientation intValue] errorOrNil:nil];

    XCTAssertTrue([UIDevice currentDevice].orientation == [orientation intValue],
                  @"Device orientation should match");

    // Tap clear, check if label was reset
    [[EarlGrey selectElementWithMatcher:grey_text(@"Clear")] performAction:grey_tap()];
    [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"lastTapped")]
        assertWithMatcher:grey_text([NSString stringWithFormat:@"Last tapped: None"])];

    // Each of the buttons, when tapped, execute an action that changes the |lastTapped| UILabel
    // to contain their locations. We tap each button then check if the label actually changed.
    for (NSString* buttonName in buttonNames) {
      [[EarlGrey selectElementWithMatcher:grey_text(buttonName)] performAction:grey_tap()];

      [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"lastTapped")]
          assertWithMatcher:grey_text([NSString stringWithFormat:@"Last tapped: %@", buttonName])];
    }
  }
}

@end
