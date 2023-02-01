/*
 *  Copyright (c) 2013-2021 Erik Doernenburg and contributors
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
#import <objc/runtime.h>
#import "OCMock.h"


#pragma mark Helper classes

@interface InternalObject : NSObject
{
    NSString *_name;
}
@property(nonatomic, strong) NSString *name;
@end

@interface PublicObject : NSObject
{
    InternalObject *_internal;
};
@property(nonatomic, strong) NSString *name;
@end

@implementation InternalObject

@synthesize name = _name;

@end


@implementation PublicObject

@dynamic name;

- (instancetype)initWithInternal:(InternalObject *)internal
{
    self = [super init];
    if(!self)
        return self;

    _internal = internal;
    return self;
}

- (instancetype)init
{
    return [self initWithInternal:[[InternalObject alloc] init]];
}

- (id)forwardingTargetForSelector:(SEL)selector
{
    if(selector == @selector(name) ||
        selector == @selector(setName:))
        return _internal;
    return [super forwardingTargetForSelector:selector];
}

+ (NSMethodSignature *)instanceMethodSignatureForSelector:(SEL)selector
{
    NSMethodSignature *signature = [super instanceMethodSignatureForSelector:selector];
    if(signature)
        return signature;
    else
        return [InternalObject instanceMethodSignatureForSelector:selector];
}

- (NSMethodSignature *)methodSignatureForSelector:(SEL)selector
{
    NSMethodSignature *signature = [super methodSignatureForSelector:selector];
    if(signature)
        return signature;

    return [[self forwardingTargetForSelector:selector] methodSignatureForSelector:selector];
}

- (BOOL)respondsToSelector:(SEL)selector
{
    if([super respondsToSelector:selector])
        return YES;

    return [[self forwardingTargetForSelector:selector] respondsToSelector:selector];
}

+ (BOOL)instancesRespondToSelector:(SEL)selector
{
    if(class_respondsToSelector(self, selector))
        return YES;

    return [InternalObject instancesRespondToSelector:selector];
}

- (id)valueForUndefinedKey:(NSString *)key
{
    return [_internal valueForKey:key];
}

- (void)setValue:(id)value forUndefinedKey:(NSString *)key
{
    [_internal setValue:value forKey:key];
}

@end


#pragma mark Tests


@interface OCMockForwardingTargetTests : XCTestCase

@end


@implementation OCMockForwardingTargetTests

- (void)testNameShouldForwardToInternal
{
    InternalObject *internal = [[InternalObject alloc] init];
    internal.name = @"Internal Object";
    PublicObject *public = [[PublicObject alloc] initWithInternal:internal];
    XCTAssertEqualObjects(@"Internal Object", public.name);
}

- (void)testStubsMethodImplementation
{
    PublicObject *public = [[PublicObject alloc] init];
    id mock = [OCMockObject partialMockForObject:public];

    [[[mock stub] andReturn:@"FOO"] name];
    XCTAssertEqualObjects(@"FOO", [mock name]);
}

@end
