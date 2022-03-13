//
//  WaitUntilDone.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Blocks the main-thread until `done` block is called. Can execute operations on main-thread
/// (without releasing it) by calling `exec`.
public func WaitUntilDone(
  closure: @escaping (
    _ done: @escaping () -> Void,
    _ exec: @escaping (@escaping () -> Void) -> Void
  ) -> Void
) {
  let semaphore = DispatchSemaphore(value: 0)
  let done: () -> Void = {
    syncLog("`done()` was called", type: .debug)
    semaphore.signal()
  }

  var waitingToExec: (() -> Void)? = nil
  let exec: (@escaping () -> Void) -> Void = { toExec in
    syncLog("`exec` was called", type: .debug)
    semaphore.signal()
    waitingToExec = toExec
  }
  
  closure(done, exec)

  syncLog("synchronization started (thread: \(Thread.current.description))")

  semaphore.wait()

  while let toExec = waitingToExec {
    syncLog("executing (thread: \(Thread.current.description))")
    waitingToExec = nil
    toExec()
    semaphore.wait()
  }

  syncLog("synchronization ended")
}
