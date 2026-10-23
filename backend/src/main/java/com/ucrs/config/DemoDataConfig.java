package com.ucrs.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Exposes demo-mode config values as a Spring-managed bean for injection across the application.
 */
@Configuration
public class DemoDataConfig {

    @Value("${ucrs.demo.mode:true}")
    private boolean demoMode;

    @Value("${ucrs.admin.username:admin}")
    private String adminUsername;

    @Value("${ucrs.admin.password:admin123}")
    private String adminPassword;

    @Value("${ucrs.admin.name:System Administrator}")
    private String adminName;

    public boolean isDemoMode() {
        return demoMode;
    }

    public String getAdminUsername() {
        return adminUsername;
    }

    public String getAdminPassword() {
        return adminPassword;
    }

    public String getAdminName() {
        return adminName;
    }
}
