package com.driftpro.app;

import android.os.Bundle;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Create a simple TextView programmatically
        TextView textView = new TextView(this);
        textView.setText("🎉 NATIVE ANDROID DRIFTPRO VIRKER! 🎉\n\n" +
                        "📱 Dette er en ekte native Android-app\n" +
                        "🚫 IKKE WebView eller Next.js\n" +
                        "✅ Native Android UI-komponenter\n\n" +
                        "👥 Brukere: 128\n" +
                        "⚠️ Avvik: 14\n" +
                        "📄 Dokumenter: 37\n" +
                        "📅 Skift: 9");
        
        textView.setTextSize(20);
        textView.setPadding(50, 100, 50, 50);
        textView.setTextAlignment(android.view.View.TEXT_ALIGNMENT_CENTER);
        
        setContentView(textView);
    }
} 