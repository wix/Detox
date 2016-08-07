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

#import <EarlGrey/GREYSwizzler.h>

#import "FTRBaseIntegrationTest.h"

@interface FTROrientationPortraitOnlyChangeTest : FTRBaseIntegrationTest
@end

@implementation UIApplication (Test)

- (NSUInteger)grey_supportedInterfaceOrientationsForWindow:(UIWindow *)window {
  return UIInterfaceOrientationMaskPortrait;
}

@end

@implementation FTROrientationPortraitOnlyChangeTest {
  GREYSwizzler *_swizzler;
}

- (void)setUp {
  [super setUp];

  // Swizzle supportedInterfaceOrientationsForWindow: for the test to make orientations other than
  // portrait unsupported by the app.
  _swizzler = [[GREYSwizzler alloc] init];
  BOOL swizzle = [_swizzler swizzleClass:[UIApplication class]
                   replaceInstanceMethod:@selector(supportedInterfaceOrientationsForWindow:)
                              withMethod:@selector(grey_supportedInterfaceOrientationsForWindow:)];
  NSAssert(swizzle, @"Cannot swizzle UIApplication supportedInterfaceOrientationsForWindow:");
}

- (void)tearDown {
  // Undo swizzling.
  BOOL swizzle1 = [_swizzler resetInstanceMethod:@selector(supportedInterfaceOrientationsForWindow:)
                                           class:[UIApplication class]];
  BOOL swizzle2 =
      [_swizzler resetInstanceMethod:@selector(grey_supportedInterfaceOrientationsForWindow:)
                               class:[UIApplication class]];

  [super tearDown];

  // Assert undoing swizzling was successful after tearDown is complete.
  NSAssert(swizzle1 && swizzle2,
           @"Failed to undo swizzling of supportedInterfaceOrientationsForWindow:");
}

- (void)testRotateToUnsupportedOrientation {
  [EarlGrey rotateDeviceToOrientation:UIDeviceOrientationPortrait errorOrNil:nil];

  [EarlGrey rotateDeviceToOrientation:UIDeviceOrientationLandscapeLeft errorOrNil:nil];
  XCTAssertTrue([UIDevice currentDevice].orientation == UIDeviceOrientationLandscapeLeft,
                @"Device orientation should now be landscape left");
  XCTAssertTrue([UIApplication sharedApplication].statusBarOrientation ==
                UIInterfaceOrientationPortrait,
                @"Interface orientation should remain portrait");
}

- (void)testDeviceChangeWithoutInterfaceChange {
  [EarlGrey rotateDeviceToOrientation:UIDeviceOrientationPortrait errorOrNil:nil];

  [EarlGrey rotateDeviceToOrientation:UIDeviceOrientationLandscapeLeft errorOrNil:nil];
  BOOL isStatusBarOrientationPortrait =
      UIInterfaceOrientationIsPortrait([UIApplication sharedApplication].statusBarOrientation);
  XCTAssertTrue(isStatusBarOrientationPortrait, @"Status Bar orientation should be Portrait.");
  [EarlGrey rotateDeviceToOrientation:UIDeviceOrientationPortrait errorOrNil:nil];
  XCTAssertTrue([UIDevice currentDevice].orientation == UIDeviceOrientationPortrait,
                @"Device orientation should now be portrait");
  XCTAssertTrue([UIApplication sharedApplication].statusBarOrientation ==
                UIInterfaceOrientationPortrait,
                @"Interface orientation should remain portrait");
}

@end
