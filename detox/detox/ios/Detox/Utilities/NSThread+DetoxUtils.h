//
//  NSThread+DetoxUtils.h
//  Detox
//
//  Created by Leo Natan (Wix) on 7/16/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface NSThread (DetoxUtils)

@property (nonatomic, class, readonly, copy) NSString* dtx_demangledCallStackSymbols NS_SWIFT_NAME(demangledCallStackSymbols);

+ (NSString*)dtx_demangledCallStackSymbolsForReturnAddresses:(NSArray<NSNumber*>*)returnAddresses startIndex:(NSInteger)startIndex NS_SWIFT_NAME(demangledCallStackSymbols(forReturnAddresses:startIndex:));

@end

NS_ASSUME_NONNULL_END
