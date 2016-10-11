//
//  GREYMatchers+Detox.h
//  Detox
//
//  Created by Tal Kol on 10/7/16.
//  Copyright © 2016 Wix. All rights reserved.
//

@import EarlGrey;

@interface GREYMatchers (Detox)

+ (id<GREYMatcher>)detoxMatcherForText:(NSString *)text;

+ (id<GREYMatcher>)detoxMatcherForScrollChildOfMatcher:(id<GREYMatcher>)matcher;

+ (id<GREYMatcher>)detoxMatcherForBoth:(id<GREYMatcher>)firstMatcher and:(id<GREYMatcher>)secondMatcher;

+ (id<GREYMatcher>)detoxMatcherForBoth:(id<GREYMatcher>)firstMatcher andAncestorMatcher:(id<GREYMatcher>)ancestorMatcher;

+ (id<GREYMatcher>)detoxMatcherForBoth:(id<GREYMatcher>)firstMatcher andDescendantMatcher:(id<GREYMatcher>)descendantMatcher;

+ (id<GREYMatcher>)detoxMatcherForNot:(id<GREYMatcher>)matcher;

+ (id<GREYMatcher>)detoxMatcherForClass:(NSString *)aClassName;

@end
