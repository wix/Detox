//
//  DTXDetoxApplication.h
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 9/22/19.
//

#import <XCTest/XCTest.h>
#import "DetoxIPCAPI.h"

NS_ASSUME_NONNULL_BEGIN

@interface DTXDetoxApplication : XCUIApplication

@property (nonatomic, strong, readonly) id<DetoxHelper> detoxHelper;
@property (nonatomic, strong, readonly) NSXPCConnection* detoxHelperConnection;

@end

NS_ASSUME_NONNULL_END
