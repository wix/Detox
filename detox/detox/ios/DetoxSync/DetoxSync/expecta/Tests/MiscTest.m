#import "TestHelper.h"
#import "ExpectaSupport.h"

@interface MiscTest : XCTestCase
@end

@implementation MiscTest

- (void)test_StrippingOfLineBreaksInObjectDescription {
  NSArray *arr = @[@"foo", @"bar"];
  NSSet *set = [NSSet setWithObjects:@"foo", @"bar", nil];
  NSDictionary *dict = @{@"foo": @"bar"};
  expect(EXPDescribeObject(@"\n")).toNot.contain(@"\n");
  expect(EXPDescribeObject(@"\n")).equal(@"\\n");
  expect(EXPDescribeObject(arr)).toNot.contain(@"\n");
  expect(EXPDescribeObject(arr)).equal(@"(foo, bar)");
  expect(EXPDescribeObject(set)).toNot.contain(@"\n");
  expect(EXPDescribeObject(set)).equal(@"{(foo, bar)}");
  expect(EXPDescribeObject(dict)).toNot.contain(@"\n");
  expect(EXPDescribeObject(dict)).equal(@"{foo = bar;}");
}

- (void)test_EXPObjectifyCopiesObjectsWithBlockType
{
    id original = [[NSMutableArray alloc] init];
    id copy = _EXPObjectify(@encode(EXPBasicBlock), original);
    
    expect(original == copy).to.beFalsy();
}

@end
