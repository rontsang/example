package com.example.demo.service;

import com.example.demo.model.TaxBracket;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.List;

@Service
public class TaxBracketStore {
    private static final String DEFAULT_RESOURCE_PATH = "tax-brackets.json";

    private final ObjectMapper objectMapper;

    private List<TaxBracket> taxBrackets = Collections.emptyList();

    public TaxBracketStore(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void load() {
        try (InputStream is = new ClassPathResource(DEFAULT_RESOURCE_PATH).getInputStream()) {
            this.taxBrackets = objectMapper.readValue(is, new TypeReference<List<TaxBracket>>() {
            });
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load tax brackets from classpath resource: " + DEFAULT_RESOURCE_PATH, e);
        }
    }

    public List<TaxBracket> getTaxBrackets() {
        return taxBrackets;
    }
}
