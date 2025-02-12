//
//  ShakeEventEmitter.m (example)
//  Created by Asaf Korem (Wix.com) on 2025.
//


#import "ShakeEventEmitter.h"

@implementation ShakeEventEmitter {
    BOOL hasListeners;
}

static ShakeEventEmitter *sharedInstance = nil;

RCT_EXPORT_MODULE();

+ (instancetype)sharedInstance {
    return sharedInstance;
}

- (instancetype)init {
    if (self = [super init]) {
        sharedInstance = self;
    }
    return self;
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"ShakeEvent"];
}

- (void)startObserving {
    hasListeners = YES;
}

- (void)stopObserving {
    hasListeners = NO;
}

- (void)handleShake {
    if (hasListeners) {
        [self sendEventWithName:@"ShakeEvent" body:nil];
    }
}

@end
