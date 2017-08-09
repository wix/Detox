#import "NativeModule.h"
#import <UIKit/UIKit.h>
#import <React/RCTRootView.h>

static int CALL_COUNTER = 0;

@implementation NativeModule

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(echoWithoutResponse:(NSString *)str)
{
  // NSLog(@"NativeModule echoWithoutResponse called");
  CALL_COUNTER++;
}

RCT_EXPORT_METHOD(echoWithResponse:(NSString *)str
                          resolver:(RCTPromiseResolveBlock)resolve
                          rejecter:(RCTPromiseRejectBlock)reject)
{
  CALL_COUNTER++;
  resolve(str);
  // NSLog(@"NativeModule echoWithResponse called");
}

RCT_EXPORT_METHOD(nativeSetTimeout:(NSTimeInterval)delay block:(RCTResponseSenderBlock)block)
{
	dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delay * NSEC_PER_SEC)), dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
		dispatch_async(dispatch_get_main_queue(), ^{
			block(@[]);
		});
	});
}

RCT_EXPORT_METHOD(switchToNativeRoot)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    UIViewController* newRoot = [UIViewController new];
    newRoot.view.backgroundColor = [UIColor whiteColor];
    UILabel* label = [UILabel new];
    label.text = @"this is a new native root";
    [label sizeToFit];
    [[newRoot view] addSubview:label];
    label.center = newRoot.view.center;
    
    id<UIApplicationDelegate> delegate = [[UIApplication sharedApplication] delegate];
    [[delegate window]setRootViewController:newRoot];
    [[delegate window] makeKeyAndVisible];
  });
}

RCT_EXPORT_METHOD(switchToMultipleReactRoots)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    id<UIApplicationDelegate> delegate = [[UIApplication sharedApplication] delegate];
    RCTBridge* bridge = ((RCTRootView*)delegate.window.rootViewController.view).bridge;
    
    UIViewController* newRoot = [UIViewController new];
    newRoot.view = [[RCTRootView alloc]initWithBridge:bridge moduleName:@"example" initialProperties:nil];
    newRoot.tabBarItem.title = @"1";
    
    
    UIViewController* newRoot2 = [UIViewController new];
    newRoot2.view = [[RCTRootView alloc]initWithBridge:bridge moduleName:@"example" initialProperties:nil];
    newRoot2.tabBarItem.title = @"2";
    
    UIViewController* newRoot3 = [UIViewController new];
    newRoot3.view = [[RCTRootView alloc]initWithBridge:bridge moduleName:@"example" initialProperties:nil];
    newRoot3.tabBarItem.title = @"3";
    
    UIViewController* newRoot4 = [UIViewController new];
    newRoot4.view = [[RCTRootView alloc]initWithBridge:bridge moduleName:@"example" initialProperties:nil];
    newRoot4.tabBarItem.title = @"4";
    
    UITabBarController* tbc = [UITabBarController new];
    tbc.viewControllers = @[newRoot, newRoot2, newRoot3, newRoot4];
    
    [[delegate window]setRootViewController:tbc];
    [[delegate window] makeKeyAndVisible];
  });
}

@end
