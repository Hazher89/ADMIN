import Foundation
import FirebaseFirestore

enum DocumentCategory: String, CaseIterable, Codable {
    case procedures = "procedures"
    case hms = "hms"
    case protocols = "protocols"
    case policies = "policies"
    case forms = "forms"
    case reports = "reports"
    case other = "other"
    
    var displayName: String {
        switch self {
        case .procedures: return "Rutiner"
        case .hms: return "HMS"
        case .protocols: return "Protokoller"
        case .policies: return "Retningslinjer"
        case .forms: return "Skjemaer"
        case .reports: return "Rapporter"
        case .other: return "Annet"
        }
    }
    
    var icon: String {
        switch self {
        case .procedures: return "doc.text.fill"
        case .hms: return "heart.fill"
        case .protocols: return "list.clipboard.fill"
        case .policies: return "building.2.fill"
        case .forms: return "doc.on.doc.fill"
        case .reports: return "chart.bar.fill"
        case .other: return "folder.fill"
        }
    }
}

struct Document: Identifiable, Codable {
    var id: String
    let title: String
    let description: String?
    let category: DocumentCategory
    let fileURL: String
    let fileName: String
    let fileSize: Int64
    let fileType: String
    let version: String
    let uploadedBy: String
    let uploadedByName: String
    let companyId: String
    let department: String?
    let tags: [String]
    let isPublic: Bool
    let createdAt: Date
    let updatedAt: Date
    let downloadCount: Int
    let isActive: Bool
    
    init(id: String = UUID().uuidString, title: String, description: String? = nil, category: DocumentCategory, fileURL: String, fileName: String, fileSize: Int64, fileType: String, uploadedBy: String, uploadedByName: String, companyId: String, department: String? = nil, tags: [String] = [], isPublic: Bool = true) {
        self.id = id
        self.title = title
        self.description = description
        self.category = category
        self.fileURL = fileURL
        self.fileName = fileName
        self.fileSize = fileSize
        self.fileType = fileType
        self.version = "1.0"
        self.uploadedBy = uploadedBy
        self.uploadedByName = uploadedByName
        self.companyId = companyId
        self.department = department
        self.tags = tags
        self.isPublic = isPublic
        self.createdAt = Date()
        self.updatedAt = Date()
        self.downloadCount = 0
        self.isActive = true
    }
} 