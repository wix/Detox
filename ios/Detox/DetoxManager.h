//
//  DetoxManager.h
//  Detox
//
//  Created by Tal Kol on 6/15/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "SRWebSocket.h"

@interface DetoxManager : NSObject<SRWebSocketDelegate>

+ (void) connectToServer:(NSString*)url withSessionId:(NSString*)sessionId;

@end
