//
//  ShakeEventEmitter.h (example)
//  Created by Asaf Korem (Wix.com) on 2025.
//

#import <React/RCTEventEmitter.h>

@interface ShakeEventEmitter : RCTEventEmitter

+ (instancetype)sharedInstance;
- (void)handleShake;

@end
