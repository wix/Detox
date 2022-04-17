//
//  TapViewController.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import UIKit

class TapViewController: UIViewController {
  @IBOutlet var tapButton: UIButton!
  @IBOutlet var dismissButton: UIButton!
  @IBOutlet var label: UILabel!

  override func viewDidLoad() {
    super.viewDidLoad()

    let tapGestureRecognizer = UITapGestureRecognizer(target: self, action: #selector(tapped))
    tapButton.addGestureRecognizer(tapGestureRecognizer)

    let dismissGestureRecognizer = UITapGestureRecognizer(target: self, action: #selector(dismissed))
    dismissButton.addGestureRecognizer(dismissGestureRecognizer)
  }

  @objc private func tapped() {
    label.text = "Success!"
  }

  @objc private func dismissed() {
    dismiss(animated: true, completion: nil)
  }
}
