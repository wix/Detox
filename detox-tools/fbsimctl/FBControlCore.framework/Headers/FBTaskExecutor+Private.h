/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <FBControlCore/FBTaskExecutor.h>

@interface FBTaskExecutor ()

@property (nonatomic, copy, readwrite) NSString *shellPath;
@property (nonatomic, copy, readwrite) NSString *launchPath;
@property (nonatomic, copy, readwrite) NSArray *arguments;
@property (nonatomic, copy, readwrite) NSDictionary *environment;
@property (nonatomic, copy, readwrite) NSString *shellCommand;
@property (nonatomic, copy, readwrite) NSSet *acceptableStatusCodes;
@property (nonatomic, copy, readwrite) NSString *stdOutPath;
@property (nonatomic, copy, readwrite) NSString *stdErrPath;

+ (NSError *)errorForDescription:(NSString *)description;

- (NSTask *)buildTask;

@end

@interface FBTaskExecutor_ShellTask : FBTaskExecutor

@end

@interface FBTaskExecutor_Task : FBTaskExecutor

@end
