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
    @State private var selectedCompany: Company? = nil

    var body: some Scene {
        WindowGroup {
            Group {
                if firebaseManager.isLoading {
                    LoadingView()
                } else if !firebaseManager.isAuthenticated {
                    if let company = selectedCompany {
                        LoginView(company: company)
                            .environmentObject(firebaseManager)
                            .onDisappear { selectedCompany = nil }
                    } else {
                        CompanySelectionView(onCompanySelected: { company in
                            selectedCompany = company
                        })
                        .environmentObject(firebaseManager)
                    }
                } else {
                    MainTabView()
                        .environmentObject(firebaseManager)
                }
            }
        }
    }
}
