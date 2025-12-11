//
//  DriftProApp.swift
//  DriftPro
//
//  Created by Hazher  on 11/07/2025.
//

import SwiftUI
import FirebaseCore

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
        FirebaseApp.configure()
        return true
    }
}

@main
struct DriftProApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
    @StateObject private var firebaseManager = FirebaseManager.shared

    var body: some Scene {
        WindowGroup {
            if firebaseManager.isLoading {
                LoadingView()
            } else if firebaseManager.isAuthenticated {
                MainTabView()
                    .environmentObject(firebaseManager)
            } else {
                CompanySelectionView()
                    .environmentObject(firebaseManager)
            }
        }
    }
}
