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

@import XCTest;

/**
 *  Base class for Analytics tests. Extending from this class causes FTRNetworkProxy to be
 *  automatically installed and all network requests captured for the entire duration of the test.
 *  Additionally the analytics config setting is saved in the test suite's set up and restored in
 *  the tear down so the derived classes can modify it without effecting other tests.
 */
@interface FTRBaseAnalyticsTest : XCTestCase

/**
 *  Asserts that the number of analytics requests captured by FTRNetworkProxy is equal to the
 *  specified @c count. The method waits for a maximum of 2.0 seconds for the expected requests to
 *  be sent out, after which it will work with what ever requests have been captured.
 *
 *  @param count The count of expected analytics requests.
 */
+ (void)assertCapturedAnalyticsRequestsCount:(NSInteger)count;

@end
