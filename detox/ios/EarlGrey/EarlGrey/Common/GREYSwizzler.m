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

#import "Common/GREYSwizzler.h"

#include <dlfcn.h>
#include <objc/runtime.h>

#import "Common/GREYDefines.h"

typedef enum {
  GREYMethodTypeClass,
  GREYMethodTypeInstance
} GREYMethodType;

#pragma mark - GREYImpHolder

/**
 *  Utility class to hold original implementation of a method of a class. Used to reset the original
 *  implementation of a method.
 */
@interface GREYImpHolder : NSObject

/**
 *  @remark init is not an available initializer. Use the other initializers.
 */
- (instancetype)init NS_UNAVAILABLE;

- (instancetype)initWithClass:(Class)klass
                       method:(SEL)sel
                         type:(GREYMethodType)type
               implementation:(IMP)imp NS_DESIGNATED_INITIALIZER;

- (void)resetMethod;

@end

@implementation GREYImpHolder {
  Class _klass;
  Method _method;
  IMP _imp;
}

- (instancetype)initWithClass:(Class)klass
                       method:(SEL)sel
                         type:(GREYMethodType)type
               implementation:(IMP)imp {
  self = [super init];
  if (self) {
    _klass = klass;
    _imp = imp;
    if (type == GREYMethodTypeClass) {
      _method = class_getClassMethod(_klass, sel);
    } else if (type == GREYMethodTypeInstance) {
      _method = class_getInstanceMethod(_klass, sel);
    } else {
      NSAssert(NO, @"Unknown method type");
    }
  }
  return self;
}

- (void)resetMethod {
  method_setImplementation(_method, _imp);
}

@end

#pragma mark - GREYSwizzler

@implementation GREYSwizzler {
  NSMutableDictionary *_originalMethodImpls;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _originalMethodImpls = [[NSMutableDictionary alloc] init];
  }
  return self;
}

- (BOOL)resetClassMethod:(SEL)methodSelector class:(Class)klass {
  if (!klass || !methodSelector) {
    NSLog(@"Nil Parameter(s) found when swizzling.");
    return NO;
  }

  NSString *key = [self grey_keyForClass:klass method:methodSelector type:GREYMethodTypeClass];
  GREYImpHolder *holder = _originalMethodImpls[key];
  if (holder) {
    [holder resetMethod];
    [_originalMethodImpls removeObjectForKey:key];
    return YES;
  } else {
    NSLog(@"IMP Holder was nil for class: %@ and selector: %@",
          NSStringFromClass(klass),
          NSStringFromSelector(methodSelector));
    return NO;
  }
}

/**
 *  The reset method here doesn't "remove" the method, but simply redirects it to an empty selector
 *  hence NSObject::respondsToSelector and @c class_getInstanceMethod will still work.
 *
 *  @param methodSelector The selector of the instance method to be reset.
 *  @param klass          The class to which the given @c methodSelector belongs.
 *
 *  @return @c YES on success, @c NO otherwise.
 */
- (BOOL)resetInstanceMethod:(SEL)methodSelector class:(Class)klass {
  if (!klass || !methodSelector) {
    NSLog(@"Nil Parameter(s) found when swizzling.");
    return NO;
  }

  NSString *key = [self grey_keyForClass:klass method:methodSelector type:GREYMethodTypeInstance];
  GREYImpHolder *holder = _originalMethodImpls[key];
  if (holder) {
    [holder resetMethod];
    [_originalMethodImpls removeObjectForKey:key];
    return YES;
  } else {
    NSLog(@"IMP Holder was nil for class: %@ and selector: %@",
          NSStringFromClass(klass),
          NSStringFromSelector(methodSelector));
    return NO;
  }
}

- (BOOL)swizzleClass:(Class)klass
    replaceClassMethod:(SEL)methodSelector1
            withMethod:(SEL)methodSelector2 {
  if (!klass || !methodSelector1 || !methodSelector2) {
    NSLog(@"Nil Parameter(s) found when swizzling.");
    return NO;
  }

  Method method1 = class_getClassMethod(klass, methodSelector1);
  Method method2 = class_getClassMethod(klass, methodSelector2);
  // Only swizzle if both methods found
  if (method1 && method2) {
    // Try to save the current implementations
    IMP imp1 = method_getImplementation(method1);
    [self grey_saveMethod:methodSelector1 type:GREYMethodTypeClass class:klass implementation:imp1];
    IMP imp2 = method_getImplementation(method2);
    [self grey_saveMethod:methodSelector2 type:GREYMethodTypeClass class:klass implementation:imp2];

    // To add a class method, we need to get the class meta first.
    // http://stackoverflow.com/questions/9377840/how-to-dynamically-add-a-class-method
    Class classMeta = object_getClass(klass);
    if (class_addMethod(classMeta, methodSelector1, imp2, method_getTypeEncoding(method2))) {
      class_replaceMethod(classMeta, methodSelector2, imp1, method_getTypeEncoding(method1));
    } else {
      method_exchangeImplementations(method1, method2);
    }

    return YES;
  } else {
    NSLog(@"Swizzling Method(s) not found while swizzling class %@.", NSStringFromClass(klass));
    return NO;
  }
}

- (BOOL)swizzleClass:(Class)klass
    replaceInstanceMethod:(SEL)methodSelector1
               withMethod:(SEL)methodSelector2 {
  if (!klass || !methodSelector1 || !methodSelector2) {
    NSLog(@"Nil Parameter(s) found when swizzling.");
    return NO;
  }

  Method method1 = class_getInstanceMethod(klass, methodSelector1);
  Method method2 = class_getInstanceMethod(klass, methodSelector2);
  // Only swizzle if both methods found
  if (method1 && method2) {
    // Try to save the current implementations
    IMP imp1 = method_getImplementation(method1);
    [self grey_saveMethod:methodSelector1
                     type:GREYMethodTypeInstance
                    class:klass
           implementation:imp1];
    IMP imp2 = method_getImplementation(method2);
    [self grey_saveMethod:methodSelector2
                     type:GREYMethodTypeInstance
                    class:klass
           implementation:imp2];

    if (class_addMethod(klass, methodSelector1, imp2, method_getTypeEncoding(method2))) {
      class_replaceMethod(klass, methodSelector2, imp1, method_getTypeEncoding(method1));
    } else {
      method_exchangeImplementations(method1, method2);
    }
    return YES;
  } else {
    NSLog(@"Swizzling Method(s) not found while swizzling class %@.", NSStringFromClass(klass));
    return NO;
  }
}

- (BOOL)swizzleClass:(Class)klass
               addInstanceMethod:(SEL)methodSelector
              withImplementation:(IMP)imp
    andReplaceWithInstanceMethod:(SEL)sel {
  if (!klass || !methodSelector || !imp || !sel) {
    NSLog(@"Nil Parameter(s) found when swizzling.");
    return NO;
  }

  // Check for whether an implementation forwards to a nil selector or not.
  // This is caused when you use the incorrect methodForSelector call in order
  // to get the implementation for a selector.
  void *messageForwardingIMP = dlsym(RTLD_DEFAULT, "_objc_msgForward");
  if (imp == messageForwardingIMP) {
    NSLog(@"Wrong Type of Implementation obtained for selector %@", NSStringFromClass(klass));
    return NO;
  }

  Method swizzleWithMethod = class_getInstanceMethod(klass, sel);
  if (swizzleWithMethod) {
    struct objc_method_description *desc = method_getDescription(swizzleWithMethod);
    if (!desc || desc->name == NULL) {
      NSLog(@"Failed to get method description.");
      return NO;
    }

    if (!class_addMethod(klass, methodSelector, imp, desc->types)) {
      NSLog(@"Failed to add class method.");
      return NO;
    }
    return [self swizzleClass:klass replaceInstanceMethod:sel withMethod:methodSelector];
  } else {
    NSLog(@"Method being swizzled with: %@ does not exist in the class %@.",
          NSStringFromSelector(sel), NSStringFromClass(klass));
    return NO;
  }
}

#pragma mark - Private

- (NSString *)grey_keyForClass:(Class)klass
                      method:(SEL)instanceMethod
                        type:(GREYMethodType)methodType {
  NSParameterAssert(klass);
  NSParameterAssert(instanceMethod);

  NSString *methodTypeString;
  if (instanceMethod == GREYMethodTypeClass) {
    methodTypeString = @"_CLASS_METHOD_";
  } else {
    methodTypeString = @"_INSTANCE_METHOD_";
  }
  return [NSString stringWithFormat:@"%@+%@+%@",
          NSStringFromClass(klass),
          methodTypeString,
          NSStringFromSelector(instanceMethod)];
}

/**
 *  Saves the given implementation: @c imp of a method under the given @c methodSelector.
 *
 *  @remark Only one implementation of a method will be saved.
 *
 *  @param methodSelector The selector of the method that is to be saved.
 *  @param methodType     The type of the referenced method (class/instance).
 *  @param klass          The class to which the method belongs.
 *  @param imp            The implementation for the method.
 *
 *  @return @c YES on success, @c NO otherwise.
 */
- (BOOL)grey_saveMethod:(SEL)methodSelector
                 type:(GREYMethodType)methodType
                class:(Class)klass
       implementation:(IMP)imp {
  NSParameterAssert(klass);
  NSParameterAssert(methodSelector);
  NSParameterAssert(imp);

  NSString *key = [self grey_keyForClass:klass method:methodSelector type:methodType];
  if (!_originalMethodImpls[key]) {
    GREYImpHolder *holder = [[GREYImpHolder alloc] initWithClass:klass
                                                          method:methodSelector
                                                            type:methodType
                                                  implementation:imp];
    _originalMethodImpls[key] = holder;
    return YES;
  } else {
    return NO;
  }
}

@end
