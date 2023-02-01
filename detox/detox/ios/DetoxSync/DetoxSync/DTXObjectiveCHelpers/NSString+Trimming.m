//
//  NSString+Trimming.m
//  DTXObjectiveCHelpers
//
//  Created by Leo Natan (Wix) on 3/4/19.
//  Copyright © 2017-2020 Wix. All rights reserved.
//

#import "NSString+Trimming.h"

@implementation NSString (Trimming)

- (NSString*)stringByTrimmingWhiteSpace
{
	return [self stringByTrimmingCharactersInSet:NSCharacterSet.whitespaceCharacterSet];
}

@end
