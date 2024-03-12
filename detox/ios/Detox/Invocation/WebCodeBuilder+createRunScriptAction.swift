//
//  WebCodeBuilder+createRunScriptAction.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

/// Extends `WebCodeBuilder` with the ability to create a web run script action JS code.
extension WebCodeBuilder {
	/// Creates a JS code that runs a script on the given element.
	func createRunScriptAction(_ params: [Any], selector: String) throws -> String {
		guard let script = params.first else {
			throw dtx_errorForFatalError(
				"Missing script parameter for runScript action, got: \(String(describing: params))")
		}

		let extraParamsOrNil = params.dropFirst().compactMap({ param -> String? in
			guard let data = try? JSONSerialization.data(withJSONObject: param, options: []),
						let param = String(data: data, encoding: .utf8) else {
				return nil
			}
			return param
		}).joined(separator: ",")

		let extraParams = extraParamsOrNil.isEmpty ? "" : ",...\(extraParamsOrNil)"

		return "(\(script))(\(selector)\(extraParams));"
	}
}
