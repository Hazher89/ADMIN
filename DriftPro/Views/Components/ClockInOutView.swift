import SwiftUI
import Firebase

struct ClockInOutView: View {
    @State private var isClockedIn = false
    @State private var clockInTime: Date? = nil
    @State private var clockHistory: [ClockEvent] = []
    @State private var loading = true
    @State private var showAlert = false
    @State private var alertMsg = ""
    let userId: String = "user1"
    var body: some View {
        ZStack {
            LinearGradient(gradient: Gradient(colors: [Color.green.opacity(0.3), Color.blue.opacity(0.3)]), startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()
            VStack(spacing: 32) {
                HStack {
                    Text("Stemple inn/ut")
                        .font(.largeTitle).fontWeight(.bold)
                        .foregroundColor(.white)
                    Spacer()
                }.padding(.horizontal)
                // Stemple inn/ut knapp
                VStack(spacing: 16) {
                    if isClockedIn, let inTime = clockInTime {
                        Text("Stempler inn: \(inTime, formatter: timeFormatter)")
                            .font(.headline).foregroundColor(.white)
                        Button(action: clockOut) {
                            Text("Stemple ut")
                                .font(.title2).fontWeight(.bold)
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(Color.red.opacity(0.8))
                                .foregroundColor(.white)
                                .cornerRadius(16)
                        }
                    } else {
                        Button(action: clockIn) {
                            Text("Stemple inn")
                                .font(.title2).fontWeight(.bold)
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(Color.green.opacity(0.8))
                                .foregroundColor(.white)
                                .cornerRadius(16)
                        }
                    }
                }
                .padding().background(BlurView(style: .systemMaterial)).cornerRadius(20)
                // Historikk
                Text("Historikk")
                    .font(.headline).foregroundColor(.white)
                if loading {
                    ProgressView("Laster historikk...")
                } else if clockHistory.isEmpty {
                    Text("Ingen stemplinger funnet.").foregroundColor(.white)
                } else {
                    ScrollView {
                        VStack(spacing: 12) {
                            ForEach(clockHistory) { event in
                                ClockEventCard(event: event)
                            }
                        }.padding()
                    }
                }
                Spacer()
            }
        }
        .onAppear(perform: fetchHistory)
        .alert(isPresented: $showAlert) {
            Alert(title: Text("Stempling registrert"), message: Text(alertMsg), dismissButton: .default(Text("OK")))
        }
    }
    func clockIn() {
        let now = Date()
        isClockedIn = true
        clockInTime = now
        let db = Firestore.firestore()
        db.collection("clockings").addDocument(data: [
            "userId": userId,
            "type": "inn",
            "time": Timestamp(date: now)
        ]) { err in
            if err == nil {
                alertMsg = "Du er stemplet inn!"
                showAlert = true
                fetchHistory()
            }
        }
    }
    func clockOut() {
        let now = Date()
        isClockedIn = false
        let db = Firestore.firestore()
        db.collection("clockings").addDocument(data: [
            "userId": userId,
            "type": "ut",
            "time": Timestamp(date: now)
        ]) { err in
            if err == nil {
                alertMsg = "Du er stemplet ut!"
                showAlert = true
                fetchHistory()
            }
        }
        clockInTime = nil
    }
    func fetchHistory() {
        loading = true
        let db = Firestore.firestore()
        db.collection("clockings").whereField("userId", isEqualTo: userId).order(by: "time", descending: true).getDocuments { snap, err in
            loading = false
            if let docs = snap?.documents {
                self.clockHistory = docs.map { doc in
                    let d = doc.data()
                    return ClockEvent(id: doc.documentID,
                                      type: d["type"] as? String ?? "",
                                      time: (d["time"] as? Timestamp)?.dateValue() ?? Date())
                }
            }
        }
    }
}

struct ClockEventCard: View {
    let event: ClockEvent
    var body: some View {
        HStack {
            Text(event.type == "inn" ? "Inn" : "Ut").font(.headline)
            Spacer()
            Text("\(event.time, formatter: dateTimeFormatter)")
        }
        .padding()
        .background(BlurView(style: .systemMaterialDark))
        .cornerRadius(16)
        .shadow(radius: 6)
    }
}

struct ClockEvent: Identifiable {
    var id: String
    var type: String
    var time: Date
}

private let timeFormatter: DateFormatter = {
    let df = DateFormatter()
    df.timeStyle = .short
    return df
}()

private let dateTimeFormatter: DateFormatter = {
    let df = DateFormatter()
    df.dateStyle = .medium
    df.timeStyle = .short
    return df
}() 