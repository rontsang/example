package com.example.demo.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.io.Serializable;


@Entity
@Table(name = "tax_bracket")
public class TaxBracket extends AbstractTaxBracket {
    // table-specific configurations or methods
}

