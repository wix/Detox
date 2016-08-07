//
// Copyright 2016 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

#import <EarlGrey/GREYCondition.h>
#import <EarlGrey/GREYUIThreadExecutor.h>
#import <EarlGrey/NSObject+GREYAdditions.h>
#import <EarlGrey/NSURLConnection+GREYAdditions.h>
#import <OCMock/OCMock.h>
#import <objc/runtime.h>

#import "GREYBaseTest.h"

// Class that performs swizzled operations in dealloc to ensure they don't track
@interface NSURLConnectionDealloc : NSURLConnection
@end

@implementation NSURLConnectionDealloc

- (void)dealloc {
  [self start];
}

@end

@interface NSURLConnection_GREYAdditionsTest : GREYBaseTest
    <NSURLConnectionDelegate, NSURLConnectionDataDelegate>

@end

@implementation NSURLConnection_GREYAdditionsTest {
  id _mockGREYUIStateTracker;
  BOOL _connectionFinished;
  NSURLRequest *_request;
  NSURLRequest *_externalRequest;
  id _capturedPendingObject;
}

- (void)setUp {
  [super setUp];

  _mockGREYUIStateTracker =
      [OCMockObject partialMockForObject:[GREYAppStateTracker sharedInstance]];
  _request = [NSURLRequest requestWithURL:[NSURL URLWithString:@"http://localhost/"]];
  _externalRequest =
      [NSURLRequest requestWithURL:[NSURL URLWithString:@"http://www.google.com"]];
  void (^blockPending)(NSInvocation *) = ^(NSInvocation *invocation) {
    __unsafe_unretained id object;
    [invocation getArgument:&object atIndex:3];
    self->_capturedPendingObject = object;
  };
  [[[[_mockGREYUIStateTracker expect] andDo:blockPending] andForwardToRealObject]
      trackState:kGREYPendingNetworkRequest forElement:OCMOCK_ANY];
  [[[_mockGREYUIStateTracker expect] andForwardToRealObject]
      untrackState:kGREYPendingNetworkRequest forElementWithID:OCMOCK_ANY];
}

- (void)tearDown {
  [_mockGREYUIStateTracker stopMocking];
  [super tearDown];
}

- (void)testConnectionClassMethodPlusDelegate {
  NSURLConnection *connection = [NSURLConnection connectionWithRequest:_request delegate:self];

  [[GREYUIThreadExecutor sharedInstance] drainUntilIdle];
  [_mockGREYUIStateTracker verify];
  XCTAssertTrue(self->_connectionFinished,
                @"We shouldn't have returned until connection has finished.");
  XCTAssertEqual(connection, _capturedPendingObject, @"Unexpected object was blocked.");
}

- (void)testConnectionInitPlusDelegate {
  NSURLConnection *connection = [[NSURLConnection alloc] initWithRequest:_request delegate:self];

  [[GREYUIThreadExecutor sharedInstance] drainUntilIdle];
  // To make compiler happy with unused variable.
  [connection cancel];
  [_mockGREYUIStateTracker verify];
  XCTAssertTrue(self->_connectionFinished,
                @"We shouldn't have returned until connection has finished.");
  XCTAssertEqual(connection, _capturedPendingObject, @"Unexpected object was blocked.");
}

- (void)testConnectionInitPlusDelegateStartLater {
  NSURLConnection *connection = [[NSURLConnection alloc] initWithRequest:_request
                                                                delegate:self
                                                        startImmediately:NO];
  [connection start];

  [[GREYUIThreadExecutor sharedInstance] drainUntilIdle];
  [_mockGREYUIStateTracker verify];
  XCTAssertTrue(self->_connectionFinished,
                @"We shouldn't have returned until connection has finished.");
  XCTAssertEqual(connection, _capturedPendingObject, @"Unexpected object was blocked.");
}

- (void)testConnectionInitPlusDelegateStartNow {
  NSURLConnection *connection = [[NSURLConnection alloc] initWithRequest:_request
                                                                delegate:self
                                                        startImmediately:YES];

  [[GREYUIThreadExecutor sharedInstance] drainUntilIdle];
  // To make compiler happy with unused variable.
  [connection cancel];
  [_mockGREYUIStateTracker verify];
  XCTAssertTrue(self->_connectionFinished,
                @"We shouldn't have returned until connection has finished.");
  XCTAssertEqual(connection, _capturedPendingObject, @"Unexpected object was blocked.");
}

- (void)testConnectionClassMethodWithCompletionHandler {
  NSOperationQueue *queue = [[NSOperationQueue alloc] init];

  _connectionFinished = NO;
  [NSURLConnection sendAsynchronousRequest:_request
                                     queue:queue
                         completionHandler:^(NSURLResponse *response,
                                             NSData *data,
                                             NSError *connectionError) {
    _connectionFinished = YES;
  }];

  [[GREYUIThreadExecutor sharedInstance] drainUntilIdle];
  [_mockGREYUIStateTracker verify];
  XCTAssertTrue(self->_connectionFinished,
                @"We shouldn't have returned until connection has finished.");
}

- (void)testFilterConnectionChanges {
  // All connections should be ignored.
  [[GREYConfiguration sharedInstance] setValue:@"."
                                  forConfigKey:kGREYConfigKeyURLBlacklistRegex];
  NSURLConnection *connection1 = [[NSURLConnection alloc] initWithRequest:_request delegate:self];

  [[GREYUIThreadExecutor sharedInstance] drainUntilIdle];
  // To make compiler happy with unused variable.
  [connection1 cancel];

  // All connections should be accepted.
  [[GREYConfiguration sharedInstance] setValue:@""
                                  forConfigKey:kGREYConfigKeyURLBlacklistRegex];
  NSURLConnection *connection2 = [[NSURLConnection alloc] initWithRequest:_request delegate:self];

  [[GREYUIThreadExecutor sharedInstance] drainUntilIdle];
  // To make compiler happy with unused variable.
  [connection2 cancel];
  [_mockGREYUIStateTracker verify];
  XCTAssertTrue(self->_connectionFinished,
                @"We shouldn't have returned until connection has finished.");
  XCTAssertEqual(connection2, _capturedPendingObject, @"Unexpected object was blocked.");
}

- (void)testFilterConnectionChangesAfterConnectionStartedButBeforeFinish {
  _connectionFinished = NO;
  NSURLConnection *connection = [[NSURLConnection alloc] initWithRequest:_externalRequest
                                                                delegate:self
                                                        startImmediately:NO];

  [connection start];
  // All connections should be ignored.
  [[GREYConfiguration sharedInstance] setValue:@"."
                                  forConfigKey:kGREYConfigKeyURLBlacklistRegex];
  [[GREYUIThreadExecutor sharedInstance] drainUntilIdle];

  [_mockGREYUIStateTracker verify];
  XCTAssertTrue(self->_connectionFinished,
                @"We shouldn't have returned until connection has finished.");
}

- (void)testNotTrackedDuringDealloc {
  {
    // objc_precise_lifetime required so connection is valid until end of the current scope.
    __attribute__((objc_precise_lifetime)) NSURLConnectionDealloc *connection =
        [[NSURLConnectionDealloc alloc] init];

    [[GREYUIThreadExecutor sharedInstance] drainUntilIdle];
    XCTAssertEqual([[GREYAppStateTracker sharedInstance] currentState], kGREYIdle,
                   @"State must be idle so tracking during dealloc can be detected");
  }

  XCTAssertEqual([[GREYAppStateTracker sharedInstance] currentState],
                 kGREYIdle,
                 @"State should be idle after deallocation");
}

- (void)testCreatingNewConnectionIsTracked {
  NSURLRequest *req = [NSURLRequest requestWithURL:[NSURL URLWithString:@"www.google.com"]];
  NSURLConnection *conn = [NSURLConnection connectionWithRequest:req delegate:nil];
  GREYAppState state = [[GREYAppStateTracker sharedInstance] grey_lastKnownStateForElement:conn];
  XCTAssertTrue(state & kGREYPendingNetworkRequest);
}

#pragma mark NSURLConnectionDelegate

- (void)connection:(NSURLConnection *)connection didReceiveResponse:(NSURLResponse *)response {
  _connectionFinished = YES;
}

- (void)connection:(NSURLConnection *)connection didFailWithError:(NSError *)error {
  _connectionFinished = YES;
}

@end
