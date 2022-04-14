//
//  DTXTestCase.m (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

#import "DetoxTester-Swift.h"

@implementation DTXTestCase

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

@end
