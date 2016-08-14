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

@end
