//
//  TestFailureHandler.h
//  Detox
//
//  Created by Tal Kol on 6/16/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>
@import EarlGrey;

@protocol TestFailureHandlerDelegate <NSObject>

- (void)onTestFailed:(NSString*)details;

@end


@interface TestFailureHandler : NSObject<GREYFailureHandler>

@property (nonatomic, assign) id<TestFailureHandlerDelegate> delegate;

@end
