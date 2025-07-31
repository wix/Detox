//
//  NSURL+DetoxUtils.h
//  Detox
//
//  Created by Alon Haiut on 26/04/2021.
//  Copyright © 2021 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface NSURL (DetoxUtils)

+ (NSURL*)temporaryPath:(NSString *)subFolder;
+ (NSURL*)visibilityFailingScreenshotsPath;
+ (NSURL*)visibilityFailingRectsPath;
+ (NSURL*)elementsScreenshotPath;
+ (NSURL*)testFailedArtifactsPath;
+ (nullable NSURL*)dtx_artifactsRootURL;
+ (void)dtx_setArtifactsRootURL:(nullable NSURL*)url;

@end

NS_ASSUME_NONNULL_END
