//
//  DetoxInstrumentsManager.h
//  Detox
//
//  Created by Leo Natan (Wix) on 2/17/19.
//  Copyright © 2019 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface DetoxInstrumentsConfiguration : NSObject

@end

@interface DetoxInstrumentsManager : NSObject

+ (NSURL*)defaultURLForTestName:(NSString*)testName;

- (DetoxInstrumentsConfiguration *)configurationFromProps:(NSDictionary *)props;
- (void)startRecordingWithConfiguration:(DetoxInstrumentsConfiguration *)configuration;
- (void)continueRecordingWithConfiguration:(DetoxInstrumentsConfiguration *)configuration;
- (void)stopRecordingWithCompletionHandler:(void(^)(NSError* error))completionHandler;

@end
