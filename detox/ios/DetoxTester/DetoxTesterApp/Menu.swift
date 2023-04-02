//
//  Menu.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import SwiftUI

struct Menu: UIViewControllerRepresentable {
  typealias UIViewControllerType = UIViewController

  func makeUIViewController(context: Context) -> UIViewController {
    let storyboard = UIStoryboard(name: "MenuStoryboard",bundle: nil)
    let viewController = storyboard.instantiateInitialViewController()!
    return viewController
  }

  func updateUIViewController(_ uiViewController: UIViewController, context: Context) {
  }
}
