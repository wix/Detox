//
//  DTXDurationFormatter.h
//  Detox
//
//  Created by Leo Natan (Wix) on 6/1/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface DTXDurationFormatter : NSFormatter

- (NSString*)stringFromTimeInterval:(NSTimeInterval)ti;
- (NSString*)stringFromDate:(NSDate *)startDate toDate:(NSDate *)endDate;
- (NSString *)stringForObjectValue:(nullable id)obj;

@end

NS_ASSUME_NONNULL_END
