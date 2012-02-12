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
#import "SRTWebSocketOperation.h"
#import "SenTestCase+SRTAdditions.h"

#define SRLogDebug(format, ...) 
//#define SRLogDebug(format, ...) NSLog(format, __VA_ARGS__)

@interface SRTAutobahnTests : SenTestCase
@end

@interface TestOperation : SRTWebSocketOperation <SRWebSocketDelegate>
- (id)initWithBaseURL:(NSURL *)url testNumber:(NSInteger)testNumber agent:(NSString *)agent;
@end


@interface CaseGetterOperation : SRTWebSocketOperation <SRWebSocketDelegate>
- (id)initWithBaseURL:(NSURL *)url;

@property (nonatomic, readonly) NSInteger caseCount;

@end

@interface UpdateOperation : SRTWebSocketOperation <SRWebSocketDelegate>

- (id)initWithBaseURL:(NSURL *)url agent:(NSString *)agent;

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
    
    NSString *testURLString = [[NSProcessInfo processInfo].environment objectForKey:@"SR_TEST_URL"];
    NSURL *prefixURL = [NSURL URLWithString:testURLString];    
    
    CaseGetterOperation *caseGetter = [[CaseGetterOperation alloc] initWithBaseURL:prefixURL];
    [caseGetter start];
    
    [self runCurrentRunLoopUntilTestPasses:^BOOL{
        return caseGetter.isFinished;
    } timeout:20.0];
    
    STAssertNil(caseGetter.error, @"CaseGetter should have successfully returned the number of testCases. Instead got error %@", caseGetter.error);
    
    NSInteger caseCount = caseGetter.caseCount;
    
    NSOperationQueue *testQueue = [[NSOperationQueue alloc] init];
    
    testQueue.maxConcurrentOperationCount = 1;
    
    NSString *agent = [NSBundle bundleForClass:[self class]].bundleIdentifier;
    
    UpdateOperation *updateReportOperation = [[UpdateOperation alloc] initWithBaseURL:prefixURL agent:agent];
    
    for (int caseNumber = 1; caseNumber <= caseCount; caseNumber++) {
        TestOperation *testOp = [[TestOperation alloc] initWithBaseURL:prefixURL testNumber:caseNumber agent:agent];
        [updateReportOperation addDependency:testOp];
        [testQueue addOperation:testOp];
    }
    
    testQueue.suspended = NO;
    
    [testQueue addOperation:updateReportOperation];
    
    [self runCurrentRunLoopUntilTestPasses:^BOOL{
        return updateReportOperation.isFinished;
    } timeout:60 * 60];
    
    STAssertNil(updateReportOperation.error, @"Updating the report should not have errored");
}

@end

@implementation TestOperation {
    NSInteger _testNumber;
}

- (id)initWithBaseURL:(NSURL *)url testNumber:(NSInteger)testNumber agent:(NSString *)agent;
{   
    
    NSString *path = [[url URLByAppendingPathComponent:@"runCase"] absoluteString];
    path = [path stringByAppendingFormat:@"?case=%d&agent=%@", testNumber, agent];
    
    self = [super initWithURL:[NSURL URLWithString:path]];
    if (self) {
        _testNumber = testNumber;
    }
    return self;
}

- (void)start;
{
    [super start];
    NSLog(@"Starting test %d", _testNumber);
}

- (void)webSocket:(SRWebSocket *)webSocket didReceiveMessage:(id)message;
{
    [webSocket send:message];
}

@end


@implementation CaseGetterOperation

@synthesize caseCount = _caseCount;

- (id)initWithBaseURL:(NSURL *)url;
{
    self = [super initWithURL:[url URLByAppendingPathComponent:@"getCaseCount"]];
    if (self) {
    }
    return self;
}

- (void)webSocket:(SRWebSocket *)webSocket didReceiveMessage:(id)message;
{
    _caseCount = [message integerValue];
}

@end


@implementation UpdateOperation

- (id)initWithBaseURL:(NSURL *)url agent:(NSString *)agent;
{
    NSString *path = [[url URLByAppendingPathComponent:@"updateReports"] absoluteString];
    path = [path stringByAppendingFormat:@"?agent=%@", agent];
    
    return [super initWithURL:[NSURL URLWithString:path]];
}

- (void)start;
{
    [super start];
    NSLog(@"Updating Reports!");
}

@end





