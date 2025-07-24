import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class DeviationListScreen extends StatelessWidget {
  const DeviationListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppTheme.mainGradient),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Avvik',
                  style: AppTheme.headlineLarge.copyWith(
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 24),
                Expanded(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.warning_amber_outlined,
                          size: 80,
                          color: Colors.white.withOpacity(0.6),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Ingen avvik registrert',
                          style: AppTheme.headlineMedium.copyWith(
                            color: Colors.white.withOpacity(0.8),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Rapporter et avvik for å komme i gang',
                          style: AppTheme.bodyLarge.copyWith(
                            color: Colors.white.withOpacity(0.6),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Add new deviation functionality
        },
        backgroundColor: Colors.white,
        foregroundColor: AppTheme.error,
        child: const Icon(Icons.add),
      ),
    );
  }
} 