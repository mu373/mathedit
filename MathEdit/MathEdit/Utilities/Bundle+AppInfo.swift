import Foundation

extension Bundle {
    /// The application name.
    var bundleName: String {
        object(forInfoDictionaryKey: kCFBundleNameKey as String) as! String
    }

    /// The marketing version (e.g., "1.0.0").
    var shortVersion: String {
        object(forInfoDictionaryKey: "CFBundleShortVersionString") as! String
    }

    /// The build number.
    var bundleVersion: String {
        object(forInfoDictionaryKey: kCFBundleVersionKey as String) as! String
    }

    /// The human-readable copyright.
    var copyright: String {
        object(forInfoDictionaryKey: "NSHumanReadableCopyright") as! String
    }
}
