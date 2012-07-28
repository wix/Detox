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
#import <SenTestingKit/SenTestRun.h>
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

@interface NSInvocation (SRTBlockInvocation)

+ (NSInvocation *)invocationWithBlock:(dispatch_block_t)block;

@end

@interface SRTBlockInvoker

- (id)initWithBlock:(dispatch_block_t)block;

- (void)invoke;

@end

@interface UpdateOperation : SRTWebSocketOperation <SRWebSocketDelegate>

- (id)initWithBaseURL:(NSURL *)url agent:(NSString *)agent;

@end

@implementation SRTAutobahnTests {
    SRWebSocket *_curWebSocket; 
    NSInteger _testCount;
    NSInteger _curTest;
    NSMutableArray *_sockets;
    NSString *_testURLString;
    NSURL *_prefixURL;
    NSString *_agent;
}

- (id)initWithInvocation:(NSInvocation *)anInvocation;
{
    self = [super initWithInvocation:anInvocation];
    if (self) {
        _testURLString = [[NSProcessInfo processInfo].environment objectForKey:@"SR_TEST_URL"];
        _prefixURL = [NSURL URLWithString:_testURLString];
        _agent = [NSBundle bundleForClass:[self class]].bundleIdentifier;
    }
    return self;
}

- (unsigned int)testCaseCount;
{
    if (self.invocation) {
        return [super testCaseCount];
    }
    
    CaseGetterOperation *caseGetter = [[CaseGetterOperation alloc] initWithBaseURL:_prefixURL];
    
    [caseGetter start];
    
    [self runCurrentRunLoopUntilTestPasses:^BOOL{
        return caseGetter.isFinished;
    } timeout:20.0];
    
    STAssertNil(caseGetter.error, @"CaseGetter should have successfully returned the number of testCases. Instead got error %@", caseGetter.error);
    
    NSInteger caseCount = caseGetter.caseCount;
    
    return caseCount;
}

- (BOOL) isEmpty;
{
    return NO;
}

- (void) performTest:(SenTestRun *) aRun
{
    if (self.invocation) {
        [super performTest:aRun];
        return;
    }
    for (int i = 0; i < aRun.test.testCaseCount; i++) {
        SEL sel = @selector(performTestWithNumber:);
        NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:[[self class] instanceMethodSignatureForSelector:sel]];
        
        invocation.selector = sel;
        invocation.target = self;
        
        [invocation setArgument:&i atIndex:2];
        
        SenTestCase *testCase = [[[self class] alloc] initWithInvocation:invocation];
        
        SenTestCaseRun *run = [[SenTestCaseRun alloc] initWithTest:testCase];
        
        [testCase performTest:run];
    }
    
    [self updateReports];
}

- (NSInteger)testNum;
{
    NSInteger i;
    [self.invocation getArgument:&i atIndex:2];
    return i;
}

- (NSString *)description;
{
    if (self.invocation) {
        return [NSString stringWithFormat:@"Autobahn test %d", self.testNum];
    } else {
        return @"Autobahn Test Harness";
    }
}

+ (id) defaultTestSuite
{
    return [[[self class] alloc] init];
}

- (void)performTestWithNumber:(NSInteger)testNumber;
{
    NSOperationQueue *testQueue = [[NSOperationQueue alloc] init];
    
    testQueue.maxConcurrentOperationCount = 1;
    
    
    
    TestOperation *testOp = [[TestOperation alloc] initWithBaseURL:_prefixURL testNumber:testNumber agent:_agent];
    [testQueue addOperation:testOp];
    
    testQueue.suspended = NO;
    
}

- (void)updateReports;
{
    UpdateOperation *updateReportOperation = [[UpdateOperation alloc] initWithBaseURL:_prefixURL agent:_agent];
    
    [updateReportOperation start];
    
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


