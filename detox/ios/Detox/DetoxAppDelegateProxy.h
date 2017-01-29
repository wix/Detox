//
//  DetoxAppDelegateProxy.h
//  Detox
//
//  Created by Leo Natan (Wix) on 19/01/2017.
//  Copyright © 2017 Leo Natan. All rights reserved.
//

@import Foundation;

@interface DetoxAppDelegateProxy : NSObject

@property (class, nonatomic, strong, readonly) DetoxAppDelegateProxy* currentAppDelegateProxy;

@end
