//
//  GREYActions+Detox.m
//  Detox
//
//  Created by Matt Findley on 2/7/19.
//  Copyright © 2019 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "GREYActions+Detox.h"
#import <EarlGrey/GREYActions.h>

@implementation GREYActions (Detox)

+ (id<GREYAction>)detoxSetDatePickerDate:(NSString *)dateString withFormat:(NSString *)dateFormat
{
	NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
  	formatter.dateFormat = dateFormat;

	NSDate *date = [formatter dateFromString:dateString];
	return [GREYActions actionForSetDate:date];
}
@end
