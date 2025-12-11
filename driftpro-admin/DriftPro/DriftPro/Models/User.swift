import Foundation
import FirebaseFirestore

enum UserRole: String, CaseIterable, Codable {
    case employee = "employee"
    case admin = "admin"
    case superAdmin = "superAdmin"
    
    var displayName: String {
        switch self {
        case .employee: return "Ansatt"
        case .admin: return "Administrator"
        case .superAdmin: return "Super Administrator"
        }
    }
}

struct User: Identifiable, Codable {
    var id: String?
    let email: String
    let firstName: String
    let lastName: String
    let role: UserRole
    let companyId: String
    let department: String?
    let phoneNumber: String?
    let profileImageURL: String?
    let isActive: Bool
    let createdAt: Date
    let lastLoginAt: Date?
    let birthday: Date?
    let employeeId: String?
    
    var fullName: String {
        "\(firstName) \(lastName)"
    }
    
    var initials: String {
        let firstInitial = firstName.prefix(1).uppercased()
        let lastInitial = lastName.prefix(1).uppercased()
        return "\(firstInitial)\(lastInitial)"
    }
    
    init(email: String, firstName: String, lastName: String, role: UserRole, companyId: String, department: String? = nil, phoneNumber: String? = nil, profileImageURL: String? = nil, birthday: Date? = nil, employeeId: String? = nil) {
        self.email = email
        self.firstName = firstName
        self.lastName = lastName
        self.role = role
        self.companyId = companyId
        self.department = department
        self.phoneNumber = phoneNumber
        self.profileImageURL = profileImageURL
        self.isActive = true
        self.createdAt = Date()
        self.lastLoginAt = nil
        self.birthday = birthday
        self.employeeId = employeeId
    }
} 