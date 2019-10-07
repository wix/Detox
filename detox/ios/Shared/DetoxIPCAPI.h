//
//  DetoxIPCAPI.h
//  Detox
//
//  Created by Leo Natan (Wix) on 9/18/19.
//

#ifndef DetoxHelperAPI_h
#define DetoxHelperAPI_h

@protocol DetoxTestRunner <NSObject>

@end

@protocol DetoxHelper <NSObject>

- (void)waitForIdleWithCompletionHandler:(dispatch_block_t)completionHandler;

- (void)beginDelayingTimePickerEvents;
- (void)endDelayingTimePickerEventsWithCompletionHandler:(dispatch_block_t)completionHandler;

@end

#endif /* DetoxHelperAPI_h */
