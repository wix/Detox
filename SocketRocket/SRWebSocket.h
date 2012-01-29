//
//   Copyright 2012 Square Inc.
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.
//

#import <Foundation/Foundation.h>

typedef enum {
    SR_CONNECTING   = 0,
    SR_OPEN         = 1,
    SR_CLOSING      = 2,
    SR_CLOSED       = 3,
    
} SRReadyState;

@class SRWebSocket;

extern NSString *const SRWebSocketErrorDomain;

@protocol SRWebSocketDelegate;

@interface SRWebSocket : NSObject <NSStreamDelegate>

@property (nonatomic, assign) id <SRWebSocketDelegate> delegate;

@property (nonatomic, readonly) SRReadyState readyState;
@property (nonatomic, readonly, strong) NSURL *url;

- (id)initWithURLRequest:(NSURLRequest *)request;

- (void)open;

- (void)close;
- (void)closeWithCode:(NSInteger)code reason:(NSString *)reason;

// Send a UTF8 String or Data
- (void)send:(id)data;

@end

@protocol SRWebSocketDelegate <NSObject>

- (void)webSocket:(SRWebSocket *)webSocket didReceiveMessage:(NSString *)message;

@optional

- (void)webSocketDidOpen:(SRWebSocket *)webSocket;
- (void)webSocket:(SRWebSocket *)webSocket didFailWithError:(NSError *)error;
- (void)webSocket:(SRWebSocket *)webSocket didCloseWithCode:(NSInteger)code reason:(NSString *)reason wasClean:(BOOL)wasClean;

@end
