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

#import <Foundation/Foundation.h>

/**
 *  A class for creating boolean conditions. Conditions are specified in form of a block that
 * returns a @c BOOL value indicating whether the condition is met. The condition block is polled
 * continuously on the main thread until it is met or a timeout occurs.
 */
@interface GREYCondition : NSObject

/**
 *  Creates a condition with a block that should return @c YES when the condition is met.
 *
 *  @param name           A descriptive name for the condition
 *  @param conditionBlock The block that will be used to evaluate the condition.
 *
 *  @return A new initialized GREYCondition instance.
 */
+ (instancetype)conditionWithName:(NSString *)name block:(BOOL(^)(void))conditionBlock;

/**
 *  @remark init is not an available initializer. Use the other initializers.
 */
- (instancetype)init NS_UNAVAILABLE;

/**
 *  Initializes a condition with a block that should return @c YES when the condition is met.
 *
 *  @param name           A descriptive name for the condition
 *  @param conditionBlock The block that will be used to evaluate the condition.
 *
 *  @return The initialized instance.
 */
- (instancetype)initWithName:(NSString *)name
                       block:(BOOL(^)(void))conditionBlock NS_DESIGNATED_INITIALIZER;

/**
 *  Waits for the condition to be met until the specified @c seconds have elapsed.
 *
 *  @param seconds Amount of time to wait for the condition to be met, in seconds.
 *
 *  @return @c YES if the condition was met before the timeout, @c NO otherwise.
 */
- (BOOL)waitWithTimeout:(CFTimeInterval)seconds;

/**
 *  @return Name of the condition.
 */
- (NSString *)name;

@end
