import 'package:cloud_firestore/cloud_firestore.dart';

enum DeviationStatus {
  open,
  inProgress,
  resolved,
  closed,
}

enum DeviationPriority {
  low,
  medium,
  high,
  critical,
}

enum DeviationType {
  absence,
  lateness,
  incident,
  complaint,
  suggestion,
  other,
}

class Deviation {
  final String id;
  final String title;
  final String description;
  final DeviationType type;
  final DeviationPriority priority;
  final DeviationStatus status;
  final String reportedBy;
  final String reportedByName;
  final String companyId;
  final DateTime reportedAt;
  final DateTime? resolvedAt;
  final String? resolvedBy;
  final String? resolvedByName;
  final String? resolution;
  final List<String> attachments;
  final Map<String, dynamic> metadata;

  Deviation({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    this.priority = DeviationPriority.medium,
    this.status = DeviationStatus.open,
    required this.reportedBy,
    required this.reportedByName,
    required this.companyId,
    required this.reportedAt,
    this.resolvedAt,
    this.resolvedBy,
    this.resolvedByName,
    this.resolution,
    this.attachments = const [],
    this.metadata = const {},
  });

  factory Deviation.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Deviation(
      id: doc.id,
      title: data['title'] ?? '',
      description: data['description'] ?? '',
      type: DeviationType.values.firstWhere(
        (e) => e.toString().split('.').last == data['type'],
        orElse: () => DeviationType.other,
      ),
      priority: DeviationPriority.values.firstWhere(
        (e) => e.toString().split('.').last == data['priority'],
        orElse: () => DeviationPriority.medium,
      ),
      status: DeviationStatus.values.firstWhere(
        (e) => e.toString().split('.').last == data['status'],
        orElse: () => DeviationStatus.open,
      ),
      reportedBy: data['reportedBy'] ?? '',
      reportedByName: data['reportedByName'] ?? '',
      companyId: data['companyId'] ?? '',
      reportedAt: (data['reportedAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      resolvedAt: (data['resolvedAt'] as Timestamp?)?.toDate(),
      resolvedBy: data['resolvedBy'],
      resolvedByName: data['resolvedByName'],
      resolution: data['resolution'],
      attachments: List<String>.from(data['attachments'] ?? []),
      metadata: Map<String, dynamic>.from(data['metadata'] ?? {}),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'title': title,
      'description': description,
      'type': type.toString().split('.').last,
      'priority': priority.toString().split('.').last,
      'status': status.toString().split('.').last,
      'reportedBy': reportedBy,
      'reportedByName': reportedByName,
      'companyId': companyId,
      'reportedAt': Timestamp.fromDate(reportedAt),
      'resolvedAt': resolvedAt != null ? Timestamp.fromDate(resolvedAt!) : null,
      'resolvedBy': resolvedBy,
      'resolvedByName': resolvedByName,
      'resolution': resolution,
      'attachments': attachments,
      'metadata': metadata,
    };
  }

  Deviation copyWith({
    String? id,
    String? title,
    String? description,
    DeviationType? type,
    DeviationPriority? priority,
    DeviationStatus? status,
    String? reportedBy,
    String? reportedByName,
    String? companyId,
    DateTime? reportedAt,
    DateTime? resolvedAt,
    String? resolvedBy,
    String? resolvedByName,
    String? resolution,
    List<String>? attachments,
    Map<String, dynamic>? metadata,
  }) {
    return Deviation(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      type: type ?? this.type,
      priority: priority ?? this.priority,
      status: status ?? this.status,
      reportedBy: reportedBy ?? this.reportedBy,
      reportedByName: reportedByName ?? this.reportedByName,
      companyId: companyId ?? this.companyId,
      reportedAt: reportedAt ?? this.reportedAt,
      resolvedAt: resolvedAt ?? this.resolvedAt,
      resolvedBy: resolvedBy ?? this.resolvedBy,
      resolvedByName: resolvedByName ?? this.resolvedByName,
      resolution: resolution ?? this.resolution,
      attachments: attachments ?? this.attachments,
      metadata: metadata ?? this.metadata,
    );
  }
} 