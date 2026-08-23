/**
 * The real instrumented app fixture (spec 003's full-fidelity leg).
 *
 * Detox instruments iOS simulator apps by injecting a dylib at launch
 * (`DYLD_INSERT_LIBRARIES`) — the app binary itself never links Detox. That
 * means a real testee needs only two parts, neither of which drags in
 * RN/Metro/CocoaPods:
 *
 *  1. a minimal UIKit app compiled on demand with `xcrun clang` (same
 *     tradition as `apps.ts`' stub, plus UIKit): a "Say Hello" button and a
 *     label saying "Hello!!!" that stays hidden until the button's handler
 *     runs — so a passing visibility expectation after a tap proves the tap
 *     physically happened;
 *  2. the injectable Detox framework binary from the standard cache
 *     (`~/Library/Detox/ios/framework/<hash>/Detox.framework/Detox`), built
 *     once per Xcode/Detox version by `detox build-framework-cache` in the
 *     Detox 20 checkout — a suite precondition, like Xcode itself.
 */
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readdir, stat, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

const infoPlist = (bundleId: string): string => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleIdentifier</key><string>${bundleId}</string>
  <key>CFBundleName</key><string>DetoxHello</string>
  <key>CFBundleExecutable</key><string>DetoxHello</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleSupportedPlatforms</key><array><string>iPhoneSimulator</string></array>
  <key>DTPlatformName</key><string>iphonesimulator</string>
  <key>MinimumOSVersion</key><string>15.0</string>
  <key>UIDeviceFamily</key><array><integer>1</integer></array>
  <key>UILaunchScreen</key><dict/>
</dict></plist>
`;

/**
 * The whole app. The label is born hidden; only the button's own handler
 * reveals it — the accept test's proof that a tap really landed.
 */
const HELLO_MAIN_M = `#import <UIKit/UIKit.h>

@interface HelloViewController : UIViewController
@property (strong) UILabel *label;
@end
@implementation HelloViewController
- (void)viewDidLoad {
  [super viewDidLoad];
  self.view.backgroundColor = UIColor.whiteColor;
  UIButton *button = [UIButton buttonWithType:UIButtonTypeSystem];
  [button setTitle:@"Say Hello" forState:UIControlStateNormal];
  button.frame = CGRectMake(60, 200, 200, 44);
  [button addTarget:self action:@selector(sayHello) forControlEvents:UIControlEventTouchUpInside];
  [self.view addSubview:button];
  self.label = [[UILabel alloc] initWithFrame:CGRectMake(60, 300, 200, 44)];
  self.label.hidden = YES;
  self.label.text = @"Hello!!!";
  [self.view addSubview:self.label];
}
- (void)sayHello { self.label.hidden = NO; }
@end

@interface HelloAppDelegate : UIResponder <UIApplicationDelegate>
@property (nonatomic, strong) UIWindow *window;
@end
@implementation HelloAppDelegate
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  self.window = [[UIWindow alloc] initWithFrame:UIScreen.mainScreen.bounds];
  self.window.rootViewController = [HelloViewController new];
  [self.window makeKeyAndVisible];
  return YES;
}
@end

int main(int argc, char *argv[]) {
  @autoreleasepool {
    return UIApplicationMain(argc, argv, nil, NSStringFromClass([HelloAppDelegate class]));
  }
}
`;

/**
 * Builds the minimal real UIKit app carrying `bundleId`. Compiled on demand
 * against the iphonesimulator SDK (`simctl install` verifies architecture,
 * so no prebuilt blob can be checked in — `apps.ts` precedent).
 */
export async function buildHelloAppExternally(
  bundleId: string,
  signal?: AbortSignal,
): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'detox-hello-app-'));
  const appPath = path.join(dir, 'DetoxHello.app');
  await mkdir(appPath);
  await writeFile(path.join(appPath, 'Info.plist'), infoPlist(bundleId));
  const mainM = path.join(dir, 'main.m');
  await writeFile(mainM, HELLO_MAIN_M);
  const clangArch = process.arch === 'arm64' ? 'arm64' : 'x86_64';
  await run(
    'xcrun',
    [
      '-sdk',
      'iphonesimulator',
      'clang',
      '-fobjc-arc',
      '-arch',
      clangArch,
      '-framework',
      'UIKit',
      '-framework',
      'Foundation',
      '-o',
      path.join(appPath, 'DetoxHello'),
      mainM,
    ],
    { signal },
  );
  // A full ad-hoc bundle signature, not just ld64's linker-signed stamp: a
  // merely linker-signed Mach-O written by cp/ditto can be asynchronously
  // deleted by a security service, losing the bundle's executable and
  // flaking `simctl install` with "missing its bundle executable".
  await run('codesign', ['--force', '--sign', '-', appPath], { signal });
  return appPath;
}

const FRAMEWORK_CACHE_DIR = path.join(homedir(), 'Library', 'Detox', 'ios', 'framework');

/**
 * Resolves the injectable Detox framework binary from the standard cache,
 * newest entry first. Absence is a loud, instructive precondition failure,
 * never a silent skip.
 */
export async function resolveDetoxFrameworkExternally(signal?: AbortSignal): Promise<string> {
  signal?.throwIfAborted();
  const candidates: Array<{ binary: string; mtimeMs: number }> = [];
  let entries: string[] = [];
  try {
    entries = await readdir(FRAMEWORK_CACHE_DIR);
  } catch {
    // fall through to the instructive error below
  }
  for (const entry of entries) {
    const binary = path.join(FRAMEWORK_CACHE_DIR, entry, 'Detox.framework', 'Detox');
    try {
      const info = await stat(binary);
      candidates.push({ binary, mtimeMs: info.mtimeMs });
    } catch {
      // not a framework entry; ignore
    }
  }
  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
  const newest = candidates[0];
  if (!newest) {
    throw new Error(
      'precondition: no Detox iOS framework cache under ' +
        FRAMEWORK_CACHE_DIR +
        ' — run `detox build-framework-cache` in the Detox 20 checkout once ' +
        'per Xcode/Detox version (a suite precondition, like Xcode itself)',
    );
  }
  return newest.binary;
}
