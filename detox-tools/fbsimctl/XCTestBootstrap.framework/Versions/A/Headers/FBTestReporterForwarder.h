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
@protocol FBTestManagerTestReporter;
@protocol XCTestManager_IDEInterface;

NS_ASSUME_NONNULL_BEGIN

/**
 Converts Low-Level XCTestManager_IDEInterface Messages to their counterparts in FBTestManagerTestReporter, following the forwarding of the original message.
 */
@interface FBTestReporterForwarder : NSObject

/**
 Constructs a Forwarder to a Mediator that also Reports.

 @param mediator the mediator to forward to.
 @param reporter the reporter to report to.
 @return a new mediator.
 */
+ (instancetype)withAPIMediator:(FBTestManagerAPIMediator<XCTestManager_IDEInterface> *)mediator reporter:(id<FBTestManagerTestReporter>)reporter;

@end

NS_ASSUME_NONNULL_END
