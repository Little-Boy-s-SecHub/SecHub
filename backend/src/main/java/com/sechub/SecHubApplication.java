package com.sechub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SecHubApplication {

    public static void main(String[] args) {
        SpringApplication.run(SecHubApplication.class, args);
    }
}
