package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        System.setProperty("javax.net.ssl.trustStore", "path/to/your/certificate.crt");
        SpringApplication.run(DemoApplication.class, args);
    }

}
