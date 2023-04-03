//
//  XCPointerEventPath+Swizzling.m (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

#import <objc/runtime.h>


NS_ASSUME_NONNULL_BEGIN

@interface XCPointerEventPath (Swizzling)

- (void)typeText:(id)arg1
        atOffset:(double)arg2
     typingSpeed:(unsigned long long)arg3
    shouldRedact:(_Bool)arg4;

- (void)swizzledTypeText:(id)arg1
                atOffset:(double)arg2
             typingSpeed:(unsigned long long)arg3
            shouldRedact:(_Bool)arg4;

@end

@implementation XCPointerEventPath (Swizzling)

- (void)swizzledTypeText:(id)arg1
                atOffset:(double)arg2
             typingSpeed:(unsigned long long)arg3
            shouldRedact:(_Bool)arg4 {
  [self swizzledTypeText:arg1 atOffset:arg2 typingSpeed:1 shouldRedact:arg4];
}

+ (void)load {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    Class class = [self class];
    SEL originalSelector = @selector(typeText:atOffset:typingSpeed:shouldRedact:);
    SEL swizzledSelector = @selector(swizzledTypeText:atOffset:typingSpeed:shouldRedact:);

    Method originalMethod = class_getInstanceMethod(class, originalSelector);
    Method swizzledMethod = class_getInstanceMethod(class, swizzledSelector);

    BOOL didAddMethod = class_addMethod(
      class,
      originalSelector,
      method_getImplementation(swizzledMethod),
      method_getTypeEncoding(swizzledMethod)
    );

    if (didAddMethod) {
      class_replaceMethod(
        class,
        swizzledSelector,
        method_getImplementation(originalMethod),
        method_getTypeEncoding(originalMethod)
      );
    } else {
      method_exchangeImplementations(originalMethod, swizzledMethod);
    }
  });
}


@end

NS_ASSUME_NONNULL_END
