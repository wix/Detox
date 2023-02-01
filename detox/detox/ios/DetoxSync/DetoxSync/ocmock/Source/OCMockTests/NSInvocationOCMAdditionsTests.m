/*
 *  Copyright (c) 2006-2021 Erik Doernenburg and contributors
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"); you may
 *  not use these files except in compliance with the License. You may obtain
 *  a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 *  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 *  License for the specific language governing permissions and limitations
 *  under the License.
 */

#import <XCTest/XCTest.h>
#import "NSInvocation+OCMAdditions.h"
#import "OCMArg.h"


@implementation NSValue(OCMTestAdditions)

- (id)initialValue
{
    return nil;
}

- (id)__init
{
    return [self init]; // keep compiler happy
}

- (int)initNonObject
{
    return 0;
}

- (id)ocmtest_initWithLongDouble:(long double)ldbl
{
    return [self initWithBytes:&ldbl objCType:@encode(__typeof__(ldbl))];
}

@end


@interface NSInvocationOCMAdditionsTests : XCTestCase

@end


@implementation NSInvocationOCMAdditionsTests

- (NSInvocation *)invocationForClass:(Class)cls selector:(SEL)selector
{
    NSMethodSignature *signature = [cls instanceMethodSignatureForSelector:selector];
    NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:signature];
    [invocation setSelector:selector];
    return invocation;
}


- (void)testInvocationDescriptionWithNoArguments
{
    NSInvocation *invocation = [self invocationForClass:[NSString class] selector:@selector(lowercaseString)];
    XCTAssertEqualObjects(@"lowercaseString", [invocation invocationDescription], @"");
}

- (void)testInvocationDescriptionWithObjectArgument
{
    NSInvocation *invocation = [self invocationForClass:[NSNumber class] selector:@selector(isEqualToNumber:)];
    // Give it one argument (starts at index 2)
    NSNumber *argument = @1;
    [invocation setArgument:&argument atIndex:2];

    NSString *expected = [NSString stringWithFormat:@"isEqualToNumber:%d", 1];
    XCTAssertEqualObjects(expected, [invocation invocationDescription], @"");
}

- (void)testInvocationDescriptionWithNSStringArgument
{
    NSInvocation *invocation = [self invocationForClass:[NSString class] selector:@selector(isEqualToString:)];
    NSString *argument = @"TEST_STRING";
    [invocation setArgument:&argument atIndex:2];

    NSString *expected = [NSString stringWithFormat:@"isEqualToString:@\"%@\"", @"TEST_STRING"];
    XCTAssertEqualObjects(expected, [invocation invocationDescription], @"");
}

- (void)testInvocationDescriptionWithObjectArguments
{
    NSInvocation *invocation = [self invocationForClass:[NSArray class] selector:@selector(setValue:forKey:)];
    NSNumber *argumentOne = @1;
    NSString *argumentTwo = @"TEST_STRING";
    [invocation setArgument:&argumentOne atIndex:2];
    [invocation setArgument:&argumentTwo atIndex:3];

    NSString *expected = [NSString stringWithFormat:@"setValue:%d forKey:@\"%@\"", 1, @"TEST_STRING"];
    XCTAssertEqualObjects(expected, [invocation invocationDescription], @"");
}

- (void)testInvocationDescriptionWithArrayArgument
{
    NSInvocation *invocation = [self invocationForClass:[NSMutableArray class] selector:@selector(addObjectsFromArray:)];
    NSArray *argument = @[ @"TEST_STRING" ];
    [invocation setArgument:&argument atIndex:2];

    NSString *expected = [NSString stringWithFormat:@"addObjectsFromArray:%@", [argument description]];
    XCTAssertEqualObjects(expected, [invocation invocationDescription], @"");
}

- (void)testInvocationDescriptionWithIntArgument
{
    NSInvocation *invocation = [self invocationForClass:[NSNumber class] selector:@selector(initWithInt:)];
    int argumentOne = 1;
    [invocation setArgument:&argumentOne atIndex:2];

    NSString *expected = [NSString stringWithFormat:@"initWithInt:%d", 1];
    XCTAssertEqualObjects(expected, [invocation invocationDescription], @"");
}

- (void)testInvocationDescriptionWithUnsignedIntArgument
{
    NSInvocation *invocation = [self invocationForClass:[NSNumber class] selector:@selector(initWithUnsignedInt:)];
    unsigned int argumentOne = 1;
    [invocation setArgument:&argumentOne atIndex:2];

    NSString *expected = [NSString stringWithFormat:@"initWithUnsignedInt:%d", 1];
    XCTAssertEqualObjects(expected, [invocation invocationDescription], @"");
}

- (void)testInvocationDescriptionWithBoolArgument
{
    NSInvocation *invocation = [self invocationForClass:[NSNumber class] selector:@selector(initWithBool:)];
    BOOL argumentOne = TRUE;
    [invocation setArgument:&argumentOne atIndex:2];

    NSString *expected = [NSString stringWithFormat:@"initWithBool:YES"];
    XCTAssertEqualObjects(expected, [invocation invocationDescription], @"");
}

- (void)testInvocationDescriptionWithCharArgument
{
    NSInvocation *invocation = [self invocationForClass:[NSNumber class] selector:@selector(initWithChar:)];
    char argumentOne = 'd';
    [invocation setArgument:&argumentOne atIndex:2];

    NSString *expected = [NSString stringWithFormat:@"initWithChar:'%c'", argumentOne];
    XCTAssertEqualObjects(expected, [invocation invocationDescription], @"");
}

- (void)testInvocationDescriptionWithUnsignedCharArgument
{
    NSInvocation *invocation = [self invocationForClass:[NSNumber class] selector:@selector(initWithUnsignedChar:)];
    unsigned char argumentOne = 'd';
    [invocation setArgument:&argumentOne atIndex:2];

    NSString *expected = [NSString stringWithFormat:@"initWithUnsignedChar:'%c'", argumentOne];
    XCTAssertEqualObjects(expected, [invocation invocationDescription], @"");
}

- (void)testInvocationDescriptionWithDoubleArgument
{
    NSInvocation *invocation = [self invocationForClass:[NSNumber class] selector:@selector(initWithDouble:)];
    double argumentOne = 1;
    [invocation setArgument:&argumentOne atIndex:2];

    NSString *expected = [NSString stringWithFormat:@"initWithDouble:%f", argumentOne];
    XCTAssertEqualObjects(expected, [invocation invocationDescription], @"");
}

- (void)testInvocationDescriptionWithFloatArgument
{
    NSInvocation *invocation = [self invocationForClass:[NSNumber class] selector:@selector(initWithFloat:)];
    float argumentOne = 1;
    [invocation setArgument:&argumentOne atIndex:2];

    NSString *expected = [NSString stringWithFormat:@"initWithFloat:%f", argumentOne];
    XCTAssertEqualObjects(expected, [invocation invocationDescription], @"");
}

- (void)testInvocationDescriptionWithLongDoubleArgument
{
    NSInvocation *invocation = [self invocationForClass:[NSValue class] selector:@selector(ocmtest_initWithLongDouble:)];
    long double argumentOne = 1;
    [invocation setArgument:&argumentOne atIndex:2];

    NSString *expected = [NSString stringWithFormat:@"ocmtest_initWithLongDouble:%Lf", argumentOne];
    XCTAssertEqualObjects(expected, [invocation invocationDescription], @"");
}

- (void)testInvocationDescriptionWithLongArgument
{
    NSInvocation *invocation = [self invocationForClass:[NSNumber class] selector:@selector(initWithLong:)];
    long argumentOne = 1;
    [invocation setArgument:&argumentOne atIndex:2];

    NSString *expected = [NSString stringWithFormat:@"initWithLong:%ld", argumentOne];
    XCTAssertEqualObjects(expected, [invocation invocationDescription], @"");
}

- (void)testInvocationDescriptionWithUnsignedLongArgument
{
    NSInvocation *invocation = [self invocationForClass:[NSNumber class] selector:@selector(initWithUnsignedLong:)];
    unsigned long argumentOne = 1;
    [invocation setArgument:&argumentOne atIndex:2];

    NSString *expected = [NSString stringWithFormat:@"initWithUnsignedLong:%lu", argumentOne];
    XCTAssertEqualObjects(expected, [invocation invocationDescription], @"");
}

- (void)testInvocationDescriptionWithLongLongArgument
{
    NSInvocation *invocation = [self invocationForClass:[NSNumber class] selector:@selector(initWithLongLong:)];
    long long argumentOne = 1;
    [invocation setArgument:&argumentOne atIndex:2];

    NSString *expected = [NSString stringWithFormat:@"initWithLongLong:%qi", argumentOne];
    XCTAssertEqualObjects(expected, [invocation invocationDescription], @"");
}

- (void)testInvocationDescriptionWithUnsignedLongLongArgument
{
    NSInvocation *invocation = [self invocationForClass:[NSNumber class] selector:@selector(initWithUnsignedLongLong:)];
    unsigned long long argumentOne = 1;
    [invocation setArgument:&argumentOne atIndex:2];

    NSString *expected = [NSString stringWithFormat:@"initWithUnsignedLongLong:%qu", argumentOne];
    XCTAssertEqualObjects(expected, [invocation invocationDescription], @"");
}

- (void)testInvocationDescriptionWithShortArgument
{
    NSInvocation *invocation = [self invocationForClass:[NSNumber class] selector:@selector(initWithShort:)];
    short argumentOne = 1;
    [invocation setArgument:&argumentOne atIndex:2];

    NSString *expected = [NSString stringWithFormat:@"initWithShort:%hi", argumentOne];
    XCTAssertEqualObjects(expected, [invocation invocationDescription], @"");
}

- (void)testInvocationDescriptionWithUnsignedShortArgument
{
    NSInvocation *invocation = [self invocationForClass:[NSNumber class] selector:@selector(initWithUnsignedShort:)];
    unsigned short argumentOne = 1;
    [invocation setArgument:&argumentOne atIndex:2];

    NSString *expected = [NSString stringWithFormat:@"initWithUnsignedShort:%hu", argumentOne];
    XCTAssertEqualObjects(expected, [invocation invocationDescription], @"");
}

- (void)testInvocationDescriptionWithStructArgument
{
    NSInvocation *invocation = [self invocationForClass:[NSString class] selector:@selector(substringWithRange:)];
    NSRange range;
    range.location = 2;
    range.length = 4;
    [invocation setArgument:&range atIndex:2];

    NSString *expected = @"substringWithRange:(NSRange: {2, 4})";
    XCTAssertEqualObjects(expected, [invocation invocationDescription], @"");
}

- (void)testInvocationDescriptionWithCStringArgument
{
    NSInvocation *invocation = [self invocationForClass:[NSString class] selector:@selector(initWithUTF8String:)];
    NSString *string = @"A string that is longer than 100 characters. 123456789 123456789 123456789 123456789 123456789 123456789";
    const char *cString = [string UTF8String];
    [invocation setArgument:&cString atIndex:2];

    NSString *expected = [NSString stringWithFormat:@"initWithUTF8String:\"%@...\"", [string substringToIndex:100]];
    XCTAssertEqualObjects(expected, [invocation invocationDescription], @"");
}

- (void)testInvocationDescriptionWithCStringArgumentAnyPointer
{
    NSInvocation *invocation = [self invocationForClass:[NSString class] selector:@selector(initWithUTF8String:)];
    const char *cString = [OCMArg anyPointer];
    [invocation setArgument:&cString atIndex:2];

    XCTAssertEqualObjects(@"initWithUTF8String:<[OCMArg anyPointer]>", [invocation invocationDescription]);
}

- (void)testInvocationDescriptionWithSelectorArgument
{
    NSInvocation *invocation = [self invocationForClass:[NSString class] selector:@selector(respondsToSelector:)];
    SEL selectorValue = @selector(testInvocationDescriptionWithSelectorArgument);
    [invocation setArgument:&selectorValue atIndex:2];

    NSString *expected = [NSString stringWithFormat:@"respondsToSelector:@selector(%@)", NSStringFromSelector(selectorValue)];
    XCTAssertEqualObjects(expected, [invocation invocationDescription], @"");
}

- (void)testInvocationDescriptionWithPointerArgument
{
    NSInvocation *invocation = [self invocationForClass:[NSData class] selector:@selector(initWithBytes:length:)];
    NSData *data = [@"foo" dataUsingEncoding:NSUTF8StringEncoding];
    const void *bytes = [[@"foo" dataUsingEncoding:NSUTF8StringEncoding] bytes];
    NSUInteger length = [data length];
    [invocation setArgument:&bytes atIndex:2];
    [invocation setArgument:&length atIndex:3];

    NSString *expected1 = [NSString stringWithFormat:@"initWithBytes:"];
    NSString *expected2 = [NSString stringWithFormat:@"length:%lu", (unsigned long)length];
    NSString *invocationDescription = [invocation invocationDescription];
    XCTAssertTrue([invocationDescription rangeOfString:expected1].length > 0, @"");
    XCTAssertTrue([invocationDescription rangeOfString:expected2].length > 0, @"");
}

- (void)testInvocationDescriptionWithPointerArgumentAnyPointer
{
    NSInvocation *invocation = [self invocationForClass:[NSData class] selector:@selector(initWithBytes:length:)];
    const void *bytes = [OCMArg anyPointer];
    NSUInteger length = 1500;
    [invocation setArgument:&bytes atIndex:2];
    [invocation setArgument:&length atIndex:3];

    NSString *expected = [NSString stringWithFormat:@"initWithBytes:<[OCMArg anyPointer]> length:%lu", (unsigned long)length];
    NSString *invocationDescription = [invocation invocationDescription];
    XCTAssertEqualObjects(expected, invocationDescription);
}


- (void)testInvocationDescriptionWithNilArgument
{
    NSInvocation *invocation = [self invocationForClass:[NSString class] selector:@selector(initWithString:)];
    NSString *argString = nil;
    [invocation setArgument:&argString atIndex:2];

    NSString *expected = [NSString stringWithFormat:@"initWithString:nil"];
    XCTAssertEqualObjects(expected, [invocation invocationDescription], @"");
}

- (void)testCategorizesInitMethodFamilyCorrectly
{
    NSInvocation *invocation;

    invocation = [self invocationForClass:[NSString class] selector:@selector(init)];
    XCTAssertTrue([invocation methodIsInInitFamily]);

    invocation = [self invocationForClass:[NSString class] selector:@selector(initWithString:)];
    XCTAssertTrue([invocation methodIsInInitFamily]);

    invocation = [self invocationForClass:[NSValue class] selector:@selector(__init)];
    XCTAssertTrue([invocation methodIsInInitFamily]);

    invocation = [self invocationForClass:[NSObject class] selector:@selector(copy)];
    XCTAssertFalse([invocation methodIsInInitFamily]);

    invocation = [self invocationForClass:[NSValue class] selector:@selector(initialValue)];
    XCTAssertFalse([invocation methodIsInInitFamily]);

    invocation = [self invocationForClass:[NSValue class] selector:@selector(initNonObject)];
    XCTAssertFalse([invocation methodIsInInitFamily]);
}

- (void)testSetsDefaultValuesForNumberTypesWhenCreatingBlockInvocations
{
    void (^block)(NSInteger) = ^void (NSInteger aNumber) { /* do nothing */ };
    NSInvocation *invocation = [NSInvocation invocationForBlock:block withArguments:@[[NSNull null]]];

    NSInteger arg = -1;
    [invocation getArgument:&arg atIndex:1];
    XCTAssertEqual(0, arg);
}

@end
