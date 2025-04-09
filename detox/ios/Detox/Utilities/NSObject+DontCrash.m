//
//  NSObject+DontCrash.m
//  ExampleApp
//
//  Created by Leo Natan (Wix) on 4/16/20.
//

#import "NSObject+DontCrash.h"

@implementation NSObject (DontCrash)

- (id)_dtx_text
{
    if([self respondsToSelector:@selector(text)])
    {
        return [(UITextView*)self text];
    }

    static Class RCTParagraphComponentViewClass;
    static Class RCTTextClass;
    static Class RCTTextViewClass;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        RCTParagraphComponentViewClass = NSClassFromString(@"RCTParagraphComponentView");
        RCTTextClass = NSClassFromString(@"RCTText");
        RCTTextViewClass = NSClassFromString(@"RCTTextView");
    });

    if(RCTParagraphComponentViewClass != nil && [self isKindOfClass:RCTParagraphComponentViewClass])
    {
        NSAttributedString *attributedText = [self valueForKey:@"attributedText"];
        return [attributedText string];
    }

    if(RCTTextClass != nil && [self isKindOfClass:RCTTextClass])
    {
        return [(NSTextStorage*)[self valueForKey:@"textStorage"] string];
    }

    if(RCTTextViewClass != nil && [self isKindOfClass:RCTTextViewClass])
    {
        return [(NSTextStorage*)[self valueForKey:@"textStorage"] string];
    }

    return nil;
}

- (id)_dtx_placeholder
{
    if([self respondsToSelector:@selector(placeholder)])
    {
        return [(UITextField*)self placeholder];
    }

    return nil;
}

@end
