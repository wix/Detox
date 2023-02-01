#import "EXPExpect+Test.h"
#import "FakeTestCase.h"

@implementation EXPExpect (Test)

- (EXPExpect *)test {
  self.testCase = [[FakeTestCase new] autorelease];
  return self;
}

@end
