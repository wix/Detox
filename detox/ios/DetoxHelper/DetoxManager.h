//
//  DetoxManager.h
//  DetoxHelper
//
//  Created by Leo Natan (Wix) on 9/18/19.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface DetoxManager : NSObject

@property (class, nonatomic, strong, readonly) DetoxManager* sharedManager;

- (void)notifyOnCrashWithDetails:(NSDictionary*)details;

@end

NS_ASSUME_NONNULL_END
