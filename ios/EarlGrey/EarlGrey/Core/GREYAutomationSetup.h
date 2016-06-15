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
 *  Class responsible for setting up the device for automation and configuring crash handlers.
 */
@interface GREYAutomationSetup : NSObject

/**
 *  @return The singleton instance.
 */
+ (instancetype)sharedInstance;

/**
 *  @remark init is not an available initializer. Use the other initializers.
 */
- (instancetype)init NS_UNAVAILABLE;

/**
 * Prepare the device for automation but doing one-time setup required to enable accessibility
 * and setup crash handlers.
 */
- (void)perform;

@end
