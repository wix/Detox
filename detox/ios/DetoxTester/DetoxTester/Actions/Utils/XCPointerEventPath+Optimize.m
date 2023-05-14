//
//  XCPointerEventPath+Optimize.m (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

#import <Foundation/NSObjCRuntime.h>
#import <objc/runtime.h>

#import "XCPointerEventPath+Optimize.h"

@import ObjectiveC;

@implementation XCPointerEventPath (XCPointerEventPathOptimize)

+ (void)load {
  @autoreleasepool {
    SEL originalSelector = @selector(typeText:atOffset:typingSpeed:shouldRedact:);
    SEL swizzledSelector = @selector(swizzledTypeText:atOffset:typingSpeed:shouldRedact:);

    Method originalMethod = class_getInstanceMethod(self, originalSelector);
    Method swizzledMethod = class_getInstanceMethod(self, swizzledSelector);

    if (class_respondsToSelector(self, originalSelector)) {
      // The method is already implemented, so swap the implementations.
      method_exchangeImplementations(originalMethod, swizzledMethod);
    }
  }
}

- (void)swizzledTypeText:(id)arg1
                atOffset:(double)arg2
             typingSpeed:(unsigned long long)arg3
            shouldRedact:(_Bool)arg4 {
  [self swizzledTypeText:arg1 atOffset:arg2 typingSpeed:2 shouldRedact:arg4];
}

@end
