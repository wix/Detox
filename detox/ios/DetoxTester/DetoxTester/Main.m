//
//  Main.m (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

#import <XCTest/XCTest.h>

#import "DetoxTester-Swift.h"

/// Executes the target tests.
@interface Main : XCTestCase

@end

/// Utils for \c NSInvocation class.
@interface NSInvocation (Utils)

/// Creates a new invocation instance from given \c selector on given \c target.
+ (NSInvocation *)createFromSelector:(SEL)selector target:(id)target;

@end

#pragma mark - Main

@implementation Main

- (void)setUp {
  // Continue execution after an `XCTAssert` fails.
  self.continueAfterFailure = YES;
}

+ (NSArray<NSInvocation *> *)testInvocations {
  // Overrides the default test invocations (methods with "test" prefix).
  // If Detox testing is active, invokes the `startDetoxTesting` method. Otherwise, invokes the
  // internal unit tests.

  if ([self isDetoxActive]) {
    return @[[NSInvocation createFromSelector:@selector(startDetoxTesting) target:self]];
  }

  return @[];
}

+ (BOOL)isDetoxActive {
  return NSProcessInfo.processInfo.environment[EnvArgKeys.isDetoxActive].boolValue;
}

- (void)startDetoxTesting {
  [DetoxTester startDetoxTestingFrom:self];
}

@end

#pragma mark - NSInvocation Utils

@implementation NSInvocation (Utils)

+ (NSInvocation *)createFromSelector:(SEL)selector target:(id)target {
  NSMethodSignature *signature = [target instanceMethodSignatureForSelector:selector];
  NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:signature];
  invocation.selector = selector;

  return invocation;
}

@end
