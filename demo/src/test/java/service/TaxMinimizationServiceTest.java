package service;

import com.example.demo.service.TaxBracketService;
import com.example.demo.service.TaxMinimizationService;
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
@ContextConfiguration(classes= TaxMinimizationService.class)
public class TaxMinimizationServiceTest {

    @Test
    public void testReadTaxBrackets() {
        while(true){
            try{
                TaxMinimizationService.main(500000,500000,200000);
            } catch(Exception e){
                System.out.println(e);
            }
        }
    }
}