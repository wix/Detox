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

#import "FTRNetworkTestViewController.h"

#import "FTRNetworkProxy.h"

/**
 *  Data used as response for proxied requests.
 */
static NSString *const kFTRTestProxyData = @"kFTRTestProxyData";

/**
 *  Regex matching all YouTube urls.
 */
static NSString *const kFTRProxyRegex = @"^http://www.youtube.com";

@interface FTRNetworkTestViewController ()<NSURLConnectionDelegate, NSURLConnectionDataDelegate>
@property(weak, nonatomic) IBOutlet UILabel *retryIndicator;
@property(weak, nonatomic) IBOutlet UILabel *responseVerifiedLabel;
@property(weak, nonatomic) IBOutlet UILabel *requestCompletedLabel;
@end

@implementation FTRNetworkTestViewController

- (instancetype)init {
  NSAssert(NO, @"Invalid Initializer");
  return nil;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  [FTRNetworkProxy ftr_setProxyEnabled:YES];
  [FTRNetworkProxy ftr_addProxyRuleForUrlsMatchingRegexString:kFTRProxyRegex
                                               responseString:kFTRTestProxyData];
}

- (void)viewWillDisappear:(BOOL)animated {
  [super viewWillDisappear:animated];
  [FTRNetworkProxy ftr_removeMostRecentProxyRuleMatchingUrlRegexString:kFTRProxyRegex];
}

/**
 *  Verifies the received @c data by matching it with what is expected via proxy, in case of match
 *  UI is updated by setting @c responseVerifiedLabel to be visible.
 *
 *  @param data The data that was received.
 */
- (void)verifyReceivedData:(NSData *)data {
  // Note: although functionally similar, [NSString stringWithUTF8String:] has been flaky
  // here returning nil for the NSData being passed in from the proxy, using initWithData:encoding:
  // instead.
  NSString *dataStr = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  if ([kFTRTestProxyData isEqualToString:dataStr]) {
    self.responseVerifiedLabel.hidden = NO;
  }
}

- (IBAction)testNetworkClick:(id)sender {
  NSURLRequest *request =
      [NSURLRequest requestWithURL:[NSURL URLWithString:@"http://www.youtube.com/"]];
  [[[NSURLSession sharedSession] dataTaskWithRequest:request
                                   completionHandler:^(NSData *data,
                                                       NSURLResponse *response,
                                                       NSError *error) {
                                     _requestCompletedLabel.hidden = NO;
                                     [self verifyReceivedData:data];
                                   }] resume];
}

- (IBAction)userDidTapNSURLSessionTest:(id)sender {
  NSURLSession *session = [NSURLSession sharedSession];
  NSURLSessionTask *task =
      [session dataTaskWithURL:[NSURL URLWithString:@"http://www.youtube.com/"]
             completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
    [self verifyReceivedData:data];
    _requestCompletedLabel.hidden = NO;
  }];
  // Begin the fetch.
  [task resume];
}

@end
