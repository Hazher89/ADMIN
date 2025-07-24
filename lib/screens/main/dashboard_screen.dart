import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/firebase_service.dart';
import '../../theme/app_theme.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppTheme.mainGradient),
        child: SafeArea(
          child: Consumer<FirebaseService>(
            builder: (context, firebaseService, _) {
              final user = firebaseService.currentUser;
              final company = firebaseService.currentCompany;

              return Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header
                    Row(
                      children: [
                        Container(
                          width: 60,
                          height: 60,
                          decoration: const BoxDecoration(
                            gradient: AppTheme.accentGradient,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.person,
                            color: Colors.white,
                            size: 30,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Hei, ${user?.firstName ?? 'Bruker'}!',
                                style: AppTheme.headlineMedium.copyWith(
                                  color: Colors.white,
                                ),
                              ),
                              Text(
                                company?.name ?? 'DriftPro',
                                style: AppTheme.bodyLarge.copyWith(
                                  color: Colors.white.withOpacity(0.8),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),

                    // Quick Actions
                    Text(
                      'Hurtighandlinger',
                      style: AppTheme.headlineSmall.copyWith(
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 16),

                    Expanded(
                      child: GridView.count(
                        crossAxisCount: 2,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                        children: [
                          _QuickActionCard(
                            icon: Icons.chat,
                            title: 'Ny samtale',
                            subtitle: 'Start chat',
                            onTap: () {
                              // Navigate to chat
                            },
                          ),
                          _QuickActionCard(
                            icon: Icons.warning,
                            title: 'Rapporter avvik',
                            subtitle: 'Ny rapport',
                            onTap: () {
                              // Navigate to deviation form
                            },
                          ),
                          _QuickActionCard(
                            icon: Icons.folder,
                            title: 'Dokumenter',
                            subtitle: 'Se arkiv',
                            onTap: () {
                              // Navigate to documents
                            },
                          ),
                          _QuickActionCard(
                            icon: Icons.schedule,
                            title: 'Vaktplan',
                            subtitle: 'Se plan',
                            onTap: () {
                              // Navigate to schedule
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: AppTheme.glassDecoration,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 40,
              color: Colors.white,
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: AppTheme.bodyLarge.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: AppTheme.bodySmall.copyWith(
                color: Colors.white.withOpacity(0.7),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
} 