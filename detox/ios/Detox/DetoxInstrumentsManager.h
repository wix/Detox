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

- (void)markEventIntervalBeginWithIdentifier:(NSString*)identifier category:(NSString*)category name:(NSString*)name additionalInfo:(NSString*)additionalInfo;
- (void)markEventIntervalEndWithIdentifier:(NSString*)identifier eventStatus:(NSUInteger)eventStatus additionalInfo:(NSString*)additionalInfo;
- (void)markEventWithCategory:(NSString*)category name:(NSString*)name eventStatus:(NSUInteger)eventStatus additionalInfo:(NSString*)additionalInfo;

- (void)markLifecycleIntervalBeginWithIdentifier:(NSString*)identifier category:(NSString*)category name:(NSString*)name additionalInfo:(NSString*)additionalInfo;
- (void)markLifecycleEventWithCategory:(NSString*)category name:(NSString*)name eventStatus:(NSUInteger)eventStatus additionalInfo:(NSString*)additionalInfo;

@end
