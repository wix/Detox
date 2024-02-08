//
//  Executor+deliverPayload.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation
import XCTest

extension Executor {
  func deliverPayload(params: [String: AnyHashable], messageId: NSNumber) throws {
    execLog("delivering payload")

    let message = WhiteBoxExecutor.Message.deliverPayload(
      delayPayload: params.delayPayload,
      url: params.url,
      sourceApp: params.sourceApp,
      detoxUserNotificationDataURL: params.detoxUserNotificationDataURL,
      detoxUserActivityDataURL: params.detoxUserActivityDataURL
    )

    try execute(whiteBoxRequest: message).assertResponse(equalsTo: .completed, for: message)

    sendAction(.reportDidDeliverPayload, messageId: messageId)
  }
}

private extension Dictionary where Key == String, Value == AnyHashable {
  var detoxUserActivityDataURL: String? {
    self["detoxUserActivityDataURL"] as? String
  }

  var detoxUserNotificationDataURL: String? {
    self["detoxUserNotificationDataURL"] as? String
  }

  var sourceApp: String? {
    self["sourceApp"] as? String
  }

  var url: String? {
    self["url"] as? String
  }

  var delayPayload: Bool? {
    return (self["delayPayload"] as? NSNumber)?.boolValue
  }
}
