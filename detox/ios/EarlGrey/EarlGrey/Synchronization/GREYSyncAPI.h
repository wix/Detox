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

#import <EarlGrey/GREYDefines.h>
#import <Foundation/Foundation.h>

/**
 * @file
 * @brief Methods for executing sync or async blocks with EarlGrey operations.
 */

/**
 *  Executes a block containing EarlGrey statements on the main thread and waits for it to
 *  complete. @c block is retained until execution completes.
 *  Important: Must be called from a non-main thread otherwise it will block main thread
 *  indefinitely.
 *
 *  @param block Block that will be executed.
 */
GREY_EXPORT void grey_execute_sync(void (^block)());

/**
 *  Executes a block containing EarlGrey statements on the main thread without waiting for it to
 *  complete. @c block is retained until execution completes.
 *  Can be invoked safely from the main or non-main thread.
 *
 *  @param block Block that will be executed.
 */
GREY_EXPORT void grey_execute_async(void (^block)());
