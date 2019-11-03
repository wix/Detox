//
//  DetoxUtils.h
//  DetoxHelper
//
//  Created by Leo Natan (Wix) on 11/3/19.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

BOOL DTXIsDebuggerAttached(void);
void DTXEnsureMainThread(dispatch_block_t block);

NS_ASSUME_NONNULL_END
