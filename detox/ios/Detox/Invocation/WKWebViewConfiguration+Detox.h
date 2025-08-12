//
//  WKWebViewConfiguration+Detox.h (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

@import WebKit;

NS_ASSUME_NONNULL_BEGIN

@interface WKWebViewConfiguration (Detox)

- (BOOL)shouldDisableWebKitSecurity;

@end

@interface WKWebView (DetoxSecurity)

- (instancetype)dtx_initWithFrame:(CGRect)frame configuration:(WKWebViewConfiguration *)configuration;

@end

NS_ASSUME_NONNULL_END
