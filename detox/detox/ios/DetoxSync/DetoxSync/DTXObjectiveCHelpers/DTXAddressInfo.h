//
//  DTXAddressInfo.h
//  DTXObjectiveCHelpers
//
//  Created by Leo Natan (Wix) on 07/07/2017.
//  Copyright © 2017-2020 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface DTXAddressInfo : NSObject

- (instancetype)initWithAddress:(NSUInteger)address;

@property (nonatomic, readonly) NSUInteger address;
@property (nonatomic, copy, readonly) NSString* image;
@property (nonatomic, copy, readonly) NSString* symbol;
@property (nonatomic, readonly) NSUInteger offset;

- (NSString*)formattedDescriptionForIndex:(NSUInteger)index;

@end

NS_ASSUME_NONNULL_END
