//
//  NSObject+DontCrash.m
//  ExampleApp
//
//  Created by Leo Natan (Wix) on 4/16/20.
//

#import "NSObject+DontCrash.h"

@interface NSObject (DontCrashPrivate)
+ (Class)dtx_classForName:(NSString *)className;
- (nullable NSString *)dtx_extractTextFromRCTComponent;
@end

@implementation NSObject (DontCrash)

#pragma mark - Public Methods

- (id)_dtx_text {
    if ([self respondsToSelector:@selector(text)]) {
        return [(UITextView *)self text];
    }

    NSString *reactText = [self dtx_extractTextFromRCTComponent];
    if (reactText) {
        return reactText;
    }

    return nil;
}

- (id)_dtx_placeholder {
    if ([self respondsToSelector:@selector(placeholder)]) {
        return [(UITextField *)self placeholder];
    }
    return nil;
}

@end

@implementation NSObject (DontCrashPrivate)

#pragma mark - Private Methods

+ (Class)dtx_classForName:(NSString *)className {
    static NSMutableDictionary<NSString *, Class> *classCache;
    static dispatch_once_t onceToken;

    dispatch_once(&onceToken, ^{
        classCache = [NSMutableDictionary dictionary];
    });

    Class cachedClass = classCache[className];
    if (!cachedClass) {
        cachedClass = NSClassFromString(className);
        if (cachedClass) {
            classCache[className] = cachedClass;
        }
    }

    return cachedClass;
}

- (nullable NSString *)dtx_extractTextFromRCTComponent {
    static Class RCTTextViewClass;
    static Class RCTParagraphComponentViewClass;
    static dispatch_once_t onceToken;

    dispatch_once(&onceToken, ^{
        RCTTextViewClass = [self.class dtx_classForName:@"RCTTextView"];
        RCTParagraphComponentViewClass = [self.class dtx_classForName:@"RCTParagraphComponentView"];
    });

    if (RCTTextViewClass && [self isKindOfClass:RCTTextViewClass]) {
        NSTextStorage *textStorage = [self valueForKey:@"textStorage"];
        return [textStorage string];
    }

    if (RCTParagraphComponentViewClass && [self isKindOfClass:RCTParagraphComponentViewClass]) {
        NSAttributedString *attributedText = [self valueForKey:@"attributedText"];
        return [attributedText string];
    }

    return nil;
}

@end
