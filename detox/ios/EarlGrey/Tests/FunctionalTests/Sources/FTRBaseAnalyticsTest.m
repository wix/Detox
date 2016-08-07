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

// Not included in public headers.
#import <EarlGrey/GREYAppStateTracker.h>
#import "FTRNetworkProxy.h"

/**
 *  Holds the original config setting for analytics that was present before the test began. We use
 *  this to restore analytics setting when done testing.
 */
static id gOriginalAnalyticsSetting;

@implementation FTRBaseAnalyticsTest

+ (void)setUp {
  [super setUp];
  // Setup proxy to capture all HTTP requests during the test.
  [FTRNetworkProxy ftr_addProxyRuleForUrlsMatchingRegexString:@".*" responseString:@"OK"];
  // Save the analytics config value so that tests can modify it.
  gOriginalAnalyticsSetting = GREY_CONFIG(kGREYConfigKeyAnalyticsEnabled);

  // Always start analytics tests with clean network actvity.
  [self ftr_waitForNetworkActivityToFinish];
  [FTRNetworkProxy ftr_clearRequestsReceived];
}

+ (void)tearDown {
  // Restore analytics setting to its original value and uninstall the proxy.
  [[GREYConfiguration sharedInstance] setValue:gOriginalAnalyticsSetting
                                  forConfigKey:kGREYConfigKeyAnalyticsEnabled];
  [FTRNetworkProxy ftr_removeMostRecentProxyRuleMatchingUrlRegexString:@".*"];
  [super tearDown];
}

+ (void)assertCapturedAnalyticsRequestsCount:(NSInteger)count {
  // Wait for an analytics request to be captured by the proxy.
  [self ftr_waitForNetworkActivityToFinish];
  NSInteger actualCount = [self ftr_countAnalyticsRequests:[FTRNetworkProxy ftr_requestsReceived]];
  NSAssert(count == actualCount,
           @"Received %d count, expected %d", (int)actualCount, (int)count);
}

#pragma mark - Private

/**
 *  @return The count of analytics requests in the specified array of request URL strings.
 */
+ (NSInteger)ftr_countAnalyticsRequests:(NSArray *)requests {
  NSInteger count = 0;
  for (NSString *requestURL in requests) {
    if ([requestURL hasPrefix:@"https://ssl.google-analytics.com/collect?"]) {
      count += 1;
    }
  }
  return count;
}

/**
 *  Waits for all network activity to finish.
 */
+ (void)ftr_waitForNetworkActivityToFinish {
  while ([[GREYAppStateTracker sharedInstance] currentState] & kGREYPendingNetworkRequest) {
    [[GREYUIThreadExecutor sharedInstance] drainOnce];
  }
}

@end
