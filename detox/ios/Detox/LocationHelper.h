//
//  LocationHelper.h
//  Detox
//
//  Created by Yogev Ben David on 16/06/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <CoreLocation/CoreLocation.h>

@interface LocationHelper : NSObject

+ (CLAuthorizationStatus)locationStatus;
+ (NSDictionary *)locationStatusDictionary;
+ (BOOL)locationAvailable;


@end
