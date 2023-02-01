#import "TestHelper.h"

@interface EXPMatchers_postNotificationTest : XCTestCase
@end

@implementation EXPMatchers_postNotificationTest

- (void)test_postNotification {
  assertPass(test_expect(^{
    [[NSNotificationCenter defaultCenter] postNotificationName:@"testNotification1" object:nil];
  }).to.postNotification(@"testNotification1"));

  NSNotification *n1 = [[NSNotification alloc] initWithName:@"testNotification2" object:self userInfo:nil];

  assertPass(test_expect(^{
    [[NSNotificationCenter defaultCenter] postNotification:n1];
  }).to.postNotification(n1));

  NSNotification *n2 = [[NSNotification alloc] initWithName:@"testNotification2" object:self userInfo:@{@"test" : @"value2"}];

  assertPass(test_expect(^{
    [[NSNotificationCenter defaultCenter] postNotificationName:@"testNotification2" object:self userInfo:@{@"test" : @"value2"}];
  }).to.postNotification(n2));

  assertPass(test_expect(^{
    [[NSNotificationCenter defaultCenter] postNotification:n1];
    [[NSNotificationCenter defaultCenter] postNotificationName:@"testNotification2" object:self userInfo:@{@"test" : @"value"}];
  }).to.postNotification(n1));

  assertPass(test_expect(^{
    [[NSNotificationCenter defaultCenter] postNotificationName:@"testNotification1" object:nil];
    [[NSNotificationCenter defaultCenter] postNotificationName:@"testNotification2" object:nil];
  }).to.postNotification(@"testNotification1"));

  assertPass(test_expect(^{
    [[NSNotificationCenter defaultCenter] postNotificationName:@"testNotification2" object:nil];
    [[NSNotificationCenter defaultCenter] postNotificationName:@"testNotification1" object:nil];
  }).to.postNotification(@"testNotification1"));

  assertPass(test_expect(^{
    [[NSNotificationCenter defaultCenter] postNotificationName:@"testNotification2" object:nil];
    [[NSNotificationCenter defaultCenter] postNotificationName:@"testNotification1" object:nil];
    [[NSNotificationCenter defaultCenter] postNotificationName:@"testNotification2" object:nil];
  }).to.postNotification(@"testNotification1"));

  assertPass(test_expect(^{
    [[NSNotificationCenter defaultCenter] postNotificationName:@"testNotification1" object:nil];
    [[NSNotificationCenter defaultCenter] postNotificationName:@"testNotification1" object:nil];
  }).to.postNotification(@"testNotification1"));

  NSObject *object = [NSObject new];

  assertPass(test_expect(^{
    [[NSNotificationCenter defaultCenter] postNotificationName:@"testNotification1" object:object];
  }).to.notify([NSNotification notificationWithName:@"testNotification1" object:object]));

  assertPass(test_expect(^{
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 0.1 * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
      [[NSNotificationCenter defaultCenter] postNotificationName:@"NotificationName" object:nil];
    });
  }).will.postNotification(@"NotificationName"));

  assertFail(test_expect(^{
    // no notification
  }).to.postNotification(@"testNotification2"),
             @"expected: testNotification2, got: none");

  assertFail(test_expect(nil).to.postNotification(@"testNotification"),
             @"the actual value is nil/null");

  assertFail(test_expect(^{
    // no notification
  }).to.postNotification(nil),
             @"the expected value is nil/null");

  assertFail(test_expect(^{
    [[NSNotificationCenter defaultCenter] postNotificationName:@"testNotification1" object:nil];
  }).to.postNotification(@"testNotification2"),
             @"expected: testNotification2, got: none");

  assertFail(test_expect(^{
    // not doing anything
  }).to.postNotification([[NSObject alloc] init]), @"the actual value is not a notification or string");

  assertFail(test_expect(^{
    [[NSNotificationCenter defaultCenter] postNotificationName:@"testNotification2" object:self userInfo:@{@"test" : @"value"}];
  }).to.postNotification(n2), @"expected: testNotification2, got: none");
}

- (void)test_toNot_postNotification {
  assertPass(test_expect(^{
    // no notification
  }).notTo.postNotification(@"testExpectaNotification1"));

  assertFail(test_expect(^{
    [[NSNotificationCenter defaultCenter] postNotificationName:@"testNotification1" object:nil];
  }).toNot.postNotification(@"testNotification1"),
             @"expected: none, got: testNotification1");

  assertPass(test_expect(^{
    [[NSNotificationCenter defaultCenter] postNotificationName:@"testNotification1" object:nil];
  }).notTo.postNotification(@"testNotification2"));

  NSNotification *n1 = [[NSNotification alloc] initWithName:@"testNotification4" object:self userInfo:nil];
  NSNotification *n2 = [[NSNotification alloc] initWithName:@"testNotification4" object:nil userInfo:nil];
  assertPass(test_expect(^{
    [[NSNotificationCenter defaultCenter] postNotification:n1];
  }).toNot.postNotification(n2));

  assertPass(test_expect(^{
    // no notification
  }).willNot.postNotification(@"NotificationName"));

  assertFail(test_expect(nil).toNot.postNotification(@"testNotification"),
             @"the actual value is nil/null");

  assertFail(test_expect(^{
    // no notification
  }).toNot.postNotification(nil),
             @"the expected value is nil/null");

  assertFail(test_expect(^{
    // no notification
  }).toNot.postNotification([[NSObject alloc] init]), @"the actual value is not a notification or string");
}

@end
