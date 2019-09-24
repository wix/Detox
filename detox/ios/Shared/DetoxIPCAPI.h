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
- (void)aMoreComplexSelector:(NSUInteger)a b:(NSString*)str c:(void(^)(dispatch_block_t))block1 d:(void(^)(NSArray*))test;

@end

#endif /* DetoxHelperAPI_h */
