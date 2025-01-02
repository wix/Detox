//
//  ReactModulesBridge.m (example)
//  Created by Asaf Korem (Wix.com) on 2024.
//

#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"
#import "React/RCTViewManager.h"

@interface RCT_EXTERN_MODULE(ShakeEventEmitter, RCTEventEmitter)

@end

@interface RCT_EXTERN_MODULE(NativeModule, NSObject)

RCT_EXTERN_METHOD(echoWithoutResponse:(NSString *)str)

RCT_EXTERN_METHOD(echoWithResponse:(NSString *)str
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(nativeSetTimeout:(double)delay
                  block:(RCTResponseSenderBlock)block)

RCT_EXTERN_METHOD(switchToNativeRoot)

RCT_EXTERN_METHOD(switchToMultipleReactRoots)

RCT_EXTERN_METHOD(sendNotification:(NSString *)notification
                  name:(NSString *)name)

RCT_EXTERN_METHOD(presentOverlayWindow)

RCT_EXTERN_METHOD(presentOverlayView)

@end
