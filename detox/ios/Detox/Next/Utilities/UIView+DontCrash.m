//
//  UIView+DontCrash.m
//  ExampleApp
//
//  Created by Leo Natan (Wix) on 4/16/20.
//

#import "UIView+DontCrash.h"

@implementation UIView (DontCrash)

- (id)text
{
	Class cls = NSClassFromString(@"RCTTextView");
	if(cls != nil && [self isKindOfClass:cls])
	{
		return [(NSTextStorage*)[self valueForKey:@"textStorage"] string];
	}
	
	return nil;
}

- (id)placeholder
{
	return nil;
}

@end
