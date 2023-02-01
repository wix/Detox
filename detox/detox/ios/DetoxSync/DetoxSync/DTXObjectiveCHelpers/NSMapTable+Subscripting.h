//
//  NSMapTable+Subscripting.h
//  DTXObjectiveCHelpers
//
//  Created by Leo Natan (Wix) on 11/27/18.
//  Copyright © 2017-2020 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface NSMapTable (Subscripting)

- (id)objectForKeyedSubscript:(id)key;
- (void)setObject:(id)obj forKeyedSubscript:(id)key;

@end
