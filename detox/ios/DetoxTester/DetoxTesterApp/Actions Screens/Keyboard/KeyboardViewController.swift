//
//  KeyboardViewController.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import UIKit

class KeyboardViewController: UIViewController, UITextFieldDelegate {
  @IBOutlet var textField: UITextField!
  @IBOutlet var label: UILabel!

  override func viewDidLoad() {
    super.viewDidLoad()

    textField.delegate = self
  }

  func textFieldShouldReturn(_ textField: UITextField) -> Bool {
    print("return key tapped")
    label.text = textField.text
    return true
  }
}
