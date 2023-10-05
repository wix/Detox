//
//  UIResponder+First.h
//  Detox
//
//  Created by Asaf Korem on 02/12/2021.
//  Copyright © 2021 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface UIResponder (First)

/// Finds the first reponder.
/// @see https://stackoverflow.com/a/21330810/11686340
+ (instancetype)dtx_first;

@end

NS_ASSUME_NONNULL_END
