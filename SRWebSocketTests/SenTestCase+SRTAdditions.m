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

#import "SenTestCase+SRTAdditions.h"


@implementation SenTestCase (SRTAdditions)

- (void)runCurrentRunLoopUntilTestPasses:(PXPredicateBlock)predicate timeout:(NSTimeInterval)timeout;
{
    NSDate *timeoutDate = [NSDate dateWithTimeIntervalSinceNow:timeout];
    
    NSTimeInterval timeoutTime = [timeoutDate timeIntervalSinceReferenceDate];
    NSTimeInterval currentTime;
    
    for (currentTime = [NSDate timeIntervalSinceReferenceDate];
         !predicate() && currentTime < timeoutTime;
         currentTime = [NSDate timeIntervalSinceReferenceDate]) {
        [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
    }
    
    STAssertTrue(currentTime <= timeoutTime, @"Timed out");
}

@end
