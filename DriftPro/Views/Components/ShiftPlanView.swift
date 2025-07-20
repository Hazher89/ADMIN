import SwiftUI
// For Firestore-integrasjon
import Firebase

struct ShiftPlanView: View {
    @State private var shifts: [Shift] = []
    @State private var loading = true
    @State private var showRespondModal = false
    @State private var selectedShift: Shift? = nil
    @State private var responseComment = ""
    @State private var showAlert = false
    @State private var alertMsg = ""
    var body: some View {
        ZStack {
            LinearGradient(gradient: Gradient(colors: [Color.blue.opacity(0.3), Color.purple.opacity(0.3)]), startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()
            VStack(spacing: 24) {
                HStack {
                    Text("Skiftplan")
                        .font(.largeTitle).fontWeight(.bold)
                        .foregroundColor(.white)
                    Spacer()
                }.padding(.horizontal)
                if loading {
                    ProgressView("Laster skift...")
                } else if shifts.isEmpty {
                    Text("Ingen skift funnet.").foregroundColor(.white)
                } else {
                    ScrollView {
                        VStack(spacing: 16) {
                            ForEach(shifts, id: \.id) { shift in
                                ShiftCard(shift: shift, onRespond: { selected in
                                    selectedShift = selected
                                    showRespondModal = true
                                })
                            }
                        }.padding()
                    }
                }
                Spacer()
            }
            // Modal for aksepter/avslå
            if showRespondModal, let shift = selectedShift {
                VStack(spacing: 16) {
                    Text("Vil du akseptere dette skiftet?").font(.headline)
                    Text("\(shift.type) - \(shift.time) - \(shift.date)").font(.subheadline)
                    TextField("Kommentar (valgfritt)", text: $responseComment)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .padding(.horizontal)
                    HStack(spacing: 24) {
                        Button("Avslå") {
                            respondToShift(shift: shift, accepted: false)
                        }.foregroundColor(.red)
                        Button("Aksepter") {
                            respondToShift(shift: shift, accepted: true)
                        }.foregroundColor(.green)
                    }
                }
                .padding().background(BlurView(style: .systemMaterial)).cornerRadius(20)
                .shadow(radius: 10)
            }
        }
        .onAppear(perform: fetchShifts)
        .alert(isPresented: $showAlert) {
            Alert(title: Text("Svar sendt"), message: Text(alertMsg), dismissButton: .default(Text("OK")))
        }
    }
    func fetchShifts() {
        loading = true
        let db = Firestore.firestore()
        // Endre til å bruke en mock eller hardkodet bruker-id, eller hent fra auth
        let userId = "user1" // TODO: Hent fra auth eller context
        db.collection("shifts").whereField("employeeId", isEqualTo: userId).order(by: "date", descending: false)
            .addSnapshotListener { snap, err in
                loading = false
                if let docs = snap?.documents {
                    self.shifts = docs.map { doc in
                        let d = doc.data()
                        return Shift(id: doc.documentID,
                                     type: d["type"] as? String ?? "",
                                     time: d["time"] as? String ?? "",
                                     date: d["date"] as? String ?? "",
                                     resource: d["resource"] as? String ?? "",
                                     comment: d["comment"] as? String ?? "",
                                     status: d["status"] as? String ?? "ny",
                                     accepted: d["accepted"] as? Bool ?? false)
                    }
                }
            }
    }
    func respondToShift(shift: Shift, accepted: Bool) {
        let db = Firestore.firestore()
        db.collection("shifts").document(shift.id).updateData([
            "accepted": accepted,
            "status": accepted ? "akseptert" : "avslått",
            "responseComment": responseComment
        ]) { err in
            if err == nil {
                alertMsg = accepted ? "Skiftet er akseptert!" : "Skiftet er avslått."
                showAlert = true
                showRespondModal = false
                fetchShifts()
            }
        }
    }
}

struct ShiftCard: View {
    let shift: Shift
    var onRespond: (Shift) -> Void
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(shift.type).font(.headline)
                Spacer()
                if shift.status == "ny" {
                    Text("NY").foregroundColor(.yellow).font(.caption).bold()
                } else if shift.status == "akseptert" {
                    Text("Akseptert").foregroundColor(.green).font(.caption).bold()
                } else if shift.status == "avslått" {
                    Text("Avslått").foregroundColor(.red).font(.caption).bold()
                }
            }
            Text("Tid: \(shift.time)")
            Text("Dato: \(shift.date)")
            if !shift.resource.isEmpty {
                Text("Ressurs: \(shift.resource)").font(.caption).foregroundColor(.blue)
            }
            if !shift.comment.isEmpty {
                Text("Kommentar: \(shift.comment)").font(.caption).foregroundColor(.gray)
            }
            if shift.status == "ny" {
                Button("Aksepter/Avslå") {
                    onRespond(shift)
                }
                .padding(.top, 8)
                .buttonStyle(.borderedProminent)
            }
        }
        .padding()
        .background(BlurView(style: .systemMaterialDark))
        .cornerRadius(16)
        .shadow(radius: 6)
    }
} 