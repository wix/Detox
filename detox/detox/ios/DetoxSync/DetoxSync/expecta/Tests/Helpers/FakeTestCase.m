#import "FakeTestCase.h"
#import <objc/runtime.h>

@implementation FakeTestCase

- (void)recordFailureWithDescription:(NSString *)description
                              inFile:(NSString *)filename
                              atLine:(NSUInteger)lineNumber
                            expected:(BOOL)expected {
    [NSException raise:description format:@""];
}

@end
