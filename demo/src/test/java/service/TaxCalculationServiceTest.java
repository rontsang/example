package service;

import com.example.demo.service.TaxBracketService;
import com.example.demo.service.TaxCalculationService;
import org.junit.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

// For mystery reasons, we need all five annotations to run tests...
@SpringBootTest
@EnableAutoConfiguration
@ComponentScan(basePackages = {"com.example.demo"})
@RunWith(SpringJUnit4ClassRunner.class)
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes=TaxCalculationService.class)
public class TaxCalculationServiceTest {
    @Autowired
    private ApplicationContext context;
    @Autowired
    private TaxCalculationService taxCalculationService;

    @Test
    public void testCalculatePreTax() {
        double afterTaxAmount = taxCalculationService.calculatePreTaxAmount(50000);
        System.out.println(afterTaxAmount);
    }
}