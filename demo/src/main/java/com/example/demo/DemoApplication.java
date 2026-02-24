package com.example.demo;

import com.example.demo.logging.SystemOutLogger;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        SystemOutLogger.install();
        System.setProperty("javax.net.ssl.trustStore", "path/to/your/certificate.crt");
//        TaxCalculationService.calculatePreTaxAmount(50000);
//        TaxMinimizationService.main();
        SpringApplication.run(DemoApplication.class, args);
    }

}
