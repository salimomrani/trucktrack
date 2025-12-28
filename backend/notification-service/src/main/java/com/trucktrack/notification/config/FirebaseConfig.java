package com.trucktrack.notification.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.credentials-path:}")
    private String credentialsPath;

    @Value("${firebase.enabled:false}")
    private boolean enabled;

    @PostConstruct
    public void initialize() {
        if (!enabled) {
            log.info("Firebase is disabled");
            return;
        }

        try {
            if (FirebaseApp.getApps().isEmpty()) {
                InputStream serviceAccount = getCredentialsInputStream();

                if (serviceAccount != null) {
                    FirebaseOptions options = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                            .build();

                    FirebaseApp.initializeApp(options);
                    log.info("Firebase initialized successfully");
                } else {
                    log.warn("Firebase credentials not found, push notifications will be disabled");
                }
            }
        } catch (IOException e) {
            log.error("Failed to initialize Firebase: {}", e.getMessage());
        }
    }

    private InputStream getCredentialsInputStream() throws IOException {
        if (credentialsPath != null && !credentialsPath.isEmpty()) {
            if (credentialsPath.startsWith("classpath:")) {
                String path = credentialsPath.substring("classpath:".length());
                return new ClassPathResource(path).getInputStream();
            } else {
                return new FileInputStream(credentialsPath);
            }
        }
        return null;
    }

    @Bean
    public FirebaseMessaging firebaseMessaging() {
        if (!enabled || FirebaseApp.getApps().isEmpty()) {
            return null;
        }
        return FirebaseMessaging.getInstance();
    }
}
