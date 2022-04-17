//
//  LongPressViewController.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import UIKit

class LongPressViewController: UIViewController {
  @IBOutlet var longPressButton: UIButton!
  @IBOutlet var dismissButton: UIButton!
  @IBOutlet var label: UILabel!

  override func viewDidLoad() {
    super.viewDidLoad()

    let longPressGestureRecognizer = UILongPressGestureRecognizer(
      target: self,
      action: #selector(pressed)
    )
    longPressButton.addGestureRecognizer(longPressGestureRecognizer)

    let dismissGestureRecognizer = UITapGestureRecognizer(target: self, action: #selector(dismissed))
    dismissButton.addGestureRecognizer(dismissGestureRecognizer)
  }

  @objc private func pressed() {
    print("Long-press button long-pressed")
    label.text = "Success!"
  }

  @objc private func dismissed() {
    print("Dismiss button tapped")
    dismiss(animated: true, completion: nil)
  }
}
