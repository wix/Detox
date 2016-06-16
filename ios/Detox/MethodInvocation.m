//
//  MethodInvocation.m
//  Detox
//
//  Created by Tal Kol on 6/16/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "MethodInvocation.h"
@import EarlGrey;

@implementation MethodInvocation

+ (Class) getClass:(id)param onError:(void (^)(NSString*))onError
{
    if (param == nil) return nil;
    if (![param isKindOfClass:[NSString class]]) return nil;
    NSString *class = (NSString*)param;
    if ([class isEqualToString:@"EarlGreyImpl"])
    {
        return [EarlGreyImpl class];
    }
    if ([class isEqualToString:@"GREYMatchers"])
    {
        return [GREYMatchers class];
    }
    if ([class isEqualToString:@"GREYActions"])
    {
        return [GREYActions class];
    }
    if ([class isEqualToString:@"GREYElementInteraction"])
    {
        return [GREYElementInteraction class];
    }
    onError([NSString stringWithFormat:@"class %@ is not supported", class]);
    return nil;
}

+ (id) getTarget:(id)param withClass:(Class)class onError:(void (^)(NSString*))onError
{
    if (param == nil) return class;
    if ([param isKindOfClass:[NSString class]])
    {
        NSString *p = (NSString*)param;
        if ([p isEqualToString:@"EarlGrey"])
        {
            return EarlGrey;
        }
    }
    if ([param isKindOfClass:[NSDictionary class]])
    {
        NSDictionary *p = (NSDictionary*)param;
        NSString *type = [MethodInvocation getString:[p objectForKey:@"type"]];
        id value = [p objectForKey:@"value"];
        return [MethodInvocation getValue:value withType:type onError:onError];
    }
    return nil;
}

+ (NSString*) getString:(id)param
{
    if (param == nil) return nil;
    if ([param isKindOfClass:[NSString class]]) return param;
    return nil;
}

+ (NSString*) getArgName:(id)param
{
    if (param == nil) return nil;
    if ([param isKindOfClass:[NSDictionary class]])
    {
        NSDictionary *p = (NSDictionary*)param;
        return [p objectForKey:@"name"];
    }
    return nil;
}

+ (id) getValue:(id)value withType:(NSString*)type onError:(void (^)(NSString*))onError
{
    if (type == nil || value == nil) return nil;
    if ([type isEqualToString:@"String"])
    {
        if (![value isKindOfClass:[NSString class]]) return nil;
        return value;
    }
    if ([type isEqualToString:@"Invocation"])
    {
        if (![value isKindOfClass:[NSDictionary class]]) return nil;
        return [MethodInvocation invoke:value onError:onError];
    }
    return nil;
}

+ (id) getArgValue:(id)param onError:(void (^)(NSString*))onError
{
    if (param == nil) return nil;
    if ([param isKindOfClass:[NSDictionary class]])
    {
        NSDictionary *p = (NSDictionary*)param;
        NSString *type = [MethodInvocation getString:[p objectForKey:@"type"]];
        id value = [p objectForKey:@"value"];
        return [MethodInvocation getValue:value withType:type onError:onError];
    }
    return nil;
}

+ (NSArray*) getArray:(id)param
{
    if (param == nil) return nil;
    if ([param isKindOfClass:[NSArray class]]) return param;
    return nil;
}

+ (id) invoke:(NSDictionary*)params onError:(void (^)(NSString*))onError
{
    Class class = [MethodInvocation getClass:[params objectForKey:@"class"] onError:onError];
    if (class == nil)
    {
        onError(@"class is invalid");
        return nil;
    }
    id target = [MethodInvocation getTarget:[params objectForKey:@"target"] withClass:class onError:onError];
    if (target == nil)
    {
        onError(@"target is invalid");
        return nil;
    }
    NSString *method = [MethodInvocation getString:[params objectForKey:@"method"]];
    if (method == nil)
    {
        onError(@"method is not a string");
        return nil;
    }
    NSArray *args = [MethodInvocation getArray:[params objectForKey:@"args"]];
    if (args == nil)
    {
        onError(@"args is not an array");
        return nil;
    }
    NSString *selector = method;
    for (int i = 0; i<[args count]; i++)
    {
        id arg = args[i];
        if (i == 0) selector = [selector stringByAppendingString:@":"];
        else selector = [selector stringByAppendingFormat:@"%@:", [MethodInvocation getArgName:arg]];
    }
    SEL s = NSSelectorFromString(selector);
    NSMethodSignature *signature = [target methodSignatureForSelector:s];
    if (signature == nil)
    {
        onError([NSString stringWithFormat:@"selector %@ not found on class %@", selector, class]);
        return nil;
    }
    NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:signature];
    invocation.target = target;
    [invocation setSelector:s];
    for (int i = 0; i<[args count]; i++)
    {
        id arg = args[i];
        id argValue = [MethodInvocation getArgValue:arg onError:onError];
        if (argValue == nil)
        {
            onError([NSString stringWithFormat:@"invalid arg value %d", i]);
            return nil;
        }
        [invocation setArgument:&argValue atIndex:i + 2];
    }
    [invocation invoke];
    id __unsafe_unretained tempResultSet;
    [invocation getReturnValue:&tempResultSet];
    id res = tempResultSet;
    return res;
}

@end
