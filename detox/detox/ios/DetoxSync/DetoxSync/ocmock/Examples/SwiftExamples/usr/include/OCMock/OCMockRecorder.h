/*
 *  Copyright (c) 2004-2014 Erik Doernenburg and contributors
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

#import <Foundation/Foundation.h>

@class OCMockObject;
@class OCMInvocationMatcher;


@interface OCMockRecorder : NSProxy
{
    OCMockObject         *mockObject;
    OCMInvocationMatcher *invocationMatcher;
    NSMutableArray       *invocationHandlers;
}

- (id)initWithMockObject:(OCMockObject *)aMockObject;

//- (void)releaseInvocation;

- (id)andReturn:(id)anObject;
- (id)andReturnValue:(NSValue *)aValue;
- (id)andThrow:(NSException *)anException;
- (id)andPost:(NSNotification *)aNotification;
- (id)andCall:(SEL)selector onObject:(id)anObject;
- (id)andDo:(void (^)(NSInvocation *invocation))block;
- (id)andForwardToRealObject;

- (id)classMethod;
- (id)ignoringNonObjectArgs;

- (OCMInvocationMatcher *)invocationMatcher;

- (void)addInvocationHandler:(id)aHandler;
- (NSArray *)invocationHandlers;

@end


@interface OCMockRecorder(Properties)

#define andReturn(aValue) _andReturn(({ typeof(aValue) _v = (aValue); [NSValue value:&_v withObjCType:@encode(typeof(_v))]; }))
@property (nonatomic, readonly) OCMockRecorder *(^ _andReturn)(NSValue *);

#define andThrow(anException) _andThrow(anException)
@property (nonatomic, readonly) OCMockRecorder *(^ _andThrow)(NSException *);

#define andPost(aNotification) _andPost(aNotification)
@property (nonatomic, readonly) OCMockRecorder *(^ _andPost)(NSNotification *);

#define andCall(anObject, aSelector) _andCall(anObject, aSelector)
@property (nonatomic, readonly) OCMockRecorder *(^ _andCall)(id, SEL);

#define andDo(aBlock) _andDo(aBlock)
@property (nonatomic, readonly) OCMockRecorder *(^ _andDo)(void (^)(NSInvocation *));

#define andForwardToRealObject() _andForwardToRealObject()
@property (nonatomic, readonly) OCMockRecorder *(^ _andForwardToRealObject)(void);

@end



