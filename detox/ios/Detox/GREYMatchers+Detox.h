//
//  GREYMatchers+Detox.h
//  Detox
//
//  Created by Tal Kol on 10/7/16.
//  Copyright © 2016 Wix. All rights reserved.
//

@import EarlGrey;

@interface GREYMatchers (Detox)

+ (id<GREYMatcher>)matcherForTextDetox:(NSString *)text;

@end
