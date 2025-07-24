import 'package:cloud_firestore/cloud_firestore.dart';

enum MessageType {
  text,
  image,
  file,
  audio,
  video,
}

class ChatMessage {
  final String id;
  final String senderId;
  final String senderName;
  final String content;
  final MessageType type;
  final DateTime timestamp;
  final String? fileURL;
  final String? fileName;
  final int? fileSize;
  final List<String> readBy;
  final String? replyToId;
  final bool isEdited;
  final DateTime? editedAt;

  ChatMessage({
    required this.id,
    required this.senderId,
    required this.senderName,
    required this.content,
    this.type = MessageType.text,
    required this.timestamp,
    this.fileURL,
    this.fileName,
    this.fileSize,
    this.readBy = const [],
    this.replyToId,
    this.isEdited = false,
    this.editedAt,
  });

  factory ChatMessage.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return ChatMessage(
      id: doc.id,
      senderId: data['senderId'] ?? '',
      senderName: data['senderName'] ?? '',
      content: data['content'] ?? '',
      type: MessageType.values.firstWhere(
        (e) => e.toString().split('.').last == data['type'],
        orElse: () => MessageType.text,
      ),
      timestamp: (data['timestamp'] as Timestamp?)?.toDate() ?? DateTime.now(),
      fileURL: data['fileURL'],
      fileName: data['fileName'],
      fileSize: data['fileSize'],
      readBy: List<String>.from(data['readBy'] ?? []),
      replyToId: data['replyToId'],
      isEdited: data['isEdited'] ?? false,
      editedAt: (data['editedAt'] as Timestamp?)?.toDate(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'senderId': senderId,
      'senderName': senderName,
      'content': content,
      'type': type.toString().split('.').last,
      'timestamp': Timestamp.fromDate(timestamp),
      'fileURL': fileURL,
      'fileName': fileName,
      'fileSize': fileSize,
      'readBy': readBy,
      'replyToId': replyToId,
      'isEdited': isEdited,
      'editedAt': editedAt != null ? Timestamp.fromDate(editedAt!) : null,
    };
  }

  ChatMessage copyWith({
    String? id,
    String? senderId,
    String? senderName,
    String? content,
    MessageType? type,
    DateTime? timestamp,
    String? fileURL,
    String? fileName,
    int? fileSize,
    List<String>? readBy,
    String? replyToId,
    bool? isEdited,
    DateTime? editedAt,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      senderId: senderId ?? this.senderId,
      senderName: senderName ?? this.senderName,
      content: content ?? this.content,
      type: type ?? this.type,
      timestamp: timestamp ?? this.timestamp,
      fileURL: fileURL ?? this.fileURL,
      fileName: fileName ?? this.fileName,
      fileSize: fileSize ?? this.fileSize,
      readBy: readBy ?? this.readBy,
      replyToId: replyToId ?? this.replyToId,
      isEdited: isEdited ?? this.isEdited,
      editedAt: editedAt ?? this.editedAt,
    );
  }
}

class ChatUser {
  final String id;
  final String name;

  ChatUser({
    required this.id,
    required this.name,
  });

  factory ChatUser.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return ChatUser(
      id: doc.id,
      name: data['name'] ?? '',
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'name': name,
    };
  }
}

class Chat {
  final String id;
  final String name;
  final List<String> participants;
  final String? lastMessage;
  final DateTime? lastMessageTime;
  final String? lastMessageSenderId;
  final bool isGroup;
  final String? groupImageURL;
  final String? description;
  final DateTime createdAt;
  final Map<String, int> unreadCounts;

  Chat({
    required this.id,
    required this.name,
    required this.participants,
    this.lastMessage,
    this.lastMessageTime,
    this.lastMessageSenderId,
    this.isGroup = false,
    this.groupImageURL,
    this.description,
    required this.createdAt,
    this.unreadCounts = const {},
  });

  factory Chat.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Chat(
      id: doc.id,
      name: data['name'] ?? '',
      participants: List<String>.from(data['participants'] ?? []),
      lastMessage: data['lastMessage'],
      lastMessageTime: (data['lastMessageTime'] as Timestamp?)?.toDate(),
      lastMessageSenderId: data['lastMessageSenderId'],
      isGroup: data['isGroup'] ?? false,
      groupImageURL: data['groupImageURL'],
      description: data['description'],
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      unreadCounts: Map<String, int>.from(data['unreadCounts'] ?? {}),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'name': name,
      'participants': participants,
      'lastMessage': lastMessage,
      'lastMessageTime': lastMessageTime != null ? Timestamp.fromDate(lastMessageTime!) : null,
      'lastMessageSenderId': lastMessageSenderId,
      'isGroup': isGroup,
      'groupImageURL': groupImageURL,
      'description': description,
      'createdAt': Timestamp.fromDate(createdAt),
      'unreadCounts': unreadCounts,
    };
  }
} 