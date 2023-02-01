/*
 *  Copyright (c) 2020-2021 Erik Doernenburg and contributors
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
#import "OCMFunctionsPrivate.h"
#import "OCMock.h"


@interface NSString (NoEscapeBlock)
@end

@implementation NSString (NoEscapeBlock)

- (void)methodWithNoEscapeBlock:(void(NS_NOESCAPE ^)(void))block
{
}

@end

// Verifies that the block being passed in is a noescape block.
@interface BlockCapturer : NSProxy
@end

@implementation BlockCapturer
{
    XCTestExpectation *expectation;
}

- (instancetype)initWithExpectation:(XCTestExpectation *)anExpectation
{
    expectation = anExpectation;
    return self;
}

- (NSMethodSignature *)methodSignatureForSelector:(SEL)selector
{
    return [NSString instanceMethodSignatureForSelector:selector];
}

- (void)forwardInvocation:(NSInvocation *)invocation
{
    __unsafe_unretained id block;
    [invocation getArgument:&block atIndex:2];
    if(OCMIsNonEscapingBlock(block))
    {
        [expectation fulfill];
    }
}

@end


@interface OCMNoEscapeBlockTests : XCTestCase
@end

@implementation OCMNoEscapeBlockTests

- (void)testThatBlocksAreNoEscape
{
    // This tests that this file is compiled with
    // `-Xclang -fexperimental-optimized-noescape` or equivalent.
    XCTestExpectation *expectation = [self expectationWithDescription:@"Block should be noescape"];
    id blockCapturer = [[BlockCapturer alloc] initWithExpectation:expectation];
    int i = 0;
    [blockCapturer methodWithNoEscapeBlock:^{
        // Force i to be pulled into the closure.
        (void)i;
    }];
    [self waitForExpectationsWithTimeout:0 handler:nil];
}

- (void)testNoEscapeBlocksAreNotRetained
{
    // This tests that OCMock can handle noescape blocks.
    // It crashes if it fails
    id mock = [OCMockObject mockForClass:[NSString class]];
    [[mock stub] methodWithNoEscapeBlock:[OCMArg invokeBlock]];
    int i = 0;
    [mock methodWithNoEscapeBlock:^{
        // Force i to be pulled into the closure.
        (void)i;
    }];
}

@end
