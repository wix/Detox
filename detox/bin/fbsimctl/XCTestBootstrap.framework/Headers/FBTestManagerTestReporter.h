/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class FBTestManagerAPIMediator;
@class FBTestManagerResultSummary;

/**
 An Enumerated Type for Test Report Results.
 */
typedef NS_ENUM(NSUInteger, FBTestReportStatus) {
  FBTestReportStatusUnknown = 0,
  FBTestReportStatusPassed = 1,
  FBTestReportStatusFailed = 2
};

/**
 A Delegate for providing callbacks for Test Reporting progress.
 */
@protocol FBTestManagerTestReporter <NSObject>

/**
 Called when a Test Plan begins Executing.

 @param mediator the mediator starting the Test Plan.
 */
- (void)testManagerMediatorDidBeginExecutingTestPlan:(FBTestManagerAPIMediator *)mediator;

/**
 Called when a Test Suite starts.

 @param mediator the test mediator.
 @param testSuite the Test Suite.
 @param startTime the Suite Start time.
 */
- (void)testManagerMediator:(FBTestManagerAPIMediator *)mediator testSuite:(NSString *)testSuite didStartAt:(NSString *)startTime;

/**
 Called when a Test Case has completed.

 @param mediator the test mediator.
 @param testClass the Test Class.
 @param method the Test Method.
 @param status the status of the test case.
 @param duration the duration of the test case.
 */
- (void)testManagerMediator:(FBTestManagerAPIMediator *)mediator testCaseDidFinishForTestClass:(NSString *)testClass method:(NSString *)method withStatus:(FBTestReportStatus)status duration:(NSTimeInterval)duration;

/**
 Called when a Test Case fails

 @param testClass the Test Class.
 @param method the Test Method.
 @param message the failure message.
 @param file the file name.
 @param line the line number.
 */
- (void)testManagerMediator:(FBTestManagerAPIMediator *)mediator testCaseDidFailForTestClass:(NSString *)testClass method:(NSString *)method withMessage:(NSString *)message file:(NSString *)file line:(NSUInteger)line;

/**
 Called when a Test Bundle is ready.

 @param mediator the test mediator.
 @param protocolVersion ???
 @param minimumVersion ???
 */
- (void)testManagerMediator:(FBTestManagerAPIMediator *)mediator testBundleReadyWithProtocolVersion:(NSInteger)protocolVersion minimumVersion:(NSInteger)minimumVersion;

/**
 Called when a Test Bundle is ready.

 @param mediator the test mediator.
 @param testClass the Test Class.
 @param method the Test Method.
 */
- (void)testManagerMediator:(FBTestManagerAPIMediator *)mediator testCaseDidStartForTestClass:(NSString *)testClass method:(NSString *)method;

/**
 Called when a Test Suite has Finished.

 @param mediator the test mediator.
 @param summary the Test Result Summary.
 */
- (void)testManagerMediator:(FBTestManagerAPIMediator *)mediator finishedWithSummary:(FBTestManagerResultSummary *)summary;

/**
 Called when the Mediator finished it's 'Test Plan'.

 @param mediator the test mediator.
 */
- (void)testManagerMediatorDidFinishExecutingTestPlan:(FBTestManagerAPIMediator *)mediator;

@end
