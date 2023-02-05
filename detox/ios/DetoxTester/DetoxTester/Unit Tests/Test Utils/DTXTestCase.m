//
//  DTXTestCase.m (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

#import "DetoxTester-Swift.h"

@implementation DTXTestCase

// TODO: add logs for test case lifecycle

- (void)setUp {
    self.continueAfterFailure = NO;
}

+ (NSArray<NSInvocation *> *)testInvocations {
  // Overrides the default test invocations (methods with "test" prefix).
  // If Detox testing is active, invokes no method. Otherwise, returns the default test invocations.
  return self.isDetoxActive ? @[] : [super testInvocations];
}

+ (BOOL)isDetoxActive {
  return NSProcessInfo.processInfo.environment[EnvArgKeys.isDetoxActive].boolValue;
}

- (BOOL)tearDownWithError:(NSError *__autoreleasing  _Nullable *)error {
  [TestCaseLogger log:@"DTXTestCase `tearDownWithError()` called" type:OS_LOG_TYPE_DEBUG];

  return [super tearDownWithError:error];
}

- (void)tearDown {
  [TestCaseLogger log:@"DTXTestCase `tearDown()` called" type:OS_LOG_TYPE_DEBUG];
  
  [super tearDown];
}

- (NSTimeInterval)executionTimeAllowance {
  return INFINITY;
}

@end
