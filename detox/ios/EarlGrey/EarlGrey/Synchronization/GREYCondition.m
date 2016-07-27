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

#import "Synchronization/GREYCondition.h"

#import "Common/GREYConstants.h"
#import "Common/GREYDefines.h"
#import "Synchronization/GREYUIThreadExecutor.h"

@implementation GREYCondition {
  BOOL (^_conditionBlock)(void);
  NSString *_name;
}

+ (instancetype)conditionWithName:(NSString *)name block:(BOOL(^)(void))conditionBlock {
  return [[GREYCondition alloc] initWithName:name block:conditionBlock];
}

- (instancetype)initWithName:(NSString *)name block:(BOOL(^)(void))conditionBlock {
  NSParameterAssert(name);
  NSParameterAssert(conditionBlock);

  self = [super init];
  if (self) {
    _name = [name copy];
    _conditionBlock = [conditionBlock copy];
  }
  return self;
}

- (BOOL)waitWithTimeout:(CFTimeInterval)seconds {
  NSAssert(seconds >= 0, @"timeout seconds must be >= 0.");

  CFTimeInterval timeout;
  if (seconds == kGREYInfiniteTimeout) {
    timeout = DBL_MAX;
  } else {
    timeout = CACurrentMediaTime() + (seconds > 0 ? seconds : 0);
  }

  CFTimeInterval currentTime;
  BOOL conditionEval;
  do {
    @autoreleasepool {
      // Always drain once before evaluating condition.
      [[GREYUIThreadExecutor sharedInstance] drainOnce];
      currentTime = CACurrentMediaTime();
      conditionEval = _conditionBlock();
    }
  } while (!conditionEval && currentTime <= timeout);

  return conditionEval;
}

- (NSString *)name {
  return _name;
}

@end
