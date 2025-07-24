import 'package:cloud_firestore/cloud_firestore.dart';

class Company {
  final String id;
  final String name;
  final String? logoURL;
  final String primaryColor;
  final String secondaryColor;
  final String? address;
  final String? phoneNumber;
  final String? email;
  final String? website;
  final String? description;
  final String adminUserId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isActive;

  Company({
    required this.id,
    required this.name,
    this.logoURL,
    this.primaryColor = '#007AFF',
    this.secondaryColor = '#5856D6',
    this.address,
    this.phoneNumber,
    this.email,
    this.website,
    this.description,
    required this.adminUserId,
    required this.createdAt,
    required this.updatedAt,
    this.isActive = true,
  });

  // Convert from Firestore
  factory Company.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Company(
      id: doc.id,
      name: data['name'] ?? '',
      logoURL: data['logoURL'],
      primaryColor: data['primaryColor'] ?? '#007AFF',
      secondaryColor: data['secondaryColor'] ?? '#5856D6',
      address: data['address'],
      phoneNumber: data['phoneNumber'],
      email: data['email'],
      website: data['website'],
      description: data['description'],
      adminUserId: data['adminUserId'] ?? '',
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      updatedAt: (data['updatedAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      isActive: data['isActive'] ?? true,
    );
  }

  // Convert to Firestore
  Map<String, dynamic> toFirestore() {
    return {
      'name': name,
      'logoURL': logoURL,
      'primaryColor': primaryColor,
      'secondaryColor': secondaryColor,
      'address': address,
      'phoneNumber': phoneNumber,
      'email': email,
      'website': website,
      'description': description,
      'adminUserId': adminUserId,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
      'isActive': isActive,
    };
  }

  Company copyWith({
    String? id,
    String? name,
    String? logoURL,
    String? primaryColor,
    String? secondaryColor,
    String? address,
    String? phoneNumber,
    String? email,
    String? website,
    String? description,
    String? adminUserId,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isActive,
  }) {
    return Company(
      id: id ?? this.id,
      name: name ?? this.name,
      logoURL: logoURL ?? this.logoURL,
      primaryColor: primaryColor ?? this.primaryColor,
      secondaryColor: secondaryColor ?? this.secondaryColor,
      address: address ?? this.address,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      email: email ?? this.email,
      website: website ?? this.website,
      description: description ?? this.description,
      adminUserId: adminUserId ?? this.adminUserId,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isActive: isActive ?? this.isActive,
    );
  }
} 