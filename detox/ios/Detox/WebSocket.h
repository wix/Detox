//
//  WebSocket.h
//  Detox
//
//  Created by Tal Kol on 6/16/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

@class WebSocket;

@protocol WebSocketDelegate <NSObject>

- (void)websocketDidConnect:(WebSocket*)websocket;
- (void)websocket:(WebSocket*)websocket didReceiveAction:(NSString*)type withParams:(NSDictionary*)params withMessageId:(NSNumber*)messageId;
- (void)websocketDidClose:(WebSocket*)websocket;

@end


@interface WebSocket : NSObject

@property (nonatomic, assign) id<WebSocketDelegate> delegate;
- (void)connectToServer:(NSString*)url withSessionId:(NSString*)sessionId;
- (void)sendAction:(NSString*)type withParams:(NSDictionary*)params withMessageId:(NSNumber*)messageId;
- (void)close;

@end
