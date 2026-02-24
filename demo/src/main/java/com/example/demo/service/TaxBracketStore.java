package com.example.demo.service;

import com.example.demo.model.TaxBracket;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class TaxBracketStore {
    private static final String DEFAULT_RESOURCE_PATH = "tax-brackets.txt";

    private List<TaxBracket> taxBrackets = Collections.emptyList();

    @PostConstruct
    public void load() {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(new ClassPathResource(DEFAULT_RESOURCE_PATH).getInputStream(), StandardCharsets.UTF_8))) {
            List<TaxBracket> loaded = new ArrayList<>();

            String line;
            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                    continue;
                }

                String[] parts = trimmed.split(",", -1);
                if (parts.length < 4) {
                    continue;
                }

                TaxBracket bracket = new TaxBracket();
                bracket.setIndex(Integer.parseInt(parts[0].trim()));
                bracket.setLower_bound(Double.parseDouble(parts[1].trim()));
                String upper = parts[2].trim();
                bracket.setUpper_bound(upper.isEmpty() ? null : Double.parseDouble(upper));
                bracket.setRate(Double.parseDouble(parts[3].trim()));

                loaded.add(bracket);
            }

            this.taxBrackets = loaded;
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load tax brackets from classpath resource: " + DEFAULT_RESOURCE_PATH, e);
        }
    }

    public List<TaxBracket> getTaxBrackets() {
        return taxBrackets;
    }
}
