//
//  OverlayMessageView.swift (example)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import UIKit

@objc class OverlayMessageView: UIView {
    private var timer: Timer?
    private(set) var message: String
    private let displayDuration: TimeInterval = 2.0

    private let messageLabel: UILabel = {
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.numberOfLines = 2
        label.textAlignment = .center
        label.textColor = .white
        label.font = UIFont.boldSystemFont(ofSize: 16)
        return label
    }()

    private let closeButton: UIButton = {
        let button = UIButton(type: .system)
        button.translatesAutoresizingMaskIntoConstraints = false
        button.setTitle("×", for: .normal)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 24)
        button.setTitleColor(.white, for: .normal)
        return button
    }()

    init(message: String) {
        self.message = message
        super.init(frame: .zero)
        setup(with: message)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private func setup(with message: String) {
        translatesAutoresizingMaskIntoConstraints = false
        backgroundColor = UIColor.black.withAlphaComponent(0.7)

        messageLabel.text = message

        addSubview(messageLabel)
        addSubview(closeButton)

        NSLayoutConstraint.activate([
            heightAnchor.constraint(equalToConstant: 60),

            messageLabel.centerYAnchor.constraint(equalTo: centerYAnchor),
            messageLabel.centerXAnchor.constraint(equalTo: centerXAnchor),
            messageLabel.leadingAnchor.constraint(greaterThanOrEqualTo: leadingAnchor, constant: 40),
            messageLabel.trailingAnchor.constraint(lessThanOrEqualTo: trailingAnchor, constant: -40),

            closeButton.topAnchor.constraint(equalTo: topAnchor, constant: 5),
            closeButton.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -10),
            closeButton.widthAnchor.constraint(equalToConstant: 30),
            closeButton.heightAnchor.constraint(equalToConstant: 30)
        ])

        closeButton.addTarget(self, action: #selector(didTapClose), for: .touchUpInside)
        startTimer()
    }

    func resetTimer() {
        timer?.invalidate()
        startTimer()
    }

    private func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: displayDuration, repeats: false) { [weak self] _ in
            self?.removeFromSuperview()
        }
    }

    @objc private func didTapClose() {
        timer?.invalidate()
        removeFromSuperview()
    }

    deinit {
        timer?.invalidate()
    }
}
