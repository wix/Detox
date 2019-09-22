//
//  DetoxManager.h
//  Detox
//
//  Created by Tal Kol on 6/15/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface DetoxManager : NSObject

+ (instancetype)sharedManager;

- (void)notifyOnCrashWithDetails:(NSDictionary*)details;

@end
