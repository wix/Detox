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

#import <EarlGrey/EarlGrey.h>
#import <EarlGrey/GREYPrivate.h>
#import <XCTest/XCTest.h>

#import "GREYExposedForTesting.h"

#define OCMOCK_STRUCT(atype, variable) \
  [NSValue valueWithBytes:&variable objCType:@encode(atype)]

// Base test class for every unit test.
// Each subclass must call through to super's implementation.
@interface GREYBaseTest : XCTestCase

// Currently active runloop mode.
@property(nonatomic, copy) NSString *activeRunLoopMode;

// Returns mocked shared application.
- (id)mockSharedApplication;
// Returns the real (original, unmocked) shared application.
- (id)realSharedApplication;

// Adds |screenshot| to be returned by GREYScreenshotUtil.
// |screenshot| is added to a list of screenshot that will be returned in-order at each invocation
// of takeScreenshot. After exhausting the screenshot list, subsequent invocations will return nil.
- (void)addToScreenshotListReturnedByScreenshotUtil:(UIImage *)screenshot;

#pragma mark - XCTestCase

- (void)setUp;
- (void)tearDown;

@end

@interface GREYScreenshotUtil (UnitTest)

// Original version of the save image method (for related test)
+ (NSString *)greyswizzled_fakeSaveImageAsPNG:(UIImage *)image
                                       toFile:(NSString *)filename
                                  inDirectory:(NSString *)directoryPath;

@end
