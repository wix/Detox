//
//  NSObject+AttachedObjects.m
//  DTXObjectiveCHelpers
//
//  Created by Leo Natan (Wix) on 10/21/18.
//  Copyright © 2017-2020 Wix. All rights reserved.
//

#import "NSObject+AttachedObjects.h"
@import ObjectiveC;

DTX_DIRECT_MEMBERS
@implementation NSObject (AttachedObjects)

- (void)dtx_attachObject:(nullable id)value forKey:(const void*)key;
{
	objc_setAssociatedObject(self, key, value, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (nullable id)dtx_attachedObjectForKey:(const void*)key;
{
	return objc_getAssociatedObject(self, key);
}

@end
