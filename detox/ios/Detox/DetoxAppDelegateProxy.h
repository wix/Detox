//
//  DetoxAppDelegateProxy.h
//  Detox
//
//  Created by Leo Natan (Wix) on 19/01/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

@import Foundation;
@import UIKit;

@interface DetoxAppDelegateProxy : NSObject

@property (class, nonatomic, strong, readonly) DetoxAppDelegateProxy* currentAppDelegateProxy;
@property (nonatomic, strong, readonly) id<UIApplicationDelegate> originalAppDelegate;

@end
