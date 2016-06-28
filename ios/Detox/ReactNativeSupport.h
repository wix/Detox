//
//  ReactNativeSupport.h
//  Detox
//
//  Created by Tal Kol on 6/28/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

@protocol ReactNativeSupportDelegate <NSObject>

- (void)reactNativeAppDidLoad;

@end

@interface ReactNativeSupport : NSObject

@property (nonatomic, assign) id<ReactNativeSupportDelegate> delegate;

- (void) reloadApp;

@end

