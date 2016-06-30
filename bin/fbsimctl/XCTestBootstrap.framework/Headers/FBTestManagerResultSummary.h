/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <XCTestBootstrap/FBTestManagerTestReporter.h>

NS_ASSUME_NONNULL_BEGIN

/**
 A Summary of Test Results.
 */
@interface FBTestManagerResultSummary : NSObject

/**
 Constructs a Result Summary from Test Delegate Arguments.
 */
+ (instancetype)fromTestSuite:(NSString *)testSuite finishingAt:(NSString *)finishTime runCount:(NSNumber *)runCount failures:(NSNumber *)failuresCount unexpected:(NSNumber *)unexpectedFailureCount testDuration:(NSNumber *)testDuration totalDuration:(NSNumber *)totalDuration;

@property (nonatomic, copy, readonly) NSString *testSuite;
@property (nonatomic, copy, readonly) NSDate *finishTime;
@property (nonatomic, assign, readonly) NSInteger runCount;
@property (nonatomic, assign, readonly) NSInteger failureCount;
@property (nonatomic, assign, readonly) NSInteger unexpected;
@property (nonatomic, assign, readonly) NSTimeInterval testDuration;
@property (nonatomic, assign, readonly) NSTimeInterval totalDuration;

+ (FBTestReportStatus)statusForStatusString:(NSString *)statusString;

@end

NS_ASSUME_NONNULL_END
