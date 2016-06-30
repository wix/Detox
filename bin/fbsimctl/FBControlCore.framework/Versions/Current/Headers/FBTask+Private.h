/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <FBControlCore/FBTask.h>

@interface FBTask : NSObject<FBTask>

@property (nonatomic, strong, readwrite) NSTask *task;
@property (nonatomic, copy, readwrite) NSSet *acceptableStatusCodes;

@property (nonatomic, copy, readwrite) void (^terminationHandler)(id<FBTask>);

@property (atomic, assign, readwrite) BOOL hasTerminated;
@property (atomic, strong, readwrite) NSError *runningError;

+ (instancetype)taskWithNSTask:(NSTask *)nsTask acceptableStatusCodes:(NSSet *)acceptableStatusCodes stdOutPath:(NSString *)stdOutPath stdErrPath:(NSString *)stdErrPath;

- (NSTask *)decorateTask:(NSTask *)task __attribute__((objc_requires_super));

- (void)teardownTask;
- (void)teardownResources;
- (void)completeTermination;

@end

@interface FBTask_InMemory : FBTask

@property (nonatomic, strong, readwrite) NSPipe *stdOutPipe;
@property (nonatomic, strong, readwrite) NSMutableData *stdOutData;
@property (nonatomic, strong, readwrite) NSPipe *stdErrPipe;
@property (nonatomic, strong, readwrite) NSMutableData *stdErrData;

@end

@interface FBTask_FileBacked : FBTask

@property (nonatomic, copy, readwrite) NSString *stdOutPath;
@property (nonatomic, strong, readwrite) NSFileHandle *stdOutFileHandle;
@property (nonatomic, copy, readwrite) NSString *stdErrPath;
@property (nonatomic, strong, readwrite) NSFileHandle *stdErrFileHandle;

- (instancetype)initWithTask:(NSTask *)task acceptableStatusCodes:(NSSet *)acceptableStatusCodes stdOutPath:(NSString *)stdOutPath stdErrPath:(NSString *)stdErrPath;

@end
