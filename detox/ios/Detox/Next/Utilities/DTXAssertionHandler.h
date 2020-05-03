//
//  DTXAssertionHandler.h
//  Detox
//
//  Created by Leo Natan (Wix) on 4/28/20.
//  Copyright © 2020 Wix. All rights reserved.
//

@import UIKit;

NS_ASSUME_NONNULL_BEGIN

@interface DTXTestAssertionException : NSException

+ (NSException *)exceptionWithName:(NSExceptionName)name reason:(nullable NSString *)reason userInfo:(nullable NSDictionary *)userInfo view:(nullable UIView*)view;

+ (NSException *)exceptionWithName:(NSExceptionName)name reason:(nullable NSString *)reason userInfo:(nullable NSDictionary *)userInfo NS_UNAVAILABLE;

@property (nonatomic, strong, nullable) UIView* view;

@end

@interface DTXAssertionHandler : NSObject

+ (__nullable id)try:(id(NS_NOESCAPE ^)(void))block error:(NSError * __nullable * __null_unspecified)error NS_REFINED_FOR_SWIFT;

+ (void)handleFailureInMethod:(SEL)selector object:(id)object file:(NSString *)fileName lineNumber:(NSInteger)line view:(nullable UIView*)view description:(NSString *)format,... NS_FORMAT_FUNCTION(6,7);

+ (void)handleFailureInFunction:(NSString *)functionName file:(NSString *)fileName lineNumber:(NSInteger)line view:(nullable UIView*)view description:(NSString *)format,... NS_FORMAT_FUNCTION(5,6);

+ (void)handleFailureInMethod:(SEL)selector object:(id)object file:(NSString *)fileName lineNumber:(NSInteger)line view:(nullable UIView*)view description:(NSString *)format arguments:(va_list)arguments;

+ (void)handleFailureInFunction:(NSString *)functionName file:(NSString *)fileName lineNumber:(NSInteger)line view:(nullable UIView*)view description:(NSString *)format arguments:(va_list)arguments;

@end

extern id dtx_try(void (^block)(void), NSError * __nullable * __null_unspecified error) NS_REFINED_FOR_SWIFT;

#define DTXViewAssert(condition, _view, desc, ...)	\
do {				\
	__PRAGMA_PUSH_NO_EXTRA_ARG_WARNINGS \
	if (__builtin_expect(!(condition), 0)) {		\
			NSString *__assert_file__ = [NSString stringWithUTF8String:__FILE__]; \
			__assert_file__ = __assert_file__ ? __assert_file__ : @"<Unknown File>"; \
		[DTXAssertionHandler handleFailureInMethod:_cmd \
		object:self file:__assert_file__ \
			lineNumber:__LINE__ view:_view description:(desc), ##__VA_ARGS__]; \
	}				\
	__PRAGMA_POP_NO_EXTRA_ARG_WARNINGS \
} while(0)

#define DTXCViewAssert(condition, _view, desc, ...) \
do {				\
	__PRAGMA_PUSH_NO_EXTRA_ARG_WARNINGS \
	if (__builtin_expect(!(condition), 0)) {		\
		NSString *__assert_fn__ = [NSString stringWithUTF8String:__PRETTY_FUNCTION__]; \
		__assert_fn__ = __assert_fn__ ? __assert_fn__ : @"<Unknown Function>"; \
		NSString *__assert_file__ = [NSString stringWithUTF8String:__FILE__]; \
		__assert_file__ = __assert_file__ ? __assert_file__ : @"<Unknown File>"; \
	[DTXAssertionHandler handleFailureInFunction:__assert_fn__ \
	file:__assert_file__ \
		lineNumber:__LINE__ view:_view description:(desc), ##__VA_ARGS__]; \
}				\
	__PRAGMA_POP_NO_EXTRA_ARG_WARNINGS \
} while(0)

#define DTXAssert(condition, desc, ...)	DTXViewAssert(condition, nil, desc, ##__VA_ARGS__)

#define DTXCAssert(condition, desc, ...) DTXCViewAssert(condition, nil, desc, ##__VA_ARGS__)

#define DTXParameterAssert(condition) DTXAssert((condition), @"Invalid parameter not satisfying: %@", @#condition)

#define DTXCParameterAssert(condition) DTXCAssert((condition), @"Invalid parameter not satisfying: %@", @#condition)

NS_ASSUME_NONNULL_END
