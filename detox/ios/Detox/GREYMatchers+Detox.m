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

+ (id<GREYMatcher>)matcherForTextDetox:(NSString *)text
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

@end
