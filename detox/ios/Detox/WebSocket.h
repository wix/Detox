//
//  WebSocket.h
//  Detox
//
//  Created by Tal Kol on 6/16/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

@import SocketRocket;

@protocol WebSocketDelegate <NSObject>

- (void)websocketDidConnect;
- (void)websocketDidReceiveAction:(NSString*)type withParams:(NSDictionary*)params;

@end


@interface WebSocket : NSObject<SRWebSocketDelegate>

@property (nonatomic, assign) id<WebSocketDelegate> delegate;
- (void) connectToServer:(NSString*)url withSessionId:(NSString*)sessionId;
- (void) sendAction:(NSString*)type withParams:(NSDictionary*)params;

@end
