//
//  ReactNativeHeaders.h
//  Detox
//
//  Created by Tal Kol on 8/15/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#ifndef ReactNativeHeaders_h
#define ReactNativeHeaders_h

#import <Foundation/Foundation.h>

// we don't want detox to have a direct dependency on ReactNative

typedef void (^RN_RCTJavaScriptCallback)(id json, NSError *error);

@protocol RN_RCTUIManager
- (dispatch_queue_t)methodQueue;
@end

@protocol RN_RCTBridge
+ (id)currentBridge;
- (id<RN_RCTUIManager>) uiManager;
- (id)valueForKey:(NSString*)key;
@property (nonatomic, readonly, getter=isLoading) BOOL loading;
@property (nonatomic, readonly, getter=isValid) BOOL valid;
@end

@protocol RN_RCTJavaScriptExecutor
- (void)executeBlockOnJavaScriptQueue:(dispatch_block_t)block;
- (void)flushedQueue:(RN_RCTJavaScriptCallback)onComplete;
@end

#endif /* ReactNativeHeaders_h */
