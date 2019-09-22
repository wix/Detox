//
//  SetPermissionOperation.h
//  DetoxHelper
//
//  Created by Leo Natan (Wix) on 29/03/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

#import "ExtensionOperation.h"

@interface SetPermissionOperation : ExtensionOperation

@property (nonatomic, copy) NSString* bundleIdentifier;
@property (nonatomic, copy) NSString* displayName;
@property (nonatomic) NSNumber* permissionStatus;

@end
