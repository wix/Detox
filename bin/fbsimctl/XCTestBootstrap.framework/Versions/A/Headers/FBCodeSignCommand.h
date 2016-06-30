/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <XCTestBootstrap/FBCodesignProvider.h>

/**
 An concrete implementation of a codesigning provider.
 */
@interface FBCodeSignCommand : NSObject <FBCodesignProvider>

/**
 Identity used to codesign bundle
 */
@property (nonatomic, copy, readonly) NSString *identityName;

/**
 @param identityName identity used to codesign bundle
 @return code sign command that signs bundles with given identity
 */
+ (instancetype)codeSignCommandWithIdentityName:(NSString *)identityName;

@end
