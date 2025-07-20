import SwiftUI
import Firebase

struct AbsenceView: View {
    @State private var absenceType = "Ferie"
    @State private var fromDate = Date()
    @State private var toDate = Date()
    @State private var comment = ""
    @State private var submitting = false
    @State private var showAlert = false
    @State private var alertMsg = ""
    @State private var absences: [Absence] = []
    @State private var loading = true
    @State private var saldo = 25 // Mock feriesaldo
    let userId: String = "user1"
    let absenceTypes = ["Ferie", "Sykdom", "Permisjon", "Barns sykdom", "Annet"]
    var body: some View {
        ZStack {
            LinearGradient(gradient: Gradient(colors: [Color.orange.opacity(0.3), Color.purple.opacity(0.3)]), startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()
            VStack(spacing: 24) {
                HStack {
                    Text("Fravær/Ferie")
                        .font(.largeTitle).fontWeight(.bold)
                        .foregroundColor(.white)
                    Spacer()
                    Text("Saldo: \(saldo) dager")
                        .font(.headline).foregroundColor(.white)
                }.padding(.horizontal)
                // Søknadsskjema
                VStack(spacing: 12) {
                    Picker("Type", selection: $absenceType) {
                        ForEach(absenceTypes, id: \ .self) { t in Text(t) }
                    }.pickerStyle(.segmented)
                    HStack {
                        DatePicker("Fra", selection: $fromDate, displayedComponents: .date)
                        DatePicker("Til", selection: $toDate, displayedComponents: .date)
                    }
                    TextField("Kommentar (valgfritt)", text: $comment)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    Button(action: submitAbsence) {
                        if submitting { ProgressView() } else { Text("Søk om \(absenceType)") }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(submitting)
                }
                .padding().background(BlurView(style: .systemMaterial)).cornerRadius(20)
                // Liste over søknader
                if loading {
                    ProgressView("Laster søknader...")
                } else if absences.isEmpty {
                    Text("Ingen søknader funnet.").foregroundColor(.white)
                } else {
                    ScrollView {
                        VStack(spacing: 12) {
                            ForEach(absences) { a in
                                AbsenceCard(absence: a)
                            }
                        }.padding()
                    }
                }
                Spacer()
            }
        }
        .onAppear(perform: fetchAbsences)
        .alert(isPresented: $showAlert) {
            Alert(title: Text("Søknad sendt"), message: Text(alertMsg), dismissButton: .default(Text("OK")))
        }
    }
    func submitAbsence() {
        submitting = true
        let db = Firestore.firestore()
        db.collection("absences").addDocument(data: [
            "userId": userId,
            "type": absenceType,
            "from": Timestamp(date: fromDate),
            "to": Timestamp(date: toDate),
            "comment": comment,
            "status": "under behandling",
            "createdAt": Date()
        ]) { err in
            submitting = false
            if err == nil {
                alertMsg = "Søknaden er sendt!"
                showAlert = true
                fetchAbsences()
            }
        }
    }
    func fetchAbsences() {
        loading = true
        let db = Firestore.firestore()
        db.collection("absences").whereField("userId", isEqualTo: userId).order(by: "from", descending: true)
            .addSnapshotListener { snap, err in
                loading = false
                if let docs = snap?.documents {
                    self.absences = docs.map { doc in
                        let d = doc.data()
                        return Absence(id: doc.documentID,
                                       type: d["type"] as? String ?? "",
                                       from: (d["from"] as? Timestamp)?.dateValue() ?? Date(),
                                       to: (d["to"] as? Timestamp)?.dateValue() ?? Date(),
                                       comment: d["comment"] as? String ?? "",
                                       status: d["status"] as? String ?? "under behandling")
                    }
                }
            }
    }
}

struct AbsenceCard: View {
    let absence: Absence
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(absence.type).font(.headline)
                Spacer()
                if absence.status == "under behandling" {
                    Text("Under behandling").foregroundColor(.yellow).font(.caption).bold()
                } else if absence.status == "godkjent" {
                    Text("Godkjent").foregroundColor(.green).font(.caption).bold()
                } else if absence.status == "avvist" {
                    Text("Avvist").foregroundColor(.red).font(.caption).bold()
                }
            }
            Text("Fra: \(absence.from, formatter: dateFormatter)")
            Text("Til: \(absence.to, formatter: dateFormatter)")
            if !absence.comment.isEmpty {
                Text("Kommentar: \(absence.comment)").font(.caption).foregroundColor(.gray)
            }
        }
        .padding()
        .background(BlurView(style: .systemMaterialDark))
        .cornerRadius(16)
        .shadow(radius: 6)
    }
}

struct Absence: Identifiable {
    var id: String
    var type: String
    var from: Date
    var to: Date
    var comment: String
    var status: String
}

private let dateFormatter: DateFormatter = {
    let df = DateFormatter()
    df.dateStyle = .medium
    return df
}() 