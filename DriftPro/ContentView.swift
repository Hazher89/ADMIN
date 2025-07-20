//
//  ContentView.swift
//  DriftPro
//
//  Created by Hazher  on 11/07/2025.
//

import SwiftUI

// This file is no longer used as the main entry point
// The app now uses DriftProApp.swift with proper navigation flow
struct ContentView: View {
    @State private var selectedDestination: AppDestination? = nil
    var body: some View {
        NavigationStack {
            DashboardView(onNavigate: { destination in
                selectedDestination = destination
            })
            .navigationDestination(item: $selectedDestination) { destination in
                switch destination {
                case .shiftplan:
                    ShiftPlanView()
                case .absence:
                    AbsenceView()
                case .clock:
                    ClockInOutView()
                case .chat:
                    ChatView()
                case .settings:
                    ProfileView()
                }
            }
        }
    }
}

enum AppDestination: Hashable {
    case shiftplan, absence, clock, chat, settings
}

#Preview {
    ContentView()
}
