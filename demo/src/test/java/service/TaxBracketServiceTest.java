package service;

import com.example.demo.service.TaxBracketService;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.junit4.SpringRunner;
//import org.junit.jupiter.api.Test;
import org.junit.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Arrays;

// For mystery reasons, we need all five annotations to run tests...
@SpringBootTest
@EnableAutoConfiguration
@ComponentScan(basePackages = {"com.example.demo"})
@RunWith(SpringJUnit4ClassRunner.class)
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes=TaxBracketService.class)
public class TaxBracketServiceTest {
    @Autowired
    private TaxBracketService taxBracketService;

    @Test
    public void testReadTaxBrackets() {
        System.out.println(taxBracketService.getAllTaxBrackets());
    }
}