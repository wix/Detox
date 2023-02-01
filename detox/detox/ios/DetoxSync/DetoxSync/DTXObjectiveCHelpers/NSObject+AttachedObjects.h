//
//  NSObject+AttachedObjects.h
//  DTXObjectiveCHelpers
//
//  Created by Leo Natan (Wix) on 10/21/18.
//  Copyright © 2017-2020 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface NSObject (AttachedObjects)

- (void)dtx_attachObject:(nullable id)value forKey:(const void*)key;
- (nullable id)dtx_attachedObjectForKey:(const void*)key;

@end

NS_ASSUME_NONNULL_END
