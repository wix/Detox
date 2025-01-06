//
//  CustomKeyboardDelegate.swift (example)
//  Created by Asaf Korem (Wix.com) on 2024.
//


import UIKit

protocol CustomKeyboardDelegate: AnyObject {
    func customKeyboardTappedButton(_ sender: CustomKeyboardView)
}

class CustomKeyboardView: UIView {
    weak var delegate: CustomKeyboardDelegate?
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        loadView()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        loadView()
    }
    
    func loadView() {
        let kbButton = UIButton(type: .custom)
        kbButton.translatesAutoresizingMaskIntoConstraints = false
        kbButton.setTitle("Hello", for: .normal)
        kbButton.addTarget(self, action: #selector(buttonTapped), for: .touchUpInside)
        kbButton.accessibilityIdentifier = "keyboardHelloButton"
        
        addSubview(kbButton)
        
        NSLayoutConstraint.activate([
            kbButton.widthAnchor.constraint(greaterThanOrEqualToConstant: 44),
            kbButton.heightAnchor.constraint(equalToConstant: 44),
            kbButton.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 20),
            kbButton.topAnchor.constraint(equalTo: topAnchor, constant: 20)
        ])
    }
    
    @objc private func buttonTapped(_ sender: Any) {
        delegate?.customKeyboardTappedButton(self)
    }
}

class CustomKeyboardViewController: UIViewController {
    private var textField: UITextField!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        view.backgroundColor = .systemBackground
        
        let closeButton = UIButton(type: .system)
        closeButton.setImage(UIImage(systemName: "xmark.circle.fill"), for: .normal)
        closeButton.translatesAutoresizingMaskIntoConstraints = false
        closeButton.accessibilityIdentifier = "closeButton"
        closeButton.addTarget(self, action: #selector(close), for: .primaryActionTriggered)
        
        let inputView = CustomKeyboardView()
        inputView.translatesAutoresizingMaskIntoConstraints = false
        inputView.delegate = self
        inputView.backgroundColor = .lightGray
        
        let text = UITextField()
        text.translatesAutoresizingMaskIntoConstraints = false
        text.inputView = inputView
        text.borderStyle = .roundedRect
        text.accessibilityIdentifier = "textWithCustomInput"
        
        let obscuredLabel = UILabel()
        obscuredLabel.translatesAutoresizingMaskIntoConstraints = false
        obscuredLabel.text = "Obscured by keyboard"
        
        textField = text
        
        view.addSubview(closeButton)
        view.addSubview(text)
        view.addSubview(obscuredLabel)
        
        NSLayoutConstraint.activate([
            text.heightAnchor.constraint(equalToConstant: 50),
            text.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 20),
            view.safeAreaLayoutGuide.trailingAnchor.constraint(equalTo: text.trailingAnchor, constant: 20),
            text.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 50),
            
            inputView.widthAnchor.constraint(equalToConstant: view.frame.size.width),
            
            view.layoutMarginsGuide.trailingAnchor.constraint(equalTo: closeButton.trailingAnchor),
            view.layoutMarginsGuide.topAnchor.constraint(equalTo: closeButton.topAnchor),
            
            obscuredLabel.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 20),
            view.safeAreaLayoutGuide.trailingAnchor.constraint(greaterThanOrEqualTo: obscuredLabel.trailingAnchor, constant: 20),
            view.safeAreaLayoutGuide.bottomAnchor.constraint(equalTo: obscuredLabel.bottomAnchor, constant: 50)
        ])
    }
    
    @objc private func close() {
        presentingViewController?.dismiss(animated: true)
    }
}

// MARK: - CustomKeyboardDelegate
extension CustomKeyboardViewController: CustomKeyboardDelegate {
    func customKeyboardTappedButton(_ sender: CustomKeyboardView) {
        textField.text = "World!"
    }
}
