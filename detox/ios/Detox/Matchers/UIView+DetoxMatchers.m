//
//  UIView+DetoxMatchers.m
//  Detox
//
//  Created by Leo Natan (Wix) on 4/19/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "UIView+DetoxMatchers.h"
#import "UIView+DetoxUtils.h"
#import "DTXAppleInternals.h"
#import "UIWindow+DetoxUtils.h"

@implementation UIView (DetoxMatchers)

NSArray* DTXChildElements(id element)
{
	NSCParameterAssert(element != nil);
	
	NSMutableOrderedSet<id> *immediateChildren = [[NSMutableOrderedSet alloc] init];
	
	if ([element isKindOfClass:[UIView class]])
	{
		// Grab all subviews so that we continue traversing the entire hierarchy.
		// Add the objects in reverse order to make sure that objects on top get matched first.
		NSArray<id> *subviews = [element subviews];
		if ([subviews count] > 0)
		{
			for (UIView *subview in [subviews reverseObjectEnumerator])
			{
				[immediateChildren addObject:subview];
			}
		}
	}
	
	// If we encounter an accessibility container, grab all the contained accessibility elements.
	// However, we need to skip a few types of containers:
	// 1) UITableViewCells as they do a lot of custom accessibility work underneath
	//    and the accessibility elements they return are 'mocks' that cause access errors.
	// 2) UITableViews as because they report all their cells, even the ones off-screen as
	//    accessibility elements. We should not consider off-screen cells as there could be
	//    hundreds, even thousands of them and we would be iterating over them unnecessarily.
	//    Worse yet, if the cell isn't visible, calling accessibilityElementAtIndex will create
	//    and initialize them each time.
	if ([element respondsToSelector:@selector(accessibilityElementCount)] &&
		[element isKindOfClass:UITableView.class] == NO &&
		[element isKindOfClass:NSClassFromString(@"UIPickerTableView")] == NO &&
		[element isKindOfClass:UITableViewCell.class] == NO)
	{
		NSInteger elementCount = [element accessibilityElementCount];
		if (elementCount != NSNotFound && elementCount > 0)
		{
			// Temp holder created by UIKit. What we really want is the underlying element.
			Class accessibilityMockClass = NSClassFromString(@"UIAccessibilityElementMockView");
			Class textFieldElementClass= NSClassFromString(@"UIAccessibilityTextFieldElement");
			for (NSInteger i = elementCount - 1; i >= 0; i--)
			{
				id item = [element accessibilityElementAtIndex:i];
				if([item isKindOfClass:accessibilityMockClass])
				{
					// Replace mock views with the views they encapsulate.
					item = [item view];
				}
				else if([item isKindOfClass:textFieldElementClass])
				{
					item = [item textField];
				}
				
				if (item == nil)
				{
					continue;
				}
				
				// If item is a UIView subclass, it could be both a subview of another view and an
				// accssibility element of a different accessibility container (which is not necessarily its
				// superview). This could introduce elements being duplicated in the view hierarchy.
				if ([item isKindOfClass:[UIView class]])
				{
					// Only add the item as the element's immediate children if it meets these conditions:
					// (1) Item's superview is the element. This ensures that other accessibility containers
					//     don't add it as their immeditate children.
					// (2) Item does not have a superview. If item does not have a superview, you can ensure
					//     it's being added only once as an accessibility element of a container.
					id superview = [item superview];
					if (superview == element || superview == nil)
					{
						[immediateChildren addObject:item];
					}
				}
				else
				{
					// If the item not a UIView subclass, it's mostly safe to add it as immediate child
					// since no two accessibility containers should add the same accessible element.
					[immediateChildren addObject:item];
				}
			}
		}
	}
	
	return [immediateChildren array];
}

+ (void)_dtx_appendViewsRecursivelyFromArray:(NSArray<UIView*>*)views passingPredicate:(NSPredicate*)predicate storage:(NSMutableArray<UIView*>*)storage
{
	if(views.count == 0)
	{
		return;
	}
	
	[views enumerateObjectsUsingBlock:^(UIView * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
		if(predicate == nil || [predicate evaluateWithObject:obj] == YES)
		{
			[storage addObject:obj];
		}
		
		[self _dtx_appendViewsRecursivelyFromArray:DTXChildElements(obj) passingPredicate:predicate storage:storage];
	}];
}

+ (NSMutableArray<UIView*>*)dtx_findViewsInWindows:(NSArray<UIWindow*>*)windows passingPredicate:(NSPredicate*)predicate
{
	NSMutableArray<UIView*>* rv = [NSMutableArray new];
	
	[self _dtx_appendViewsRecursivelyFromArray:windows passingPredicate:predicate storage:rv];
	[self _dtx_sortViewsByCoords:rv];
	
	return rv;
}

+ (NSMutableArray<UIView*>*)dtx_findViewsInAllWindowsPassingPredicate:(NSPredicate*)predicate
{
	return [self dtx_findViewsInWindows:UIWindow.dtx_allWindows.reverseObjectEnumerator.allObjects passingPredicate:predicate];
}

+ (NSMutableArray<UIView*>*)dtx_findViewsInKeySceneWindowsPassingPredicate:(NSPredicate*)predicate
{
	return [self dtx_findViewsInWindows:UIWindow.dtx_allKeyWindowSceneWindows.reverseObjectEnumerator.allObjects passingPredicate:predicate];
}

+ (NSMutableArray<UIView*>*)dtx_findViewsInHierarchy:(UIView*)hierarchy passingPredicate:(NSPredicate*)predicate
{
	return [self dtx_findViewsInHierarchy:hierarchy includingRoot:YES passingPredicate:predicate];
}

+ (NSMutableArray<UIView*>*)dtx_findViewsInHierarchy:(UIView*)hierarchy includingRoot:(BOOL)includingRoot passingPredicate:(NSPredicate*)predicate
{
	NSMutableArray<UIView*>* rv = [NSMutableArray new];
	
	[self _dtx_appendViewsRecursivelyFromArray:includingRoot ? @[hierarchy] : DTXChildElements(hierarchy) passingPredicate:predicate storage:rv];
	[self _dtx_sortViewsByCoords:rv];
	
	return rv;
}

+ (void)_dtx_sortViewsByCoords:(NSMutableArray<UIView*>*)views
{
	[views sortUsingDescriptors:@[[NSSortDescriptor sortDescriptorWithKey:nil ascending:YES comparator:^NSComparisonResult(UIView* _Nonnull obj1, UIView* _Nonnull obj2) {
		CGRect frame1 = obj1.dtx_accessibilityFrame;
		CGRect frame2 = obj2.dtx_accessibilityFrame;
		
		return frame1.origin.y < frame2.origin.y ? NSOrderedAscending : frame1.origin.y > frame2.origin.y ? NSOrderedDescending : NSOrderedSame;
	}], [NSSortDescriptor sortDescriptorWithKey:nil ascending:YES comparator:^NSComparisonResult(UIView* _Nonnull obj1, UIView* _Nonnull obj2) {
		CGRect frame1 = obj1.dtx_accessibilityFrame;
		CGRect frame2 = obj2.dtx_accessibilityFrame;
		
		return frame1.origin.x < frame2.origin.x ? NSOrderedAscending : frame1.origin.x > frame2.origin.x ? NSOrderedDescending : NSOrderedSame;
	}]]];
}

@end
