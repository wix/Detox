//
//  ExtensionOperation.h
//  DetoxHelper
//
//  Created by Leo Natan (Wix) on 29/03/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface ExtensionOperation : NSOperation

- (void)executeAsyncWithCompletionHandler:(void(^)(void))handler;

@end
