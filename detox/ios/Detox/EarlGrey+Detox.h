//
//  EarlGrey+Detox.h
//  Detox
//
//  Created by Rotem Mizrachi Meidan on 05/03/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

@import Foundation;
#import <EarlGrey/EarlGrey.h>

@interface EarlGreyImpl (Detox)

- (void)detox_safeExecuteSync:(void(^)(void))block;
- (GREYElementInteraction *)detox_selectElementWithMatcher:(id<GREYMatcher>)elementMatcher;

@end
