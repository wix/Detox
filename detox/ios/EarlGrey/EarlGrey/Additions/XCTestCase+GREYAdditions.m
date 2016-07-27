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

#import "Additions/XCTestCase+GREYAdditions.h"

#include <objc/runtime.h>

#import "Common/GREYPrivate.h"
#import "Common/GREYSwizzler.h"
#import "Exception/GREYFrameworkException.h"
#import "Synchronization/GREYAppStateTracker.h"
#import "Synchronization/GREYUIThreadExecutor.h"

/**
 *  Current XCTestCase being executed or @c nil if outside the context of a running test.
 */
static XCTestCase *gCurrentExecutingTestCase;

/**
 *  Object-association key to indicate whether setup and teardown have been swizzled.
 */
static const void *const kSetupTearDownSwizzedKey = &kSetupTearDownSwizzedKey;

/**
 *  Object-association key for the localized test outputs for a test case.
 */
static const void *const kLocalizedTestOutputsDirKey = &kLocalizedTestOutputsDirKey;

/**
 *  Object-association key for the status of a test case.
 */
static const void *const kTestCaseStatus = &kTestCaseStatus;

/**
 *  Name of the exception that's thrown to interrupt current test execution.
 */
static NSString *const kInternalTestInterruptException = @"EarlGreyInternalTestInterruptException";

/**
 *  Enumeration with the possible statuses of a XCTestCase.
 */
typedef NS_ENUM(NSUInteger, GREYXCTestCaseStatus) {
  kGREYXCTestCaseStatusUnknown = 0,
  kGREYXCTestCaseStatusPassed,
  kGREYXCTestCaseStatusFailed,
};

// Extern constants.
NSString *const kGREYXCTestCaseInstanceWillSetUp = @"GREYXCTestCaseInstanceWillSetUp";
NSString *const kGREYXCTestCaseInstanceDidSetUp = @"GREYXCTestCaseInstanceDidSetUp";
NSString *const kGREYXCTestCaseInstanceWillTearDown = @"GREYXCTestCaseInstanceWillTearDown";
NSString *const kGREYXCTestCaseInstanceDidTearDown = @"GREYXCTestCaseInstanceDidTearDown";
NSString *const kGREYXCTestCaseInstanceDidPass = @"GREYXCTestCaseInstanceDidPass";
NSString *const kGREYXCTestCaseInstanceDidFail = @"GREYXCTestCaseInstanceDidFail";
NSString *const kGREYXCTestCaseInstanceDidFinish = @"GREYXCTestCaseInstanceDidFinish";
NSString *const kGREYXCTestCaseNotificationKey = @"GREYXCTestCaseNotificationKey";

@implementation XCTestCase (GREYAdditions)

+ (void)load {
  @autoreleasepool {
    GREYSwizzler *swizzler = [[GREYSwizzler alloc] init];
    BOOL swizzleSuccess = [swizzler swizzleClass:self
                           replaceInstanceMethod:@selector(invokeTest)
                                      withMethod:@selector(grey_invokeTest)];
    NSAssert(swizzleSuccess, @"Cannot swizzle XCTestCase invokeTest");

    void (^tearDownBlock)(NSNotification *note) = ^(NSNotification *note) {
      // The time in seconds beyond which if app remains busy, the App state from
      // GREYAppStateTracker will be forced clean.
      static const CFTimeInterval kIdleTimeoutSeconds = 5;

      // Cleanup state tracker state if not idle after 5 seconds.
      BOOL idled =
          [[GREYUIThreadExecutor sharedInstance] drainUntilIdleWithTimeout:kIdleTimeoutSeconds];
      if (!idled) {
        XCTestCase *test = note.userInfo[kGREYXCTestCaseNotificationKey];
        NSLog(@"EarlGrey tried waiting for %.1f seconds for the application to reach an idle "
              @"state. It is now forced to cleanup the state tracker because the test %@ might "
              @"have caused the application to be in a non-idle state indefinitely."
              @"\nFull state tracker description:%@", kIdleTimeoutSeconds, test.name,
              [GREYAppStateTracker sharedInstance]);
        [[GREYAppStateTracker sharedInstance] grey_clearState];
      }
    };

    [[NSNotificationCenter defaultCenter] addObserverForName:kGREYXCTestCaseInstanceDidTearDown
                                                      object:nil
                                                       queue:nil
                                                  usingBlock:tearDownBlock];
  }
}

+ (XCTestCase *)grey_currentTestCase {
  return gCurrentExecutingTestCase;
}

- (NSString *)grey_testMethodName {
  // XCTest.name is represented as "-[<testClassName> <testMethodName>]"
  NSCharacterSet *charsetToStrip =
      [NSMutableCharacterSet characterSetWithCharactersInString:@"-[]"];

  // Resulting string after stripping: <testClassName> <testMethodName>
  NSString *strippedName = [self.name stringByTrimmingCharactersInSet:charsetToStrip];
  // Split string by whitespace.
  NSArray *testClassAndTestMethods =
      [strippedName componentsSeparatedByCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];

  // Test method name will be 2nd item in the array.
  if (testClassAndTestMethods.count <= 1) {
    return nil;
  } else {
    return [testClassAndTestMethods objectAtIndex:1];
  }
}

- (NSString *)grey_testClassName {
  return NSStringFromClass([self class]);
}

- (NSString *)grey_localizedTestOutputsDirectory {
  NSString *localizedTestOutputsDir = objc_getAssociatedObject(self, kLocalizedTestOutputsDirKey);

  if (localizedTestOutputsDir == nil) {
    NSString *testClassName = [self grey_testClassName];
    NSString *testMethodName = [self grey_testMethodName];

    NSAssert(testMethodName, @"There's no current test method for the current test case: %@",
             [XCTestCase grey_currentTestCase]);

    NSArray *documentPaths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory,
                                                                 NSUserDomainMask,
                                                                 YES);
    NSAssert(documentPaths.count > 0,
             @"At least one path for the user documents dir should exist.");
    NSString *testOutputsDir =
        [documentPaths.firstObject stringByAppendingPathComponent:@"earlgrey-test-outputs"];

    NSString *testMethodDirName =
        [NSString stringWithFormat:@"%@-%@", testClassName, testMethodName];
    NSString *testSpecificOutputsDir =
        [testOutputsDir stringByAppendingPathComponent:testMethodDirName];

    localizedTestOutputsDir = [testSpecificOutputsDir stringByStandardizingPath];

    objc_setAssociatedObject(self,
                             kLocalizedTestOutputsDirKey,
                             localizedTestOutputsDir,
                             OBJC_ASSOCIATION_RETAIN);
  }

  return localizedTestOutputsDir;
}

- (void)grey_markAsFailedAtLine:(NSUInteger)line
                         inFile:(NSString *)file
                         reason:(NSString *)reason
              detailDescription:(NSString *)description {
  NSString *fullException =
      [NSString stringWithFormat:@"%@%@\n%@", reason, [NSThread callStackSymbols], description];
  gCurrentExecutingTestCase.continueAfterFailure = NO;
  [gCurrentExecutingTestCase recordFailureWithDescription:fullException
                                                   inFile:file
                                                   atLine:line
                                                 expected:NO];
  [[GREYFrameworkException exceptionWithName:kInternalTestInterruptException
                                      reason:@"Immediately halt execution of testcase"] raise];
}

#pragma mark - Private

- (BOOL)grey_isSwizzled {
  return [objc_getAssociatedObject([self class], kSetupTearDownSwizzedKey) boolValue];
}

- (void)grey_markSwizzled {
  objc_setAssociatedObject([self class], kSetupTearDownSwizzedKey, @(YES), OBJC_ASSOCIATION_RETAIN);
}

- (void)grey_invokeTest {
  @autoreleasepool {
    if (![self grey_isSwizzled]) {
      GREYSwizzler *swizzler = [[GREYSwizzler alloc] init];
      Class selfClass = [self class];
      // Swizzle the setUp and tearDown for this test to allow observing different execution states
      // of the test.
      IMP setUpIMP = [self methodForSelector:@selector(grey_setUp)];
      BOOL swizzleSuccess = [swizzler swizzleClass:selfClass
                                 addInstanceMethod:@selector(grey_setUp)
                                withImplementation:setUpIMP
                      andReplaceWithInstanceMethod:@selector(setUp)];
      NSAssert(swizzleSuccess, @"Cannot swizzle %@ setUp", NSStringFromClass(selfClass));

      // Swizzle tearDown.
      IMP tearDownIMP = [self methodForSelector:@selector(grey_tearDown)];
      swizzleSuccess = [swizzler swizzleClass:selfClass
                            addInstanceMethod:@selector(grey_tearDown)
                           withImplementation:tearDownIMP
                 andReplaceWithInstanceMethod:@selector(tearDown)];
      NSAssert(swizzleSuccess, @"Cannot swizzle %@ tearDown", NSStringFromClass(selfClass));
      [self grey_markSwizzled];
    }

    @try {
      gCurrentExecutingTestCase = self;
      [self grey_setStatus:kGREYXCTestCaseStatusUnknown];

      // We create a new, empty, outputs directory for the test method prior to its invocation.
      NSError *error;
      BOOL success =
          [self grey_createDirRemovingExistingDir:[self grey_localizedTestOutputsDirectory]
                                            error:&error];

      NSAssert(success, @"Failed to create localized outputs directory with error: %@", error);
      INVOKE_ORIGINAL_IMP(void, @selector(grey_invokeTest));

      // The test may have been marked as failed if a failure was recorded with the
      // recordFailureWithDescription:... method. In this case, we can't consider the test has
      // passed.
      if ([self grey_status] != kGREYXCTestCaseStatusFailed) {
        [self grey_setStatus:kGREYXCTestCaseStatusPassed];
      }
    } @catch(NSException *exception) {
      [self grey_setStatus:kGREYXCTestCaseStatusFailed];
      if (![exception.name isEqualToString:kInternalTestInterruptException]) {
        @throw;
      }
    } @finally {
      switch ([self grey_status]) {
        case kGREYXCTestCaseStatusFailed:
          [self grey_sendNotification:kGREYXCTestCaseInstanceDidFail];
          break;
        case kGREYXCTestCaseStatusPassed:
          [self grey_sendNotification:kGREYXCTestCaseInstanceDidPass];
          break;
        case kGREYXCTestCaseStatusUnknown:
          NSAssert(NO, @"Test has finished with unknown status.");
          break;
      }
      [self grey_sendNotification:kGREYXCTestCaseInstanceDidFinish];
      // We only reset the current test case after all possible notifications have been sent.
      gCurrentExecutingTestCase = nil;
    }
  }
}

/**
 *  A swizzled implementation for XCTestCase::setUp.
 *
 *  @remark These methods need to be added to each instance of XCTestCase because we don't expect
 *          test to invoke <tt> [super setUp] </tt>.
 */
- (void)grey_setUp {
  [self grey_sendNotification:kGREYXCTestCaseInstanceWillSetUp];
  INVOKE_ORIGINAL_IMP(void, @selector(grey_setUp));
  [self grey_sendNotification:kGREYXCTestCaseInstanceDidSetUp];
}

/**
 *  A swizzled implementation for XCTestCase::setUp.
 *
 *  @remark These methods need to be added to each instance of XCTestCase because we don't expect
 *          tests to invoke <tt> [super tearDown] </tt>.
 */
- (void)grey_tearDown {
  [self grey_sendNotification:kGREYXCTestCaseInstanceWillTearDown];
  INVOKE_ORIGINAL_IMP(void, @selector(grey_tearDown));
  [self grey_sendNotification:kGREYXCTestCaseInstanceDidTearDown];
}

/**
 *  Posts a notification with the specified @c notificationName using the default
 *  NSNotificationCenter and with the @c userInfo containing the current test case.
 *
 *  @param notificationName Name of the notification to be posted.
 */
- (void)grey_sendNotification:(NSString *)notificationName {
  NSDictionary *userInfo = @{ kGREYXCTestCaseNotificationKey : self };
  [[NSNotificationCenter defaultCenter] postNotificationName:notificationName
                                                      object:self
                                                    userInfo:userInfo];
}

/**
 *  Sets the object-association value for the test status.
 *
 *  @param status The new object-association value for the test status.
 */
- (void)grey_setStatus:(GREYXCTestCaseStatus)status {
  objc_setAssociatedObject([self class], kTestCaseStatus, @(status), OBJC_ASSOCIATION_RETAIN);
}

/**
 *  @return The status of the currently running test.
 */
- (GREYXCTestCaseStatus)grey_status {
  id status = objc_getAssociatedObject([self class], kTestCaseStatus);
  return (GREYXCTestCaseStatus)[status unsignedIntegerValue];
}

/**
 *  Creates a new directory under the specified @c path. If a directory already exists under the
 *  same path, it will be removed and a new, empty dir with the same name will be created.
 *
 *  @param      path     The path where a new directory is to be created.
 *  @param[out] outError A reference to receive errors that may have occured during the execution of
 *                       this method.
 *
 *  @return @c YES on success, @c NO otherwise.
 */
- (BOOL)grey_createDirRemovingExistingDir:(NSString *)path error:(NSError **)outError {
  NSParameterAssert(path);
  NSParameterAssert(outError);

  NSFileManager *manager = [NSFileManager defaultManager];
  BOOL isDirectory;
  if ([manager fileExistsAtPath:path isDirectory:&isDirectory]) {
    if (!isDirectory) {
      NSDictionary *errorUserInfo =
          @{ NSLocalizedDescriptionKey: @"File not deleted as it not a directory." };
      *outError = [NSError errorWithDomain:NSCocoaErrorDomain
                                      code:NSFileReadInvalidFileNameError
                                  userInfo:errorUserInfo];
      return NO;
    }

    if (![manager removeItemAtPath:path error:outError]) {
      return NO;
    }
  }

  return [manager createDirectoryAtPath:path
             withIntermediateDirectories:YES
                              attributes:nil
                                   error:outError];
}

@end

