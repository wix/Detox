//
//  UIView+DetoxMatchers.h
//  Detox
//
//  Created by Leo Natan (Wix) on 4/19/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface UIView (DetoxMatchers)

+ (NSMutableArray<UIView*>*)dtx_findViewsInAllWindowsPassingPredicate:(NSPredicate*)predicate;
+ (NSMutableArray<UIView*>*)dtx_findViewsInKeySceneWindowsPassingPredicate:(NSPredicate*)predicate;
+ (NSMutableArray<UIView*>*)dtx_findViewsInWindows:(NSArray<UIWindow*>*)windows passingPredicate:(NSPredicate*)predicate;
+ (NSMutableArray<UIView*>*)dtx_findViewsInHierarchy:(id)hierarchy passingPredicate:(NSPredicate*)predicate;
+ (NSMutableArray<UIView*>*)dtx_findViewsInHierarchy:(id)hierarchy includingRoot:(BOOL)includingRoot passingPredicate:(NSPredicate*)predicate;

@end

NS_ASSUME_NONNULL_END
