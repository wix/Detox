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

@property (nonatomic, strong, readonly) dispatch_queue_t timersObservationQueue;
@property (nonatomic, strong, readonly) NSMapTable<id, id>* observations;

- (void)setDurationThreshold:(NSTimeInterval)durationThreshold;

@end
