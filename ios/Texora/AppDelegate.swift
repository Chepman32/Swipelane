import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    ensureAsyncStorageDirectory()
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "Texora",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  private func ensureAsyncStorageDirectory() {
    guard let appSupportURL = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first else {
      return
    }

    let bundleId = Bundle.main.bundleIdentifier ?? "com.texora.app"
    let storageURL = appSupportURL
      .appendingPathComponent(bundleId, isDirectory: true)
      .appendingPathComponent("RCTAsyncLocalStorage_V1", isDirectory: true)

    do {
      try FileManager.default.createDirectory(at: storageURL, withIntermediateDirectories: true, attributes: nil)
    } catch {
      NSLog("AsyncStorage directory creation failed: \(error)")
    }
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
