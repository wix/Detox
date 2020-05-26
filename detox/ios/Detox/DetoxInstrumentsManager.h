//
//  DetoxInstrumentsManager.h
//  Detox
//
//  Created by Leo Natan (Wix) on 2/17/19.
//  Copyright © 2019 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface DetoxInstrumentsManager : NSObject

+ (NSURL*)defaultURLForTestName:(NSString*)testName;

- (void)startRecordingWithConfiguration:(NSDictionary<NSString*, id>*)config;
- (void)continueRecordingWithConfiguration:(NSDictionary<NSString*, id>*)config;
- (void)stopRecordingWithCompletionHandler:(void(^)(NSError* _Nullable  error))completionHandler;



@end

NS_ASSUME_NONNULL_END
