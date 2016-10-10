//
//  GREYMatchers+Detox.m
//  Detox
//
//  Created by Tal Kol on 10/7/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "GREYMatchers+Detox.h"
#import <OCHamcrest/OCHamcrest.h>

@implementation GREYMatchers (Detox)

+ (id<GREYMatcher>)detoxMatcherForText:(NSString *)text
{
    Class RN_RCTText = NSClassFromString(@"RCTText");
    if (!RN_RCTText)
    {
        return grey_text(text);
    }
    
    // in React Native RCTText the accessibilityLabel is hardwired to be the text inside
    return grey_anyOf(grey_text(text),
                      grey_allOf(grey_anyOf(grey_kindOfClass(RN_RCTText), nil),
                                 hasProperty(@"accessibilityLabel", text), nil), nil);
    
}

+ (id<GREYMatcher>)detoxMatcherForScrollChildOfMatcher:(id<GREYMatcher>)matcher
{
    // find scroll views in a more robust way, either the original matcher already points to a UIScrollView
    // and if it isn't look for a child under it that is a UIScrollView
    return grey_anyOf(grey_allOf(grey_anyOf(grey_kindOfClass([UIScrollView class]),
                                            grey_kindOfClass([UIWebView class]), nil),
                                 matcher, nil),
                      grey_allOf(grey_kindOfClass([UIScrollView class]),
                                 grey_ancestor(matcher), nil), nil);
}

+ (id<GREYMatcher>)detoxMatcherForBoth:(id<GREYMatcher>)firstMatcher and:(id<GREYMatcher>)secondMatcher
{
    return grey_allOf(firstMatcher, secondMatcher, nil);
}

+ (id<GREYMatcher>)detoxMatcherForNot:(id<GREYMatcher>)matcher
{
    return grey_not(matcher);
}

+ (id<GREYMatcher>)detoxMatcherForClass:(NSString *)aClassName
{
    Class klass = NSClassFromString(aClassName);
    return grey_kindOfClass(klass);
}

@end
