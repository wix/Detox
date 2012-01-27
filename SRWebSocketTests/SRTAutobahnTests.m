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

#import <SenTestingKit/SenTestingKit.h>
#import "SRWebSocket.h"

#define SRLogDebug(format, ...) 
//#define SRLogDebug(format, ...) NSLog(format, __VA_ARGS__)

@interface SRTAutobahnTests : SenTestCase
@end

@interface TestOperation : NSOperation <SRWebSocketDelegate>

- (id)initWithTestNumber:(NSInteger)testNumber;

@end

@implementation SRTAutobahnTests {
    SRWebSocket *_curWebSocket; 
    NSInteger _testCount;
    NSInteger _curTest;
    NSMutableArray *_sockets;
}

- (void)testFuzzer;
{
    _sockets = [[NSMutableArray alloc] init];

    NSOperationQueue *testQueue = [[NSOperationQueue alloc] init];
    
    __block BOOL hasFinished = NO;
    __block BOOL hasFailed = NO;
    
    __weak SRTAutobahnTests *weakself = self;
    _curWebSocket = [[SRWebSocket alloc] initWithURL:[NSURL URLWithString:@"ws://localhost:9001/getCaseCount"]];
    _curWebSocket.onMessage = ^(SRWebSocket *webSocket, NSString *message) {
        NSOperation *finishOperation = [NSBlockOperation blockOperationWithBlock:^{
            weakself->_curWebSocket = [[SRWebSocket alloc] initWithURL:[NSURL URLWithString:@"ws://localhost:9001/updateReports?agent=socketrocket"]];
            
            NSLog(@"-- Updating Reports");
            weakself->_curWebSocket.onClose = ^(SRWebSocket *webSocket, NSInteger code, NSString *reason, BOOL wasClean) {
                NSLog(@"-- reports updated... exiting");
                hasFinished = YES;
            };
            weakself->_curWebSocket.onError = ^(SRWebSocket *webSocket, NSError *error) {
                NSLog(@"Error updating reports %@", error.localizedDescription);
                hasFailed = YES;
                hasFinished = YES;
            };
            
            [weakself->_curWebSocket open];
        }];
        
        
        testQueue.maxConcurrentOperationCount = 1;
        
        for (int i = 0; i < [message integerValue]; i++) {
            NSOperation *op = [[TestOperation alloc] initWithTestNumber:i + 1];
            [finishOperation addDependency:op];
            [testQueue addOperation:op];
        }
        
        [testQueue addOperation:finishOperation];
    };
    
    [_curWebSocket open];
    [self runCurrentRunLoopUntilTestPasses:^BOOL{
        return hasFinished;
    } timeout:60 * 60];
    
    STAssertFalse(hasFailed, @"timeout");
}

@end

@interface TestOperation ()

@property (nonatomic) BOOL isFinished;
@property (nonatomic) BOOL isExecuting;

@end

@implementation TestOperation {
    NSInteger _testNumber;
    SRWebSocket *_webSocket;
}

@synthesize isFinished = _isFinished;
@synthesize isExecuting = _isExecuting;

- (id)initWithTestNumber:(NSInteger)testNumber;
{
    self = [super init];
    if (self) {
        _testNumber = testNumber;
        _isExecuting = NO;
        _isFinished = NO;
    }
    return self;
}

- (BOOL)isConcurrent;
{
    return YES;
}

- (void)start;
{
    NSLog(@"Starting test %d", _testNumber);
    self.isExecuting = YES;
    dispatch_async(dispatch_get_main_queue(), ^{
        _webSocket = [[SRWebSocket alloc] initWithURL:[NSURL URLWithString:[NSString stringWithFormat:@"ws://localhost:9001/runCase?case=%d&agent=socketrocket", _testNumber]]];
        _webSocket.delegate = self;
        [_webSocket open];
    });
}

- (void)webSocket:(SRWebSocket *)webSocket didCloseWithCode:(NSInteger)code reason:(NSString *)reason wasClean:(BOOL)wasClean;
{
    NSLog(@"Received close for %d", _testNumber);
    
    [self willChangeValueForKey:@"isExecuting"];
    [self willChangeValueForKey:@"isFinished"];
    _isFinished = YES;
    _isExecuting = NO;
    _webSocket = nil;
    [self didChangeValueForKey:@"isExecuting"];
    [self didChangeValueForKey:@"isFinished"];
}

- (void)webSocket:(SRWebSocket *)webSocket didReceiveMessage:(id)message;
{
    if ([message isKindOfClass:[NSString class]]) {
        SRLogDebug(@"Echoing String for %d %@", _testNumber, [(NSString *)message substringToIndex:MIN(128, [message length])]);
    } else {
        SRLogDebug(@"Echoing String for %d %@", _testNumber, [(NSData *)message subdataWithRange:NSMakeRange(0, MIN(128, ([message length])))]);
    }
    [webSocket send:message];
    
    double delayInSeconds = 100.0;
    dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, delayInSeconds * NSEC_PER_SEC);
    dispatch_after(popTime, dispatch_get_main_queue(), ^(void){
        if (!self.isFinished) {
            NSLog(@"Timing Out");
            [_webSocket closeWithCode:0 reason:nil];
        }
    });
}

- (void)webSocket:(SRWebSocket *)webSocket didFailWithError:(NSError *)error;
{
    NSLog(@"failed with error %@", [error localizedDescription]);            
    [self willChangeValueForKey:@"isExecuting"];
    [self willChangeValueForKey:@"isFinished"];
    _isFinished = YES;
    _isExecuting = NO;
    _webSocket = nil;
    [self didChangeValueForKey:@"isExecuting"];
    [self didChangeValueForKey:@"isFinished"];
}

@end
