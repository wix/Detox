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
  // Allow only one exec operation to be handled at once.
  let waitingToExecSemaphore = DispatchSemaphore(value: 1)

  let exec: (@escaping () -> Void) -> Void = { toExec in
    syncLog("`exec` was called", type: .debug)

    waitingToExecSemaphore.wait()
    syncLog("next execution code block was set by `exec`", type: .debug)

    waitingToExec = toExec
    semaphore.signal()
  }
  
  closure(done, exec)

  syncLog("main thread synchronization started")

  semaphore.wait()

  while let toExec = waitingToExec {
    syncLog("executing on main thread, exec is now available")

    waitingToExec = nil
    waitingToExecSemaphore.signal()

    syncLog("execution started..")
    toExec()
    syncLog("execution ended")

    semaphore.wait()
  }

  syncLog("main thread synchronization ended")
}
