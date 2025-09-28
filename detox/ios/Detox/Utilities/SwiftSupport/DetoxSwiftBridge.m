//
//  DetoxSwiftBridge.m
//  Detox
//
//  Created by Mark de Vocht on 28/09/2025.
//  Copyright © 2025 Wix. All rights reserved.
//

#import "DetoxSwiftBridge.h"
@import UIKit;
@import ObjectiveC;

DTX_CREATE_LOG(SwiftBridge);

@implementation DetoxSwiftBridge

+ (nullable NSObject *)getRootViewFactory
{
    NSObject<UIApplicationDelegate> *appDelegate = UIApplication.sharedApplication.delegate;
    if (!appDelegate) {
        return nil;
    }
    
    NSObject *rootViewFactory = [self getPropertyFromObject:appDelegate named:@"rootViewFactory"];
    if (rootViewFactory) {
        return rootViewFactory;
    }
    
    NSObject *reactNativeFactory = [self getPropertyFromObject:appDelegate named:@"reactNativeFactory"];
    if (reactNativeFactory) {
        return [self getPropertyFromObject:reactNativeFactory named:@"rootViewFactory"];
    }
    
    return nil;
}

+ (nullable NSObject *)getReactNativeFactory
{
    NSObject<UIApplicationDelegate> *appDelegate = UIApplication.sharedApplication.delegate;
    if (!appDelegate) {
        return nil;
    }
    
    return [self getPropertyFromObject:appDelegate named:@"reactNativeFactory"];
}

+ (nullable NSObject *)getPropertyFromObject:(NSObject *)object named:(NSString *)propertyName
{
    if (!object || !propertyName) {
        return nil;
    }
    
    @try {
        NSObject *value = [object valueForKey:propertyName];
        if (value) return value;
    } @catch (NSException *exception) {}
    
    Class objectClass = [object class];
    while (objectClass) {
        unsigned int ivarCount;
        Ivar *ivars = class_copyIvarList(objectClass, &ivarCount);
        
        for (unsigned int i = 0; i < ivarCount; i++) {
            const char *ivarName = ivar_getName(ivars[i]);
            if (ivarName) {
                NSString *ivarNameString = [NSString stringWithUTF8String:ivarName];
                if ([ivarNameString isEqualToString:propertyName] ||
                    [ivarNameString isEqualToString:[@"_" stringByAppendingString:propertyName]]) {
                    NSObject *value = object_getIvar(object, ivars[i]);
                    if (value) {
                        free(ivars);
                        return value;
                    }
                }
            }
        }
        
        free(ivars);
        objectClass = class_getSuperclass(objectClass);
    }
    
    return nil;
}

@end
