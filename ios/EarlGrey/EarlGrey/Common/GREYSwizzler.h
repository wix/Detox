//
// Copyright 2016 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

#import <Foundation/Foundation.h>

/**
 *  A utility class used for swizzling class and instance methods.
 */
@interface GREYSwizzler : NSObject

/**
 *  Resets the original implementaion of the class method to what it was first swizzled from.
 *
 *  @param methodSelector The selector of the method that was originally swizzled.
 *  @param klass          The class that the method belongs to.
 *
 *  @return @c YES if successfully reset, @c NO otherwise (the method was never swizzled before).
 */
- (BOOL)resetClassMethod:(SEL)methodSelector class:(Class)klass;

/**
 *  Resets the original implementaion of the instance method to what it was first swizzled from.
 *  @c YES if successfully reset, @c NO otherwise (the method is never swizzled before).
 *
 *  @param methodSelector The selector of the method that was originally swizzled.
 *  @param klass          The class that the method belongs to.
 *
 *  @return @c YES if successfully reset, @c NO otherwise (the method was never swizzled before).
 */
- (BOOL)resetInstanceMethod:(SEL)methodSelector class:(Class)klass;

/**
 *  Swizzle class methods of a class. The first time a method is swizzled, its current
 *  implementation will be saved. If @c klass does not directly implement @c methodSelector1
 *  (inherit its superclass implementation), we dynamically override @c methodSelector1 with a
 *  copy of @c methodSelector2's implementation. This is to avoid swizzling the superclass's
 *  implementation. The same happens for @c methodSelector2, if @c klass does not directly
 *  implement @c methodSelector2, it is also added to @c klass.
 *
 *  @param klass           The class whose methods are to be swizzled.
 *  @param methodSelector1 Selector of the method which is to be replaced.
 *  @param methodSelector2 Selector of the method which is to be replaced with.
 *
 *  @return @c YES if methods were successfully swizzled, @c NO otherwise.
 */
- (BOOL)swizzleClass:(Class)klass
    replaceClassMethod:(SEL)methodSelector1
            withMethod:(SEL)methodSelector2;

/**
 *  Swizzle instance methods of a class. The first time a method is swizzled, its current
 *  implementation will be saved. If @c klass does not directly implement @c methodSelector1
 *  (inherit its superclass implementation), we dynamically override @c methodSelector1 with a
 *  copy of @c methodSelector2's implementation. This is to avoid swizzling the superclass's
 *  implementation. The same happens for @c methodSelector2, if @c klass does not directly
 *  implement @c methodSelector2, it is also added to @c klass.
 *
 *  @param klass           The class whose methods are to be swizzled.
 *  @param methodSelector1 Selector of the method which is to be replaced.
 *  @param methodSelector2 Selector of the method which is to be replaced with.
 *
 *  @return @c YES if methods were successfully swizzled, @c NO otherwise.
 */
- (BOOL)swizzleClass:(Class)klass
    replaceInstanceMethod:(SEL)methodSelector1
               withMethod:(SEL)methodSelector2;

/**
 *  Adds @c methodSelector to @c klass bound to the implementation @c imp and swizzles it with
 *  @c sel. @c sel must be an instance method of @c klass and methodSelector must accept the same
 *  parameter and have same return type as @c sel.
 *
 *  @param klass          The class whose methods are to be swizzled.
 *  @param methodSelector The selector that needs to be added.
 *  @param imp            The method implementation that must be bound to @c methodSelector.
 *  @param sel            Selector of the method which is to be replaced.
 *
 *  @return @c YES if the given method could be successfully added and swizzled, @c NO otherwise.
 */
- (BOOL)swizzleClass:(Class)klass
               addInstanceMethod:(SEL)methodSelector
              withImplementation:(IMP)imp
    andReplaceWithInstanceMethod:(SEL)sel;

@end

/**
 *  Invokes the original implementation from inside a swizzled implementation.
 *
 *  @param __returnType  The return type of the original implementation.
 *  @param __swizzledSEL The selector used for swizzling.
 */
#define INVOKE_ORIGINAL_IMP(__returnType, \
                            __swizzledSEL) \
((__returnType(*)(id, \
                  SEL)) \
[self methodForSelector:__swizzledSEL])(self, \
                                        _cmd)

/**
 *  Invokes the original implementation from inside a swizzled implementation. Use this instead of
 *  INVOKE_ORIGINAL_IMP when the original selector takes one argument.
 *
 *  @param __returnType  The return type of the original implementation.
 *  @param __swizzledSEL The selector used for swizzling.
 *  @param __arg1        The first argument to be passed to the original implementation.
 */
#define INVOKE_ORIGINAL_IMP1(__returnType, \
                             __swizzledSEL, \
                             __arg1) \
((__returnType(*)(id, \
                  SEL, \
                  __typeof__(__arg1))) \
[self methodForSelector:__swizzledSEL])(self, \
                                        _cmd, \
                                        __arg1)

/**
 *  Invokes the original implementation from inside a swizzled implementation. Use this instead of
 *  INVOKE_ORIGINAL_IMP when the original selector takes two arguments.
 *
 *  @param __returnType  The return type of the original implementation.
 *  @param __swizzledSEL The selector used for swizzling.
 *  @param __arg1        The first argument to be passed to the original implementation.
 *  @param __arg2        The second argument to be passed to the original implementation.
 */
#define INVOKE_ORIGINAL_IMP2(__returnType, \
                             __swizzledSEL, \
                             __arg1, \
                             __arg2) \
((__returnType(*)(id, \
                  SEL, \
                  __typeof__(__arg1), \
                  __typeof__(__arg2))) \
[self methodForSelector:__swizzledSEL])(self, \
                                        _cmd, \
                                        __arg1, \
                                        __arg2)

/**
 *  Invokes the original implementation from inside a swizzled implementation. Use this instead of
 *  INVOKE_ORIGINAL_IMP when the original selector takes three arguments.
 *
 *  @param __returnType  The return type of the original implementation.
 *  @param __swizzledSEL The selector used for swizzling.
 *  @param __arg1        The first argument to be passed to the original implementation.
 *  @param __arg2        The second argument to be passed to the original implementation.
 *  @param __arg3        The third argument to be passed to the original implementation.
 */
#define INVOKE_ORIGINAL_IMP3(__returnType, \
                             __swizzledSEL, \
                             __arg1, \
                             __arg2, \
                             __arg3) \
((__returnType(*)(id, \
                  SEL, \
                  __typeof__(__arg1), \
                  __typeof__(__arg2), \
                  __typeof__(__arg3))) \
[self methodForSelector:__swizzledSEL])(self, \
                                        _cmd, \
                                        __arg1, \
                                        __arg2, \
                                        __arg3)

/**
 *  Invokes the original implementation from inside a swizzled implementation. Use this instead of
 *  INVOKE_ORIGINAL_IMP when the original selector takes four arguments.
 *
 *  @param __returnType  The return type of the original implementation.
 *  @param __swizzledSEL The selector used for swizzling.
 *  @param __arg1        The first argument to be passed to the original implementation.
 *  @param __arg2        The second argument to be passed to the original implementation.
 *  @param __arg3        The third argument to be passed to the original implementation.
 *  @param __arg4        The forth argument to be passed to the original implementation.
 */
#define INVOKE_ORIGINAL_IMP4(__returnType, \
                             __swizzledSEL, \
                             __arg1, \
                             __arg2, \
                             __arg3, \
                             __arg4) \
((__returnType(*)(id, \
                  SEL, \
                  __typeof__(__arg1), \
                  __typeof__(__arg2), \
                  __typeof__(__arg3), \
                  __typeof__(__arg4))) \
[self methodForSelector:__swizzledSEL])(self, \
                                        _cmd, \
                                        __arg1, \
                                        __arg2, \
                                        __arg3, \
                                        __arg4)

/**
 *  Invokes the original implementation from inside a swizzled implementation. Use this instead of
 *  INVOKE_ORIGINAL_IMP when the original selector takes five arguments.
 *
 *  @param __returnType  The return type of the original implementation.
 *  @param __swizzledSEL The selector used for swizzling.
 *  @param __arg1        The first argument to be passed to the original implementation.
 *  @param __arg2        The second argument to be passed to the original implementation.
 *  @param __arg3        The third argument to be passed to the original implementation.
 *  @param __arg4        The forth argument to be passed to the original implementation.
 *  @param __arg5        The fifth argument to be passed to the original implementation.
 */
#define INVOKE_ORIGINAL_IMP5(__returnType, \
                             __swizzledSEL, \
                             __arg1, \
                             __arg2, \
                             __arg3, \
                             __arg4, \
                             __arg5) \
((__returnType(*)(id, \
                  SEL, \
                  __typeof__(__arg1), \
                  __typeof__(__arg2), \
                  __typeof__(__arg3), \
                  __typeof__(__arg4), \
                  __typeof__(__arg5))) \
[self methodForSelector:__swizzledSEL])(self, \
                                        _cmd, \
                                        __arg1, \
                                        __arg2, \
                                        __arg3, \
                                        __arg4, \
                                        __arg5)

/**
 *  Invokes the original implementation from inside a swizzled implementation. Use this instead of
 *  INVOKE_ORIGINAL_IMP when the original selector takes sixth arguments.
 *
 *  @param __returnType  The return type of the original implementation.
 *  @param __swizzledSEL The selector used for swizzling.
 *  @param __arg1        The first argument to be passed to the original implementation.
 *  @param __arg2        The second argument to be passed to the original implementation.
 *  @param __arg3        The third argument to be passed to the original implementation.
 *  @param __arg4        The forth argument to be passed to the original implementation.
 *  @param __arg5        The fifth argument to be passed to the original implementation.
 *  @param __arg6        The sixth argument to be passed to the original implementation.
 */
#define INVOKE_ORIGINAL_IMP6(__returnType, \
                             __swizzledSEL, \
                             __arg1, \
                             __arg2, \
                             __arg3, \
                             __arg4, \
                             __arg5, \
                             __arg6) \
((__returnType(*)(id, \
                  SEL, \
                  __typeof__(__arg1), \
                  __typeof__(__arg2), \
                  __typeof__(__arg3), \
                  __typeof__(__arg4), \
                  __typeof__(__arg5), \
                  __typeof__(__arg6))) \
[self methodForSelector:__swizzledSEL])(self, \
                                        _cmd, \
                                        __arg1, \
                                        __arg2, \
                                        __arg3, \
                                        __arg4, \
                                        __arg5, \
                                        __arg6)

/**
 *  Invokes the original implementation from inside a swizzled implementation. Use this instead of
 *  INVOKE_ORIGINAL_IMP when the original selector takes seven arguments.
 *
 *  @param __returnType  The return type of the original implementation.
 *  @param __swizzledSEL The selector used for swizzling.
 *  @param __arg1        The first argument to be passed to the original implementation.
 *  @param __arg2        The second argument to be passed to the original implementation.
 *  @param __arg3        The third argument to be passed to the original implementation.
 *  @param __arg4        The forth argument to be passed to the original implementation.
 *  @param __arg5        The fifth argument to be passed to the original implementation.
 *  @param __arg6        The sixth argument to be passed to the original implementation.
 *  @param __arg7        The seventh argument to be passed to the original implementation.
 */
#define INVOKE_ORIGINAL_IMP7(__returnType, \
                             __swizzledSEL, \
                             __arg1, \
                             __arg2, \
                             __arg3, \
                             __arg4, \
                             __arg5, \
                             __arg6, \
                             __arg7) \
((__returnType(*)(id, \
                  SEL, \
                  __typeof__(__arg1), \
                  __typeof__(__arg2), \
                  __typeof__(__arg3), \
                  __typeof__(__arg4), \
                  __typeof__(__arg5), \
                  __typeof__(__arg6), \
                  __typeof__(__arg7))) \
[self methodForSelector:__swizzledSEL])(self, \
                                        _cmd, \
                                        __arg1, \
                                        __arg2, \
                                        __arg3, \
                                        __arg4, \
                                        __arg5, \
                                        __arg6, \
                                        __arg7)
