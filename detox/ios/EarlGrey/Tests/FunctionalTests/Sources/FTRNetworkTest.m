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

@interface FTRNetworkTest : FTRBaseIntegrationTest
@end

@implementation FTRNetworkTest

- (void)setUp {
  [super setUp];
  [self openTestViewNamed:@"Network Test"];
}

- (void)testSynchronizationWorksWithNSURLConnection {
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"FTRRequestCompletedLabel")]
      assertWithMatcher:grey_notVisible()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"NSURLConnectionTest")]
      performAction:grey_tap()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"FTRRequestCompletedLabel")]
      assertWithMatcher:grey_sufficientlyVisible()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"FTRResponseVerifiedLabel")]
      assertWithMatcher:grey_sufficientlyVisible()];
}

- (void)testSynchronizationWorksWithNSURLSession {
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"FTRRequestCompletedLabel")]
      assertWithMatcher:grey_notVisible()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"NSURLSessionTest")]
      performAction:grey_tap()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"FTRRequestCompletedLabel")]
      assertWithMatcher:grey_sufficientlyVisible()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityID(@"FTRResponseVerifiedLabel")]
      assertWithMatcher:grey_sufficientlyVisible()];
}

@end
