/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <XCTestBootstrap/FBProductBundle.h>

@class FBTestConfiguration;

/**
 Represents test bundle (aka .xctest)
 */
@interface FBTestBundle : FBProductBundle

/**
 The current test configuration file for test bundle
 */
@property (nonatomic, strong, readonly) FBTestConfiguration *configuration;

@end

/**
 Prepares FBTestBundle by:
 - coping it to workingDirectory, if set
 - creating and saving test configuration file if sessionIdentifier is set
 - codesigning bundle with codesigner, if set
 - loading bundle information from Info.plist file
 */
@interface FBTestBundleBuilder : FBProductBundleBuilder

/**
 @param sessionIdentifier session identifier for test configuration
 @return builder
 */
- (instancetype)withSessionIdentifier:(NSUUID *)sessionIdentifier;

/**
 @param error If there is an error, upon return contains an NSError object that describes the problem.
 @return prepared test bundle if the operation succeeds, otherwise nil.
 */
- (FBTestBundle *)buildWithError:(NSError **)error;

@end
