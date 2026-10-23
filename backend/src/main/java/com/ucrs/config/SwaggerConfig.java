package com.ucrs.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Value("${ucrs.demo.mode:true}")
    private boolean demoMode;

    @Bean
    public OpenAPI ucrsOpenAPI() {
        String description = "University Course Registration System REST API" +
                (demoMode ? " — Running in DEMO MODE with in-memory H2 database. " +
                        "No Oracle setup required. H2 console available at /h2-console." : "");

        return new OpenAPI()
                .info(new Info()
                        .title("UCRS API")
                        .version("1.0")
                        .description(description)
                        .contact(new Contact()
                                .name("UCRS Team")
                                .email("admin@ucrs.edu")));
    }
}
