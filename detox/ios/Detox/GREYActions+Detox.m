//
//  GREYActions+Detox.m
//  Detox
//
//  Created by Matt Findley on 2/7/19.
//  Copyright © 2019 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "GREYActions+Detox.h"
#import <EarlGrey/GREYActions.h>
@import AudioToolbox;
@import ObjectiveC;

@interface UIKeyboardTaskQueue : NSObject

- (void)performTask:(void (^)(id ctx))arg1;
- (void)waitUntilAllTasksAreFinished;

@end

@interface UIKeyboardImpl : UIView

+ (instancetype)sharedInstance;
@property(readonly, nonatomic) UIKeyboardTaskQueue *taskQueue;
- (void)handleKeyWithString:(id)arg1 forKeyEvent:(id)arg2 executionContext:(id)arg3;
- (void)setShift:(_Bool)arg1 autoshift:(_Bool)arg2;

@end

static void _DTXTypeText(NSString* text)
{	
	[UIKeyboardImpl.sharedInstance setShift:NO autoshift:NO];
	
	NSUInteger rangeIdx = 0;
	while (rangeIdx < text.length)
	{
		NSRange range = [text rangeOfComposedCharacterSequenceAtIndex:rangeIdx];
		
		NSString* grapheme = [text substringWithRange:range];
		
		[UIKeyboardImpl.sharedInstance.taskQueue performTask:^(id ctx) {
			[UIKeyboardImpl.sharedInstance handleKeyWithString:grapheme forKeyEvent:nil executionContext:ctx];
					
			NSArray* sounds = @[@1104, @1155, @1156];
			
			AudioServicesPlaySystemSound([sounds[grapheme.hash % 3] unsignedIntValue]);
		}];
		[UIKeyboardImpl.sharedInstance.taskQueue waitUntilAllTasksAreFinished];
		
		[NSRunLoop.currentRunLoop runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
		
		rangeIdx += range.length;
	}
}

@implementation GREYActions (Detox)

+ (void)load
{
	Method m = class_getClassMethod(self, NSSelectorFromString(@"actionForTypeText:"));
	method_setImplementation(m, imp_implementationWithBlock(^(id _self, NSString* text) {
		return [self dtx_actionForTypeText:text];
	}));
}

+ (id<GREYAction>)dtx_actionForTypeText:(NSString *)text
{
	return [GREYActionBlock actionWithName:[NSString stringWithFormat:@"Type '%@'", text]
							   constraints:grey_not(grey_systemAlertViewShown())
							  performBlock:^BOOL (UIView* expectedFirstResponderView, __strong NSError **errorOrNil) {
								  // If expectedFirstResponderView or one of its ancestors isn't the first responder, tap on
								  // it so it becomes the first responder.
								  if (![expectedFirstResponderView isFirstResponder] &&
									  ![grey_ancestor(grey_firstResponder()) matches:expectedFirstResponderView]) 
								  {
									  // Tap on the element to make expectedFirstResponderView a first responder.
									  if (![[GREYActions actionForTap] perform:expectedFirstResponderView error:errorOrNil]) 
									  {
										  return NO;
									  }
								  }
								  
								  _DTXTypeText(text);
								  
								  return YES;
							  }];
}

+ (id<GREYAction>)detoxSetDatePickerDate:(NSString *)dateString withFormat:(NSString *)dateFormat
{
	NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
  	formatter.dateFormat = dateFormat;

	NSDate *date = [formatter dateFromString:dateString];
	return [GREYActions actionForSetDate:date];
}
@end
