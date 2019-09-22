//
//  DTXMethodInvocation.h
//  Detox
//
//  Created by Tal Kol on 6/16/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface DTXMethodInvocation : NSObject

+ (id)invoke:(NSDictionary*)params onError:(void (^)(NSString*))onError;
+ (id)serializeValue:(id)value onError:(void (^)(NSString*))onError;

@end
