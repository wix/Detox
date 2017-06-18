//
//  LocationHelper.m
//  Detox
//
//  Created by Yogev Ben David on 16/06/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

#import "LocationHelper.h"

NSString * const AUTHORIZATION_STATUS_DESCRIPTION_ARRAY[] = { @"NotDetermined", @"Restricted", @"Denied", @"AuthorizedAlways", @"AuthorizedWhenInUse", @"Authorized" };

@implementation LocationHelper

+ (CLAuthorizationStatus)locationStatus {
	return [CLLocationManager authorizationStatus];
}

+ (NSDictionary *)locationStatusDictionary {
	int status = [CLLocationManager authorizationStatus];
	return @{@"status": [NSString stringWithFormat:@"%d", status], @"description": AUTHORIZATION_STATUS_DESCRIPTION_ARRAY[status]};
}

+ (BOOL)locationAvailable {
	return [CLLocationManager authorizationStatus] >= kCLAuthorizationStatusAuthorizedAlways;
}

@end
