//
//  NativeModule.h (example)
//  Created by Asaf Korem (Wix.com) on 2025.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <UIKit/UIKit.h>

@interface NativeModule : NSObject <RCTBridgeModule>

@property (nonatomic, strong) UIWindow *overlayWindow;
@property (nonatomic, strong) UIView *overlayView;
@property (nonatomic, assign) NSInteger callCounter;

@end
