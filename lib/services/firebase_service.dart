import 'package:firebase_auth/firebase_auth.dart' as auth;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/foundation.dart';
import '../models/user.dart' as app_user;
import '../models/company.dart';
import '../models/deviation.dart';
import '../models/document.dart';
import '../models/chat.dart';

class FirebaseService extends ChangeNotifier {
  static final FirebaseService _instance = FirebaseService._internal();
  factory FirebaseService() => _instance;
  FirebaseService._internal();

  final auth.FirebaseAuth _auth = auth.FirebaseAuth.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  app_user.User? _currentUser;
  Company? _currentCompany;
  bool _isAuthenticated = false;
  bool _isLoading = false;

  // Getters
  app_user.User? get currentUser => _currentUser;
  Company? get currentCompany => _currentCompany;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  // Initialize auth state listener
  void init() {
    _auth.authStateChanges().listen((auth.User? user) {
      if (user != null) {
        _fetchUserData(user.uid);
      } else {
        _currentUser = null;
        _currentCompany = null;
        _isAuthenticated = false;
        notifyListeners();
      }
    });
  }

  // Authentication methods
  Future<void> signIn(String email, String password) async {
    _setLoading(true);
    try {
      await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      _isAuthenticated = true;
      notifyListeners();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> signUp({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String companyId,
    app_user.UserRole role = app_user.UserRole.employee,
  }) async {
    _setLoading(true);
    try {
      final credential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      final user = app_user.User(
        id: credential.user!.uid,
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: role,
        companyId: companyId,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await _db.collection('users').doc(credential.user!.uid).set(user.toFirestore());
      _isAuthenticated = true;
      notifyListeners();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> signOut() async {
    await _auth.signOut();
  }

  Future<void> resetPassword(String email) async {
    await _auth.sendPasswordResetEmail(email: email);
  }

  // User data management
  Future<void> _fetchUserData(String userId) async {
    try {
      final userDoc = await _db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        _currentUser = app_user.User.fromFirestore(userDoc);
        await _fetchCompanyData(_currentUser!.companyId);
        _isAuthenticated = true;
        notifyListeners();
      }
    } catch (e) {
      print('Error fetching user data: $e');
    }
  }

  Future<void> _fetchCompanyData(String companyId) async {
    try {
      final companyDoc = await _db.collection('companies').doc(companyId).get();
      if (companyDoc.exists) {
        _currentCompany = Company.fromFirestore(companyDoc);
      }
    } catch (e) {
      print('Error fetching company data: $e');
    }
  }

  // File management
  Future<String> uploadFile(Uint8List data, String path) async {
    final ref = _storage.ref().child(path);
    final uploadTask = await ref.putData(data);
    return await uploadTask.ref.getDownloadURL();
  }

  Future<void> deleteFile(String path) async {
    final ref = _storage.ref().child(path);
    await ref.delete();
  }

  // Deviation management
  Future<String> createDeviation(Deviation deviation) async {
    try {
      final docRef = await _db.collection('deviations').add(deviation.toFirestore());
      return docRef.id;
    } catch (e) {
      print('Error creating deviation: $e');
      throw e;
    }
  }

  Future<List<Deviation>> getDeviations(String companyId) async {
    try {
      final snapshot = await _db
          .collection('deviations')
          .where('companyId', isEqualTo: companyId)
          .orderBy('reportedAt', descending: true)
          .get();

      return snapshot.docs.map((doc) => Deviation.fromFirestore(doc)).toList();
    } catch (e) {
      print('Error getting deviations: $e');
      return [];
    }
  }

  Future<void> updateDeviation(String id, Deviation deviation) async {
    try {
      await _db.collection('deviations').doc(id).set(deviation.toFirestore(), SetOptions(merge: true));
    } catch (e) {
      print('Error updating deviation: $e');
      throw e;
    }
  }

  Future<void> deleteDeviation(String id) async {
    try {
      await _db.collection('deviations').doc(id).delete();
    } catch (e) {
      print('Error deleting deviation: $e');
      throw e;
    }
  }

  // Document management
  Future<String> createDocument(Document document) async {
    try {
      final docRef = await _db.collection('documents').add(document.toFirestore());
      return docRef.id;
    } catch (e) {
      print('Error creating document: $e');
      throw e;
    }
  }

  Future<List<Document>> getDocuments(String companyId) async {
    try {
      final snapshot = await _db
          .collection('documents')
          .where('companyId', isEqualTo: companyId)
          .where('isActive', isEqualTo: true)
          .orderBy('createdAt', descending: true)
          .get();

      return snapshot.docs.map((doc) => Document.fromFirestore(doc)).toList();
    } catch (e) {
      print('Error getting documents: $e');
      return [];
    }
  }

  // Chat management
  Future<String> createChat(Chat chat) async {
    try {
      final docRef = await _db.collection('chats').add(chat.toFirestore());
      return docRef.id;
    } catch (e) {
      print('Error creating chat: $e');
      throw e;
    }
  }

  Future<void> sendMessage(String chatId, ChatMessage message) async {
    try {
      await _db
          .collection('chats')
          .doc(chatId)
          .collection('messages')
          .add(message.toFirestore());

      // Update chat's last message
      await _db.collection('chats').doc(chatId).update({
        'lastMessage': message.content,
        'lastMessageTime': Timestamp.fromDate(message.timestamp),
        'lastMessageSenderId': message.senderId,
      });
    } catch (e) {
      print('Error sending message: $e');
      throw e;
    }
  }

  Stream<List<ChatMessage>> getMessages(String chatId) {
    return _db
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => ChatMessage.fromFirestore(doc)).toList());
  }

  // Company management
  Future<List<Company>> searchCompanies(String searchText) async {
    try {
      final snapshot = await _db.collection('companies').get();
      final companies = snapshot.docs.map((doc) => Company.fromFirestore(doc)).toList();
      
      if (searchText.isEmpty) return companies;
      
      return companies.where((company) =>
          company.name.toLowerCase().contains(searchText.toLowerCase())).toList();
    } catch (e) {
      print('Error searching companies: $e');
      return [];
    }
  }

  // User management
  Future<List<ChatUser>> getUsers(String companyId) async {
    try {
      final snapshot = await _db
          .collection('users')
          .where('companyId', isEqualTo: companyId)
          .get();

      return snapshot.docs.map((doc) {
        final data = doc.data();
        return ChatUser(
          id: doc.id,
          name: '${data['firstName']} ${data['lastName']}',
        );
      }).toList();
    } catch (e) {
      print('Error getting users: $e');
      return [];
    }
  }
} 