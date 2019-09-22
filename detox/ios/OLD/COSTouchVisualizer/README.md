# COSTouchVisualizer

![COSTouchVisualizer](https://raw.githubusercontent.com/conopsys/COSTouchVisualizer/master/touchvisdemo.gif "COSTouchVisualizer iOS")

[![Version](http://cocoapod-badges.herokuapp.com/v/COSTouchVisualizer/badge.png)](http://cocoadocs.org/docsets/COSTouchVisualizer)
[![Platform](http://cocoapod-badges.herokuapp.com/p/COSTouchVisualizer/badge.png)](http://cocoadocs.org/docsets/COSTouchVisualizer)

## Swift Usage

Using COSTouchVisualizer is possible with Swift.  Inside your AppDelegate, redefine your window and declare a visualizer window with storyboards.

**With Storyboards**
```swift
class AppDelegate: UIResponder, UIApplicationDelegate, COSTouchVisualizerWindowDelegate {

  lazy var window: UIWindow? = {
      var customWindow = COSTouchVisualizerWindow(frame: UIScreen.mainScreen().bounds)
      customWindow.touchVisualizerWindowDelegate = self
      return customWindow
      }()
...
}
```
**Without Storyboards**

## Objective-C Usage

To run the example project; clone the repo, and run `pod update` from the Example directory first.  By default, this project has `Debug Mode` disabled.  If you want to see the gestures while you're testing, follow the **Debugging Mode** instructions.

**With Storyboards**
 in your `AppDelegate` implementation simply add the following getter

```objective-c
#import <COSTouchVisualizerWindow.h>

...

// Add this method to your AppDelegate method
- (COSTouchVisualizerWindow *)window {
    static COSTouchVisualizerWindow *visWindow = nil;
    if (!visWindow) visWindow = [[COSTouchVisualizerWindow alloc] initWithFrame:[[UIScreen mainScreen] bounds]];
    return visWindow;
}
```

**Without Storyboards**
```objective-c
#import <COSTouchVisualizerWindow.h>

...

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    // Setup window
    self.window = [[COSTouchVisualizerWindow alloc] initWithFrame:[[UIScreen mainScreen] bounds]];
    self.window.backgroundColor = [UIColor whiteColor];

    ...

}
```

**Delegate**

To make the window change active status dynamically or to enable debugging mode, you could make an object
implements the ```COSTouchVisualizerWindowDelegate``` protocol.

Here are 2 optional methods in this delegate protocol:
```objective-c
- (BOOL)touchVisualizerWindowShouldShowFingertip:(COSTouchVisualizerWindow *)window;
- (BOOL)touchVisualizerWindowShouldAlwaysShowFingertip:(COSTouchVisualizerWindow *)window;
```

By default, the window only shows fingertip when there is a mirrored window.

The first delegate method (```-touchVisualizerWindowShouldShowFingertip:```) tells the window to enable
fingertip or not. You should return ```YES``` to enable the fingertip feature, or ```NO``` if you want to close this
feature.

The second method (```-touchVisualizerWindowShouldAlwaysShowFingertip:```) tells the window to always show the
fingertip even if there's no any mirrored screens (when returning YES). If this method returns NO, the window
only show fingertip when connected to a mirrored screen.

```objective-c
- (COSTouchVisualizerWindow *)window {
  if (!_customWindow) {
    _customWindow = [[COSTouchVisualizerWindow alloc] initWithFrame:[[UIScreen mainScreen] bounds]];

    // ... other setup code

    _customWindow.touchVisualizerWindowDelegate = self;
  }
  return _customWindow;
}

- (BOOL)touchVisualizerWindowShouldAlwaysShowFingertip:(COSTouchVisualizerWindow *)window {
    return YES;  // Return YES to make the fingertip always display even if there's no any mirrored screen.
                 // Return NO or don't implement this method if you want to keep the fingertip display only when
                 // the device is connected to a mirrored screen.
}

- (BOOL)touchVisualizerWindowShouldShowFingertip:(COSTouchVisualizerWindow *)window {
    return YES;  // Return YES or don't implement this method to make this window show fingertip when necessary.
                 // Return NO to make this window not to show fingertip.
}
```

**Customization**

```objective-c
// Add these lines after the windows is initialized
// Touch Color
[visWindow setFillColor:[UIColor yellowColor]];
[visWindow setStrokeColor:[UIColor purpleColor]];
[visWindow setTouchAlpha:0.4];
// Ripple Color
[visWindow setRippleFillColor:[UIColor yellowColor]];
[visWindow setRippleStrokeColor:[UIColor purpleColor]];
[visWindow setRippleAlpha:0.1];
```

## Requirements

This project requires ARC.

## Installation

COSTouchVisualizer is available through [CocoaPods](http://cocoapods.org), to install
it simply add the following line to your Podfile:

    pod "COSTouchVisualizer"

## Author

Joe Blau, josephblau@gmail.com

## License

COSTouchVisualizer is available under the MIT license. See the LICENSE file for more info.
