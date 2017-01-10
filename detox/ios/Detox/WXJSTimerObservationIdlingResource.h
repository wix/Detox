//
//  WXJSTimerObservationIdlingResource.h
//  Detox
//
//  Created by Leo Natan (Wix) on 14/10/2016.
//  Copyright © 2016 Wix. All rights reserved.
//

@import Foundation;
#import <EarlGrey/EarlGrey.h>

@interface WXJSTimerObservationIdlingResource : NSObject <GREYIdlingResource>

- (void)setDurationThreshold:(NSTimeInterval)durationThreshold;

@end
