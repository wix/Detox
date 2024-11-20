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

	static Class RCTTextView;
    static Class RCTParagraphComponentView;
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		RCTTextView = NSClassFromString(@"RCTTextView");
        RCTParagraphComponentView = NSClassFromString(@"RCTParagraphComponentView");
	});
	if(RCTTextView != nil && [self isKindOfClass:RCTTextView])
	{
		return [(NSTextStorage*)[self valueForKey:@"textStorage"] string];
	}
    if(RCTParagraphComponentView != nil && [self isKindOfClass:RCTParagraphComponentView])
    {
        return [(NSAttributedString*)[self valueForKey:@"attributedText"] string];
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
