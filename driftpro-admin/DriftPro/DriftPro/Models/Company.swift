import Foundation

struct Company: Identifiable, Codable {
    var id: String?
    let name: String
    let logoURL: String?
    let primaryColor: String
    let secondaryColor: String
    let address: String?
    let phoneNumber: String?
    let email: String?
    let website: String?
    let description: String?
    let isActive: Bool
    let createdAt: Date
    let adminUserId: String
    let settings: CompanySettings
    
    init(id: String? = nil, name: String, logoURL: String? = nil, primaryColor: String = "#007AFF", secondaryColor: String = "#5856D6", address: String? = nil, phoneNumber: String? = nil, email: String? = nil, website: String? = nil, description: String? = nil, adminUserId: String) {
        self.id = id
        self.name = name
        self.logoURL = logoURL
        self.primaryColor = primaryColor
        self.secondaryColor = secondaryColor
        self.address = address
        self.phoneNumber = phoneNumber
        self.email = email
        self.website = website
        self.description = description
        self.isActive = true
        self.createdAt = Date()
        self.adminUserId = adminUserId
        self.settings = CompanySettings()
    }
}

struct CompanySettings: Codable {
    let enableDeviationReporting: Bool
    let enableRiskAnalysis: Bool
    let enableDocumentArchive: Bool
    let enableInternalControl: Bool
    let enableChat: Bool
    let enableBirthdayCalendar: Bool
    let maxFileSizeMB: Int
    let allowedFileTypes: [String]
    
    init() {
        self.enableDeviationReporting = true
        self.enableRiskAnalysis = true
        self.enableDocumentArchive = true
        self.enableInternalControl = true
        self.enableChat = true
        self.enableBirthdayCalendar = true
        self.maxFileSizeMB = 50
        self.allowedFileTypes = ["jpg", "jpeg", "png", "pdf", "doc", "docx", "mp4", "mov"]
    }
} 