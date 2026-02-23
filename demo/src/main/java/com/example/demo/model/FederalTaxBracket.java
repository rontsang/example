package com.example.demo.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "tax_bracket_federal")
public class FederalTaxBracket extends AbstractTaxBracket {
    // table-specific configurations or methods
}
