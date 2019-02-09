//
//  MethodInvocation.m
//  Detox
//
//  Created by Tal Kol on 6/16/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "DTXMethodInvocation.h"
@import EarlGrey;
#import <EarlGrey/GreyActions.h>
#import "GREYActions+Detox.h"

@implementation DTXMethodInvocation

+ (id)getTarget:(id)param onError:(void (^)(NSString*))onError
{
    if (param == nil) return nil;
    if ([param isKindOfClass:[NSDictionary class]])
    {
        NSDictionary *p = (NSDictionary*)param;
        NSString *type = [DTXMethodInvocation getString:[p objectForKey:@"type"]];
        id value = [p objectForKey:@"value"];
        return [DTXMethodInvocation getValue:value withType:type onError:onError];
    }
    return nil;
}

+ (NSString*)getString:(id)param
{
    if (param == nil) return nil;
    if ([param isKindOfClass:[NSString class]]) return param;
    return nil;
}

+ (id)getValue:(id)value withType:(id)type onError:(void (^)(NSString*))onError
{
    if (type == nil || value == nil) return nil;
    if ([type isEqualToString:@"EarlGrey"])
    {
        return EarlGrey;
    }
    if ([type isEqualToString:@"Class"])
    {
        if (![value isKindOfClass:[NSString class]]) return nil;
        return NSClassFromString(value);
    }
    if ([type isEqualToString:@"NSString"])
    {
        if (![value isKindOfClass:[NSString class]]) return nil;
        return value;
    }
    if ([type isEqualToString:@"NSNumber"])
    {
        if (![value isKindOfClass:[NSNumber class]]) return nil;
        return value;
    }
    if ([type isEqualToString:@"NSInteger"])
    {
        if (![value isKindOfClass:[NSNumber class]]) return nil;
        NSInteger v = [value integerValue];
        return [NSNumber numberWithInteger:v];
    }
    if ([type isEqualToString:@"CGFloat"])
    {
        if (![value isKindOfClass:[NSNumber class]]) return nil;
        CGFloat v = [value doubleValue];
        return [NSNumber numberWithDouble:v];
    }
	if ([type isEqualToString:@"CGPoint"])
	{
		if (![value isKindOfClass:[NSDictionary class]]) return nil;
		NSDictionary *v = (NSDictionary*)value;
		CGFloat x = [[v objectForKey:@"x"] floatValue];
		CGFloat y = [[v objectForKey:@"y"] floatValue];
		return [NSValue valueWithCGPoint:CGPointMake(x, y)];
	}
    if ([type isEqualToString:@"CGRect"])
    {
        if (![value isKindOfClass:[NSDictionary class]]) return nil;
        NSDictionary *v = (NSDictionary*)value;
        CGFloat x = [[v objectForKey:@"x"] floatValue];
        CGFloat y = [[v objectForKey:@"y"] floatValue];
        CGFloat width = [[v objectForKey:@"width"] floatValue];
        CGFloat height = [[v objectForKey:@"height"] floatValue];
        return [NSValue valueWithCGRect:CGRectMake(x, y, width, height)];
    }
    if ([type isEqualToString:@"Invocation"])
    {
        if (![value isKindOfClass:[NSDictionary class]]) return nil;
        return [DTXMethodInvocation invoke:value onError:onError];
    }
    return nil;
}

+ (id)getArgValue:(id)param onError:(void (^)(NSString*))onError
{
    if (param == nil) return nil;
    if ([param isKindOfClass:[NSDictionary class]])
    {
        NSDictionary *p = (NSDictionary*)param;
        NSString *type = [DTXMethodInvocation getString:[p objectForKey:@"type"]];
        id value = [p objectForKey:@"value"];
        return [DTXMethodInvocation getValue:value withType:type onError:onError];
    }
	
    return param;
}

+ (NSArray*)getArray:(id)param
{
    if (param == nil) return nil;
    if ([param isKindOfClass:[NSArray class]]) return param;
    return nil;
}

+ (id)getReturnValue:(NSInvocation*)invocation
{
    id res = nil;
    NSString *type = [NSString stringWithUTF8String:invocation.methodSignature.methodReturnType];
    if ([type isEqualToString:@"v"]) return nil;
    if ([type isEqualToString:@"@"])
    {
        id __unsafe_unretained tempResultSet;
        [invocation getReturnValue:&tempResultSet];
        res = tempResultSet;
        return res;
    }
    NSUInteger length = [[invocation methodSignature] methodReturnLength];
    void *buffer = (void *)malloc(length);
    [invocation getReturnValue:buffer];
    if ([type isEqualToString:@"{CGPoint=dd}"])
    {
        res = [NSValue valueWithCGPoint:*(CGPoint*)buffer];
    }
    if ([type isEqualToString:@"{CGRect={CGPoint=dd}{CGSize=dd}}"])
    {
        res = [NSValue valueWithCGRect:*(CGRect*)buffer];
    }
    free(buffer);
    return res;
}

+ (id)serializeValue:(id)value onError:(void (^)(NSString*))onError
{
    if (value == nil) return nil;
    if ([value isKindOfClass:[NSValue class]])
    {
        NSValue *v = (NSValue*)value;
        NSString *type = [NSString stringWithUTF8String:v.objCType];
        if ([type isEqualToString:@"{CGPoint=dd}"])
        {
            CGPoint p = [value CGPointValue];
            return @{@"x": @(p.x), @"y": @(p.y)};
        }
        if ([type isEqualToString:@"{CGRect={CGPoint=dd}{CGSize=dd}}"])
        {
            CGRect r = [value CGRectValue];
            return @{@"x": @(r.origin.x), @"y": @(r.origin.y), @"width": @(r.size.width), @"height": @(r.size.height)};
        }
    }
    return value;
}

+ (void)invocation:(NSInvocation*)invocation setNonPointerArg:(NSValue*)value atIndex:(NSInteger)idx
{
    NSString *type = [NSString stringWithUTF8String:value.objCType];
    if ([type isEqualToString:@"q"])
    {
        NSInteger v = [(NSNumber*)value integerValue];
        [invocation setArgument:&v atIndex:idx];
    }
    if ([type isEqualToString:@"d"])
    {
        CGFloat v = [(NSNumber*)value doubleValue];
        [invocation setArgument:&v atIndex:idx];
    }
    if ([type isEqualToString:@"{CGPoint=dd}"])
    {
        CGPoint v = [value CGPointValue];
        [invocation setArgument:&v atIndex:idx];
    }
    if ([type isEqualToString:@"{CGRect={CGPoint=dd}{CGSize=dd}}"])
    {
        CGRect v = [value CGRectValue];
        [invocation setArgument:&v atIndex:idx];
    }
}

+ (id)invoke:(NSDictionary*)params onError:(void (^)(NSString*))onError
{
    id target = [DTXMethodInvocation getTarget:[params objectForKey:@"target"] onError:onError];
    if (target == nil)
    {
        onError(@"target is invalid");
        return nil;
    }
    NSString *method = [DTXMethodInvocation getString:[params objectForKey:@"method"]];
    if (method == nil)
    {
        onError(@"method is not a string");
        return nil;
    }
    NSArray *args = [DTXMethodInvocation getArray:[params objectForKey:@"args"]];
    if (args == nil)
    {
        onError(@"args is not an array");
        return nil;
    }
    NSString *selector = method;
    SEL s = NSSelectorFromString(selector);
    NSMethodSignature *signature = [target methodSignatureForSelector:s];
    if (signature == nil)
    {
        onError([NSString stringWithFormat:@"selector %@ not found on class %@", selector, [target class]]);
        return nil;
    }
    NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:signature];
    invocation.target = target;
    [invocation setSelector:s];
    for (int i = 0; i<[args count]; i++)
    {
        id arg = args[i];
        id argValue = [DTXMethodInvocation getArgValue:arg onError:onError];
        if (argValue == nil)
        {
            onError([NSString stringWithFormat:@"invalid arg value %d", i]);
            return nil;
        }
        if (![argValue isKindOfClass:[NSValue class]])
        {
            [invocation setArgument:&argValue atIndex:i + 2];
        }
        else
        {
            [DTXMethodInvocation invocation:invocation setNonPointerArg:argValue atIndex:i + 2];
        }
    }
    [invocation invoke];
    return [DTXMethodInvocation getReturnValue:invocation];
}

@end
