//
//  DetoxUserActivityParser.swift
//  Detox
//
//  Created by Leo Natan (Wix) on 10/16/19.
//

import Foundation

public class DetoxUserActivityParser : NSObject {
	@objc(parseUserActivityWithString:)
	public class func parseUserActivity(str: String?) -> [String: Any]? {
		guard let str = str else {
			return nil
		}
		
		guard let data = str.data(using: .utf8) else {
			Swift.fatalError("Unable to read user activity data.")
		}
		
		guard let jsonObject = (try? JSONSerialization.jsonObject(with: data, options: .init(rawValue: 0)) as? [String: Any]) else {
			Swift.fatalError("Unable to parse user activity data file.")
		}
		
		return jsonObject
	}

}
