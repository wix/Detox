//
//  XCUIElement+ExtendedTouches.m
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 9/22/19.
//

#import "XCUIElement+ExtendedTouches.h"

@interface XCUICoordinate ()

- (void)_pressWithPressure:(double)arg1 pressDuration:(NSTimeInterval)arg2 holdDuration:(NSTimeInterval)arg3 releaseDuration:(NSTimeInterval)arg4 activityTitle:(id)arg5;

@end

@implementation XCUIElement (ExtendedTouches)

- (void)scrollWithOffset:(CGVector)offsetVector
{
	[[self coordinateWithNormalizedOffset:CGVectorMake(0.5, 0.5)] scrollWithOffset:offsetVector];
}

- (void)tapAtPoint:(CGVector)pointVector
{
	[[[self coordinateWithNormalizedOffset:CGVectorMake(0.0, 0.0)] coordinateWithOffset:pointVector] tap];
}

@end

@implementation XCUICoordinate (ExtendedTouches)

- (void)scrollWithOffset:(CGVector)offsetVector
{
	XCUICoordinate* target = [self coordinateWithOffset:offsetVector];
	[self pressForDuration:0.0 thenDragToCoordinate:target];
}

@end
