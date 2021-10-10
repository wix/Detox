//
//  DetoxUtils.h
//  Detox
//
//  Created by Alon Haiut on 11/10/2021.
//  Copyright © 2021 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

BOOL DTXIsDebuggerAttached(void);
void DTXEnsureMainThread(dispatch_block_t block);

NS_ASSUME_NONNULL_END
