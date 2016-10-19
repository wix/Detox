#import "NativeModule.h"

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

@end
