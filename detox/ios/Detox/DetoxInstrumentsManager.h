//
//  DetoxInstrumentsManager.h
//  Detox
//
//  Created by Leo Natan (Wix) on 2/17/19.
//  Copyright © 2019 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface DetoxInstrumentsManager : NSObject

+ (NSURL*)defaultURLForTestName:(NSString*)testName;

- (void)startRecordingAtURL:(NSURL*)URL;
- (void)continueRecordingAtURL:(NSURL*)URL;
- (void)stopRecordingWithCompletionHandler:(void(^)(NSError* error))completionHandler;

@end
