//
//  WaitUntilAppIsReady.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Wait on thread until app is ready.
public func WaitUntilAppIsReady() {
  rnLog("waiting for app to be ready")

  // TODO: implement.
  rnLog("sleep on thread: \(Thread.current.description)")
  Thread.sleep(forTimeInterval: 2)

  rnLog("application is ready")
}
