//
//  XCUIElement+ExtendedText.m
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 2/21/20.
//

#import "XCUIElement+ExtendedText.h"
#import "DTXTestCaseAssertions.h"

@implementation XCUIElement (ExtendedText)

- (void)dtx_clearText
{
	if(self.elementType != XCUIElementTypeTextField &&
	   self.elementType != XCUIElementTypeSecureTextField &&
	   self.elementType != XCUIElementTypeSearchField &&
	   self.elementType != XCUIElementTypeTextView)
	{
		DTXFail(@"%s is not valid for %@.", __FUNCTION__, self);
		return;
	}
	
	NSString* currentValue = self.value;
	if([currentValue isKindOfClass:NSString.class] == NO)
	{
		DTXFail(@"Tried to clear and enter text into a non string value");
		return;
	}
	
	NSString* clearTypeText = [@"" stringByPaddingToLength:currentValue.length withString:XCUIKeyboardKeyDelete startingAtIndex:0];
	[self typeText:clearTypeText];
}

- (void)dtx_replaceText:(NSString*)text
{
	[self dtx_clearText];
	
	[self typeText:text];
}

@end
