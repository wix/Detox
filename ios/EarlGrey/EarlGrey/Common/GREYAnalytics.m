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

#import "Common/GREYAnalytics.h"

#import <XCTest/XCTest.h>

#import "Additions/NSString+GREYAdditions.h"
#import "Additions/XCTestCase+GREYAdditions.h"

/**
 *  The Analytics tracking ID that receives EarlGrey usage data.
 */
static NSString *const kTrackingID = @"UA-54227235-2";

/**
 *  The event category under which the analytics data is to be sent.
 */
static NSString *const kAnalyticsInvocationCategory = @"Test Invocation";

/**
 *  The endpoint that receives EarlGrey usage data.
 */
static NSString *const kTrackingEndPoint = @"https://ssl.google-analytics.com";

@implementation GREYAnalytics

+ (void)trackTestCaseCompletion {
  NSString *bundleID = [[NSBundle mainBundle] bundleIdentifier];
  // If appId is available use an MD5 of it otherwise use a placeholder.
  bundleID = bundleID ? [bundleID grey_md5String] : @"<Missing bundle ID>";
  NSString *payload =
      [self grey_eventPayloadWithCategory:kAnalyticsInvocationCategory
                              subCategory:bundleID
                                    value:@([[XCTestSuite defaultTestSuite] testCaseCount])];

  NSURL *url = [NSURL URLWithString:payload
                      relativeToURL:[NSURL URLWithString:kTrackingEndPoint]];
  [[[NSURLSession sharedSession] dataTaskWithURL:url
                               completionHandler:^(NSData *data,
                                                   NSURLResponse *response,
                                                   NSError *error) {
    if (error) {
      // Failed to send analytics data, but since the test might be running in a sandboxed
      // environment it's not a good idea to freeze or throw assertions, let's just log and move on.
      NSLog(@"Failed to send analytics data due to %@.", error);
    }
  }] resume];
}

#pragma mark - Private

/**
 *  Creates an Analytics Event payload based on @c kPayloadFormat and URL encodes it.
 *  @see https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#event for
 *  more info on Analytics Events and its parameters.
 *
 *  @param category    The category value to be used for the created Analytics Event payload.
 *  @param subCategory The sub-category value to be used for the created Analytics Event payload.
 *  @param valueOrNil  The value to be used for the created Analytics Event payload. The value
 *                     can be @c nil to indicate that value is not to be added to the payload.
 *
 *  @return A URL encoded string for the Analytics Event payload with the specified parameters.
 */
+ (NSString *)grey_eventPayloadWithCategory:(NSString *)category
                                subCategory:(NSString *)subCategory
                                      value:(NSNumber *)valueOrNil {
  NSAssert([category length], @"Category can't be nil or empty.");
  NSAssert([subCategory length], @"Sub category can't be nil or empty.");

  // Initialize the payload with version(=1), tracking ID, client ID, category and sub category.
  NSMutableString *payload =
      [[NSMutableString alloc] initWithFormat:@"collect?v=1&tid=%@&cid=%@&t=event&ec=%@&ea=%@",
                                              kTrackingID, @(arc4random()), category, subCategory];
  // Append event value if present.
  if (valueOrNil) {
    [payload appendFormat:@"&ev=%@", valueOrNil];
  }

  // Return an url-encoded payload.
  NSCharacterSet *allowedCharacterSet = [NSCharacterSet URLQueryAllowedCharacterSet];
  return [payload stringByAddingPercentEncodingWithAllowedCharacters:allowedCharacterSet];
}

@end
