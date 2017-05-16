# Debugging detox in Xcode

1. Drag `Detox.framework` from `node_modules/detox/Detox.framework` to your project.
2. Edit your project scheme and add the following arguments to **Arguments Passes On Launch**:
	
	```
	-detoxServer
	ws://localhost:8099
	-setoxSessionId
	test
	```
3. Edit detox config in package.json: [add a custom session](/docs/APIRef.Configuration.md#server-configuration)
4. Add a configuration with `type:ios.none` to your configurations. 

	```json
	"configurations": {
		...
      "xcode": {
        "type": "ios.none",
        "name": "iPhone 7 Plus"
      }
	```
>NOTE: This configuration will not handle simulator and application lifecycle, they will have to be provided manually (via Xcode play button, or `react-native run-ios`).
4. Run detox server manually `detox run-server`
5. Run `detox test --configuration xcode`
	>NOTE: tests that expect the application to be restarted via `device.relaunchApp()` will fail.