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
    
    Class objectClass = [object class];
    
    while (objectClass) {
        unsigned int ivarCount;
        Ivar *ivars = class_copyIvarList(objectClass, &ivarCount);
        
        for (unsigned int i = 0; i < ivarCount; i++) {
            Ivar ivar = ivars[i];
            const char *ivarName = ivar_getName(ivar);
            
            if (ivarName) {
                NSString *ivarNameString = [NSString stringWithUTF8String:ivarName];
                
                if ([ivarNameString containsString:propertyName]) {
                    NSObject *value = object_getIvar(object, ivar);
                    if (value) {
                        dtx_log_info(@"Found Swift property '%@' using ivar '%@'", propertyName, ivarNameString);
                        free(ivars);
                        return value;
                    }
                }
            }
        }
        
        free(ivars);
        
        objectClass = class_getSuperclass(objectClass);
    }
    
    @try {
        NSObject *value = [object valueForKey:propertyName];
        if (value) {
            dtx_log_info(@"Found property '%@' using KVC fallback", propertyName);
            return value;
        }
    } @catch (NSException *exception) {
        dtx_log_debug(@"KVC fallback failed for property '%@': %@", propertyName, exception.reason);
    }
    
    dtx_log_debug(@"Could not find property '%@' in object of class %@", propertyName, NSStringFromClass([object class]));
    return nil;
}

@end
