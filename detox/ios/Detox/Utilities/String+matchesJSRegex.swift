//
//  String+matchesJSRegex.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2022.
//
import Foundation

extension String {
	/// Returns whether the whole string matches the given `jsRegex`.
	/// JS flags has the format of `/<pattern>/<flags>`.
	/// Flags can be either:
	/// - i: With this flag the search is case-insensitive: no difference between A and a (see the example below).
	/// - s: Enables “dotall” mode, that allows a dot . to match newline character \n (covered in the chapter Character classes).
	/// - m: Multiline mode (covered in the chapter Multiline mode of anchors ^ $, flag "m").
	/// Other flags (e.g. g,u,s) are not supported as they do not have equivalents in Swift.
	///
	/// - See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
	public func matchesJSRegex(to jsRegex: String) -> Bool {
		let flagsChars = flagsChars(from: jsRegex)
		let pattern = pattern(from: jsRegex, flagsChars: flagsChars)
		let options = regexOptions(from: flagsChars)

		let regex = try! NSRegularExpression(pattern: pattern, options: options)
		let searchRange = NSRange(location: 0, length: self.utf16.count)
		let match = regex.firstMatch(
			in: self,
			options: [],
			range: searchRange
		)

		guard let match = match else {
			return false
		}

		return searchRange == match.range
	}

	private func flagsChars(from jsRegex: String) -> [Character] {
		let separated = jsRegex.components(separatedBy: "/")

		guard jsRegex.last != "/", let lastChars = separated.last else {
			return []
		}

		return Array(lastChars)
	}

	private func regexOptions(from flagsChars: [Character]) -> NSRegularExpression.Options {
		return .init(rawValue: flagsChars.reduce(
			.zero,
			{ partialValue, flagChar in
				guard let option = regexOption(from: flagChar) else {
					return partialValue
				}

				return partialValue | option.rawValue
			}))
	}

	private func pattern(from jsRegex: String, flagsChars: [Character]) -> String {
		return String(jsRegex.dropLast(flagsChars.count + 1).dropFirst(1))
	}

	private func regexOption(from flagChar: Character) -> NSRegularExpression.Options? {
		switch(flagChar) {
			case "i": return .caseInsensitive
			case "s": return .dotMatchesLineSeparators
            case "m": return .anchorsMatchLines
			default: return nil
		}
	}
}
