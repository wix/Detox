//
//  SRTBonjourLocatorOperation.h
//  SocketRocket
//
//  Created by Mike Lewis on 1/28/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface SRTBonjourLocatorOperation : NSOperation

- (id)initWithKey:(NSString *)key;

@property (nonatomic, readonly, retain) NSNetService *foundService;
@property (nonatomic, readonly, retain) NSString *foundScheme;

@end
