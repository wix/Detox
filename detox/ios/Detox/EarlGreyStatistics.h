//
//  EarlGreyStatistics.h
//  Detox
//
//  Created by Leo Natan (Wix) on 19/03/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface EarlGreyStatistics : NSObject

@property (nonatomic, class, readonly) EarlGreyStatistics* sharedInstance NS_SWIFT_NAME(shared);

- (NSDictionary<NSString*, id>*)currentStatus;


@end

NS_ASSUME_NONNULL_END
