/**
 * Stub .app fixtures, installed (mostly) from outside Detox.
 *
 * Spec 005 plants these with `simctl install` directly (scaffolding, not
 * product API — a broken product install must not pass the uninstall/erase
 * tests vacuously); spec 003 plants them through `device.installApp` and then
 * launches them for real, playing their wire role from the host with the
 * fake testee.
 *
 * Because launches are real, the stub is a real minimal UIKit app, not a bare
 * `pause()` binary: a non-UIKit executable never completes its SpringBoard
 * launch transaction, and the next `simctl launch` on that device queues
 * behind the unfinished transaction forever. `UIApplicationMain` finishes the
 * transaction and then idles in its runloop.
 *
 * The stub is compiled on demand: `simctl install` verifies the executable's
 * architecture against the simulator runtime (a copied host binary is
 * rejected with "Failed to find matching arch"), so a portable prebuilt blob
 * cannot be checked in. One `xcrun clang` call per bundle id per run, against
 * the iphonesimulator SDK.
 */
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { arch } from 'node:process';
import * as path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

const infoPlist = (bundleId: string): string => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleIdentifier</key><string>${bundleId}</string>
  <key>CFBundleName</key><string>DetoxStub</string>
  <key>CFBundleExecutable</key><string>DetoxStub</string>
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

/** The smallest app SpringBoard considers fully launched: an empty window. */
const STUB_MAIN_M = `#import <UIKit/UIKit.h>

@interface StubAppDelegate : UIResponder <UIApplicationDelegate>
@property (nonatomic, strong) UIWindow *window;
@end
@implementation StubAppDelegate
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  self.window = [[UIWindow alloc] initWithFrame:UIScreen.mainScreen.bounds];
  self.window.rootViewController = [UIViewController new];
  [self.window makeKeyAndVisible];
  return YES;
}
@end

int main(int argc, char *argv[]) {
  @autoreleasepool {
    return UIApplicationMain(argc, argv, nil, NSStringFromClass([StubAppDelegate class]));
  }
}
`;

/**
 * Builds an installable, launchable stub .app bundle carrying `bundleId`.
 * Returns the bundle path. The stub speaks no Detox — when a test launches
 * it, the fake testee plays the wire role from the host.
 */
export async function buildStubAppExternally(
  bundleId: string,
  signal?: AbortSignal,
): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'detox-stub-app-'));
  const appPath = path.join(dir, 'DetoxStub.app');
  await mkdir(appPath);
  await writeFile(path.join(appPath, 'Info.plist'), infoPlist(bundleId));
  const mainM = path.join(dir, 'main.m');
  await writeFile(mainM, STUB_MAIN_M);
  const clangArch = arch === 'arm64' ? 'arm64' : 'x86_64';
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
      path.join(appPath, 'DetoxStub'),
      mainM,
    ],
    { signal },
  );
  // Same insurance as `real-app.ts`: macOS 26 asynchronously deletes copies
  // of merely linker-signed Mach-Os. A full ad-hoc bundle signature keeps
  // the copies alive.
  await run('codesign', ['--force', '--sign', '-', appPath], { signal });
  return appPath;
}

/** Installs a bundle with `simctl install`, behind the client's back. */
export async function installAppExternally(
  udid: string,
  appPath: string,
  signal?: AbortSignal,
): Promise<void> {
  await run('xcrun', ['simctl', 'install', udid, appPath], { signal });
}

/** Whether `simctl listapps` knows the bundle — ground truth for erase/uninstall. */
export async function isAppInstalledExternally(
  udid: string,
  bundleId: string,
  signal?: AbortSignal,
): Promise<boolean> {
  const { stdout } = await run('xcrun', ['simctl', 'listapps', udid], { signal });
  return stdout.includes(`"${bundleId}"`);
}
