#import "NativeModule.h"

@implementation NativeModule

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(echoWithoutResponse:(NSString *)str)
{
  NSLog(@"NativeModule echoWithoutResponse called");
}

RCT_EXPORT_METHOD(echoWithResponse:(NSString *)str
                          resolver:(RCTPromiseResolveBlock)resolve
                          rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve(str);
  NSLog(@"NativeModule echoWithResponse called");
}

@end
