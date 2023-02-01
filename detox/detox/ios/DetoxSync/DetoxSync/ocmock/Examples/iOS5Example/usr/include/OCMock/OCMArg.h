//---------------------------------------------------------------------------------------
//  $Id$
//  Copyright (c) 2009-2010 by Mulle Kybernetik. See License file for details.
//---------------------------------------------------------------------------------------

#import <Foundation/Foundation.h>

@interface OCMArg : NSObject 

// constraining arguments

+ (id)any;
+ (void *)anyPointer;
+ (id)isNil;
+ (id)isNotNil;
+ (id)isNotEqual:(id)value;
+ (id)checkWithSelector:(SEL)selector onObject:(id)anObject;
#if NS_BLOCKS_AVAILABLE
+ (id)checkWithBlock:(BOOL (^)(id))block;
#endif

// manipulating arguments

+ (id *)setTo:(id)value;

// internal use only

+ (id)resolveSpecialValues:(NSValue *)value;

@end

#define OCMOCK_ANY [OCMArg any]
#define OCMOCK_VALUE(variable) [NSValue value:&variable withObjCType:@encode(__typeof__(variable))]
