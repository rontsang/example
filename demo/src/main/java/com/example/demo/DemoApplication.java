package com.example.demo;

import com.example.demo.service.TaxCalculationService;
import com.example.demo.service.TaxMinimizationService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        System.setProperty("javax.net.ssl.trustStore", "path/to/your/certificate.crt");
        TaxCalculationService.calculatePreTaxAmount(50000);
        TaxMinimizationService.main(50000,50000,50000);
        SpringApplication.run(DemoApplication.class, args);
    }

}
