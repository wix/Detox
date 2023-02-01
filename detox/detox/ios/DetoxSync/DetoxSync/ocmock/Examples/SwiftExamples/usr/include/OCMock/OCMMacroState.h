/*
 *  Copyright (c) 2014 Erik Doernenburg and contributors
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

@class OCMLocation;
@class OCMockRecorder;


@interface OCMMacroState : NSObject
{
}

+ (void)beginStubMacro;
+ (OCMockRecorder *)endStubMacro;

+ (void)beginExpectMacro;
+ (OCMockRecorder *)endExpectMacro;

+ (void)beginVerifyMacroAtLocation:(OCMLocation *)aLocation;
+ (void)endVerifyMacro;

+ (OCMMacroState *)globalState;

- (void)switchToClassMethod;
- (BOOL)hasSwitchedToClassMethod;

- (void)handleInvocation:(NSInvocation *)anInvocation;

@end
