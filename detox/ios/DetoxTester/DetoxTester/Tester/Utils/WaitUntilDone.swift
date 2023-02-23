//
//  WaitUntilDone.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Blocks the main-thread until `done` block is called. Can execute operations on the current
/// thread synchronically (without releasing it) by passing false `isBackgroundTask` to `exec`,
/// otherwise executing the operation asynchronically on an arbitrary background thread.
func WaitUntilDone(
  closure: @escaping (
    _ done: @escaping () -> Void,
    _ exec: @escaping (_ isBackgroundTask: Bool, @escaping () -> Void) -> Void
  ) -> Void
) {
  let backgroundQueue = DispatchQueue.global(qos: .background)
  let execQueue = DispatchQueue(label: "Exec Queue")

  let semaphore = DispatchSemaphore(value: 0)

  let done: () -> Void = {
    syncLog("`done()` was called", type: .debug)
    semaphore.signal()
  }

  var waitingToExec: (() -> Void)? = nil

  // Allow only one exec operation to be handled at once.
  let waitingToExecSemaphore = DispatchSemaphore(value: 1)

  let exec: (Bool, @escaping () -> Void) -> Void = { isBackgroundTask, toExec in
    syncLog(
      "`exec` was called (executing on \(isBackgroundTask ? "background" : "main exec") queue)",
      type: .debug
    )

    if (isBackgroundTask) {
      backgroundQueue.async {
        syncLog("running on thread: \(Thread.current)")
        syncLog("`exec` started asynchronically", type: .debug)
        toExec()
      }
    } else {
      execQueue.async {
        syncLog("running on thread: \(Thread.current)")

        waitingToExecSemaphore.wait()
        syncLog("next synchronous execution code block was set by `exec`", type: .debug)

        waitingToExec = toExec

        semaphore.signal()
      }
    }
  }
  
  closure(done, exec)

  syncLog(
    "wait-until-done synchronization started, running on thread: \(Thread.current)",
    type: .debug
  )

  semaphore.wait()

  while let toExec = waitingToExec {
    syncLog("`exec` started on thread: \(Thread.current)", type: .debug)

    waitingToExec = nil
    waitingToExecSemaphore.signal()

    toExec()
    syncLog("execution finished")

    syncLog("waiting for next `exec` block to be defined", type: .debug)
    semaphore.wait()
    syncLog("finished waiting for next `exec` block to be defined", type: .debug)
  }

  syncLog("wait-until-done synchronization ended on thread: \(Thread.current)")
}
