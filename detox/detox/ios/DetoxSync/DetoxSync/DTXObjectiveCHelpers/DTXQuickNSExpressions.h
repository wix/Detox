//
//  DTXQuickNSExpressions.h
//  DTXObjectiveCHelpers
//
//  Created by Leo Natan (Wix) on 1/16/19.
//  Copyright © 2017-2020 Wix. All rights reserved.
//

#ifndef DTXQuickNSExpressions_h
#define DTXQuickNSExpressions_h

#import <Foundation/Foundation.h>

static DTX_ALWAYS_INLINE NSExpression* DTXKeyPathExpression(NSString* keyPath)
{
	return [NSExpression expressionForKeyPath:keyPath];
}

static DTX_ALWAYS_INLINE NSExpression* DTXFunctionExpression(NSString* function, NSArray* arguments)
{
	return [NSExpression expressionForFunction:function arguments:arguments];
}

#endif /* DTXQuickNSExpressions_h */
