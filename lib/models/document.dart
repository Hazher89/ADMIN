import 'package:cloud_firestore/cloud_firestore.dart';

enum DocumentCategory {
  policy,
  procedure,
  form,
  manual,
  contract,
  report,
  other,
}

class Document {
  final String id;
  final String title;
  final String? description;
  final DocumentCategory category;
  final String fileURL;
  final String fileName;
  final int fileSize;
  final String fileType;
  final String version;
  final String uploadedBy;
  final String uploadedByName;
  final String companyId;
  final String? department;
  final List<String> tags;
  final bool isPublic;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int downloadCount;
  final bool isActive;

  Document({
    required this.id,
    required this.title,
    this.description,
    required this.category,
    required this.fileURL,
    required this.fileName,
    required this.fileSize,
    required this.fileType,
    this.version = '1.0',
    required this.uploadedBy,
    required this.uploadedByName,
    required this.companyId,
    this.department,
    this.tags = const [],
    this.isPublic = true,
    required this.createdAt,
    required this.updatedAt,
    this.downloadCount = 0,
    this.isActive = true,
  });

  factory Document.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Document(
      id: doc.id,
      title: data['title'] ?? '',
      description: data['description'],
      category: DocumentCategory.values.firstWhere(
        (e) => e.toString().split('.').last == data['category'],
        orElse: () => DocumentCategory.other,
      ),
      fileURL: data['fileURL'] ?? '',
      fileName: data['fileName'] ?? '',
      fileSize: data['fileSize'] ?? 0,
      fileType: data['fileType'] ?? '',
      version: data['version'] ?? '1.0',
      uploadedBy: data['uploadedBy'] ?? '',
      uploadedByName: data['uploadedByName'] ?? '',
      companyId: data['companyId'] ?? '',
      department: data['department'],
      tags: List<String>.from(data['tags'] ?? []),
      isPublic: data['isPublic'] ?? true,
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      updatedAt: (data['updatedAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      downloadCount: data['downloadCount'] ?? 0,
      isActive: data['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'title': title,
      'description': description,
      'category': category.toString().split('.').last,
      'fileURL': fileURL,
      'fileName': fileName,
      'fileSize': fileSize,
      'fileType': fileType,
      'version': version,
      'uploadedBy': uploadedBy,
      'uploadedByName': uploadedByName,
      'companyId': companyId,
      'department': department,
      'tags': tags,
      'isPublic': isPublic,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
      'downloadCount': downloadCount,
      'isActive': isActive,
    };
  }

  String get fileSizeFormatted {
    if (fileSize < 1024) return '${fileSize}B';
    if (fileSize < 1024 * 1024) return '${(fileSize / 1024).toStringAsFixed(1)}KB';
    if (fileSize < 1024 * 1024 * 1024) return '${(fileSize / (1024 * 1024)).toStringAsFixed(1)}MB';
    return '${(fileSize / (1024 * 1024 * 1024)).toStringAsFixed(1)}GB';
  }

  Document copyWith({
    String? id,
    String? title,
    String? description,
    DocumentCategory? category,
    String? fileURL,
    String? fileName,
    int? fileSize,
    String? fileType,
    String? version,
    String? uploadedBy,
    String? uploadedByName,
    String? companyId,
    String? department,
    List<String>? tags,
    bool? isPublic,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? downloadCount,
    bool? isActive,
  }) {
    return Document(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      category: category ?? this.category,
      fileURL: fileURL ?? this.fileURL,
      fileName: fileName ?? this.fileName,
      fileSize: fileSize ?? this.fileSize,
      fileType: fileType ?? this.fileType,
      version: version ?? this.version,
      uploadedBy: uploadedBy ?? this.uploadedBy,
      uploadedByName: uploadedByName ?? this.uploadedByName,
      companyId: companyId ?? this.companyId,
      department: department ?? this.department,
      tags: tags ?? this.tags,
      isPublic: isPublic ?? this.isPublic,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      downloadCount: downloadCount ?? this.downloadCount,
      isActive: isActive ?? this.isActive,
    );
  }
} 