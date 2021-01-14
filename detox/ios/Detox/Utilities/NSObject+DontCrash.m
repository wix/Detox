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
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		RCTTextView = NSClassFromString(@"RCTTextView");
	});
	if(RCTTextView != nil && [self isKindOfClass:RCTTextView])
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
