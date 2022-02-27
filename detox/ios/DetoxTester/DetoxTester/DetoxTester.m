//
//  DetoxTester.m
//  DetoxTester
//
//  Created by Asaf Korem (Wix.com).
//

#import <XCTest/XCTest.h>

#import "NSInvocation+Utils.h"
#import "DetoxTester-Swift.h"

/// Executes the target tests.
@interface DetoxTester : XCTestCase

@end

@implementation DetoxTester

#pragma mark - Setup methods

- (void)setUp {
  // Continue execution after an `XCTAssert` fails.
  self.continueAfterFailure = YES;

  // Tests must be started by launching the default application (`DetoxTesterApp`).
  XCUIApplication *app = [[XCUIApplication alloc] init];
  [app launch];
}

+ (NSArray<NSInvocation *> *)testInvocations {
  // Override the default test invocations (all methods with `test` prefix) using only the \c start
  // method.
  return @[[NSInvocation createFromSelector:@selector(start) target:self]];
}

- (void)start {
  [DetoxTesterDelegate start];
}

@end
