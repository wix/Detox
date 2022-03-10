//
//  WaitUntilDone.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

public func WaitUntilDone(closure: @escaping (@escaping () -> Void) -> Void) {
  var didCallDone = false
//  let semaphore = DispatchSemaphore(value: 0)
  let done: () -> Void = {
    syncLog("`done()` was called", type: .debug)
//    semaphore.signal()
    didCallDone = true
  }

  closure(done)

  syncLog("synchronization started (thread: \(Thread.current.description))")
//  semaphore.wait()
  while (didCallDone == false) {
    // TODO: this is a busywait workaround
    syncLog("sleeping for 1/4 second..")
    Thread.sleep(forTimeInterval: 0.25)
  }
  syncLog("synchronization ended")
}
