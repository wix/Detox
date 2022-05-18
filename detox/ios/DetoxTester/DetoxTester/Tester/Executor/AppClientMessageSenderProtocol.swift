//
//  AppClientMessageSenderProtocol.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

///
protocol AppClientMessageSenderProtocol {
  ///
  func sendMessageToClient(_ data: Data) -> Data
}
