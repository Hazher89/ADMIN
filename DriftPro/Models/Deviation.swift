import Foundation
import FirebaseFirestore

enum DeviationCategory: String, CaseIterable, Codable {
    case safety = "safety"
    case quality = "quality"
    case environment = "environment"
    case equipment = "equipment"
    case process = "process"
    case other = "other"
    
    var displayName: String {
        switch self {
        case .safety: return "Sikkerhet"
        case .quality: return "Kvalitet"
        case .environment: return "Miljø"
        case .equipment: return "Utstyr"
        case .process: return "Prosess"
        case .other: return "Annet"
        }
    }
    
    var icon: String {
        switch self {
        case .safety: return "shield.fill"
        case .quality: return "checkmark.circle.fill"
        case .environment: return "leaf.fill"
        case .equipment: return "wrench.and.screwdriver.fill"
        case .process: return "gear"
        case .other: return "exclamationmark.triangle.fill"
        }
    }
}

enum DeviationSeverity: String, CaseIterable, Codable {
    case low = "low"
    case medium = "medium"
    case high = "high"
    case critical = "critical"
    
    var displayName: String {
        switch self {
        case .low: return "Lav"
        case .medium: return "Medium"
        case .high: return "Høy"
        case .critical: return "Kritisk"
        }
    }
    
    var color: String {
        switch self {
        case .low: return "#34C759"
        case .medium: return "#FF9500"
        case .high: return "#FF3B30"
        case .critical: return "#8E44AD"
        }
    }
}

enum DeviationStatus: String, CaseIterable, Codable {
    case reported = "reported"
    case underReview = "underReview"
    case inProgress = "inProgress"
    case resolved = "resolved"
    case closed = "closed"
    
    var displayName: String {
        switch self {
        case .reported: return "Rapportert"
        case .underReview: return "Under vurdering"
        case .inProgress: return "Under arbeid"
        case .resolved: return "Løst"
        case .closed: return "Lukket"
        }
    }
}

struct Deviation: Identifiable, Codable {
    var id: String?
    var title: String
    var description: String
    var category: DeviationCategory
    var severity: DeviationSeverity
    var status: DeviationStatus
    var reportedBy: String
    var assignedTo: String?
    var companyId: String
    var location: String?
    var mediaURLs: [String]
    var createdAt: Date
    var updatedAt: Date
    var resolvedAt: Date?
    var comments: [DeviationComment]
    var tags: [String]
    
    init(title: String, description: String, category: DeviationCategory, severity: DeviationSeverity, reportedBy: String, companyId: String, location: String? = nil, mediaURLs: [String] = [], tags: [String] = []) {
        self.title = title
        self.description = description
        self.category = category
        self.severity = severity
        self.status = .reported
        self.reportedBy = reportedBy
        self.assignedTo = nil
        self.companyId = companyId
        self.location = location
        self.mediaURLs = mediaURLs
        self.createdAt = Date()
        self.updatedAt = Date()
        self.resolvedAt = nil
        self.comments = []
        self.tags = tags
    }
}

struct DeviationComment: Identifiable, Codable {
    let id: String
    let text: String
    let authorId: String
    let authorName: String
    let createdAt: Date
    let mediaURLs: [String]
    
    init(text: String, authorId: String, authorName: String, mediaURLs: [String] = []) {
        self.id = UUID().uuidString
        self.text = text
        self.authorId = authorId
        self.authorName = authorName
        self.createdAt = Date()
        self.mediaURLs = mediaURLs
    }
} 