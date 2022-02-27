//
//  NSInvocation+Utils.m
//  DetoxTester
//
//  Created by Asaf Korem (Wix.com).
//

#import "NSInvocation+Utils.h"

@implementation NSInvocation (Utils)

+ (NSInvocation *)createFromSelector:(SEL)selector target:(id)target {
  NSMethodSignature *signature = [target instanceMethodSignatureForSelector:selector];
  NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:signature];
  invocation.selector = selector;

  return invocation;
}

@end
