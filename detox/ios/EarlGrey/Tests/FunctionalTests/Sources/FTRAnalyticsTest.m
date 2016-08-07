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

#import "FTRBaseAnalyticsTest.h"

// Analytics shouldn't be sent when test cases don't call into Earlgrey.
static BOOL gAnalyticsShouldBeSent = NO;

@interface FTRAnalyticsTest : FTRBaseAnalyticsTest
@end

@implementation FTRAnalyticsTest

- (void)testAnalyticsIsEnabled {
  gAnalyticsShouldBeSent = NO;
  // Verify that analytics is enabled by default.
  XCTAssertTrue(GREY_CONFIG_BOOL(kGREYConfigKeyAnalyticsEnabled));
}

- (void)testAnalyticsNotSent {
  gAnalyticsShouldBeSent = YES;
  [EarlGrey rotateDeviceToOrientation:UIDeviceOrientationPortrait errorOrNil:nil];
  // Verify that analytics is enabled by default.
  XCTAssertTrue(GREY_CONFIG_BOOL(kGREYConfigKeyAnalyticsEnabled));
}

+ (void)tearDown {
  if (gAnalyticsShouldBeSent) {
    // The instance tear down method must have been invoked by now and since analytics should be
    // sent, a single analytics request should have been sent out.
    [self assertCapturedAnalyticsRequestsCount:1];
  } else {
    // No analytics request should have been sent out.
    [self assertCapturedAnalyticsRequestsCount:0];
  }
  [super tearDown];
}

@end
