//
//  EarlGreyStatistics.h
//  Detox
//
//  Created by Leo Natan (Wix) on 19/03/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface EarlGreyStatistics : NSObject

+ (instancetype)sharedInstance;

- (NSDictionary*)currentStatus;


@end
