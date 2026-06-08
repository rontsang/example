import os
import csv
from typing import List, Optional
from models import TaxBracket, Account, AccountState

# Global tax bracket lists
taxBrackets: List[TaxBracket] = []
taxBracketsFederal: List[TaxBracket] = []

def load_brackets_from_file(filepath: str) -> List[TaxBracket]:
    brackets = []
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Tax brackets file not found: {filepath}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            trimmed = line.strip()
            if not trimmed or trimmed.startswith('#'):
                continue
            parts = trimmed.split(',')
            if len(parts) < 4:
                continue
            
            idx = int(parts[0].strip())
            lower = float(parts[1].strip())
            upper_str = parts[2].strip()
            upper = float(upper_str) if upper_str else None
            rate = float(parts[3].strip())
            
            brackets.append(TaxBracket(idx, lower, upper, rate))
    return brackets

def initialize_tax_system(use_real_brackets: bool = False, base_dir: str = ""):
    global taxBrackets, taxBracketsFederal
    if use_real_brackets:
        # Load from the real tax brackets CSV
        real_csv = os.path.join(base_dir, "tax-brackets-real.csv")
        # If it doesn't exist, we will create it later, but let's handle loading
        if os.path.exists(real_csv):
            # We'll parse separate Ontario and Federal brackets from this file
            # Format: type,index,lower_bound,upper_bound,rate (type is 'ON' or 'Federal')
            taxBrackets = []
            taxBracketsFederal = []
            with open(real_csv, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                for row in reader:
                    if not row or row[0].startswith('#') or row[0] == 'type':
                        continue
                    b_type = row[0].strip()
                    idx = int(row[1].strip())
                    lower = float(row[2].strip())
                    upper_str = row[3].strip()
                    upper = float(upper_str) if upper_str else None
                    rate = float(row[4].strip())
                    
                    bracket = TaxBracket(idx, lower, upper, rate)
                    if b_type == "ON":
                        taxBrackets.append(bracket)
                    else:
                        taxBracketsFederal.append(bracket)
        else:
            # Fallback to loading dummy brackets
            fallback_to_dummy(base_dir)
    else:
        fallback_to_dummy(base_dir)

def fallback_to_dummy(base_dir: str):
    global taxBrackets, taxBracketsFederal
    # Path to dummy tax-brackets.txt
    dummy_txt = os.path.join(base_dir, "demo/src/main/resources/tax-brackets.txt")
    if not os.path.exists(dummy_txt):
        # Fallback if running outside demo workspace
        dummy_txt = os.path.join(base_dir, "tax-brackets.txt")
    
    loaded = load_brackets_from_file(dummy_txt)
    taxBrackets = loaded
    # Java maps federal brackets directly from provincial ones:
    taxBracketsFederal = []
    for b in loaded:
        taxBracketsFederal.append(TaxBracket(b.index, b.lower_bound, b.upper_bound, b.rate))

def income_after_tax_credit(amount: float, tax_credit: float) -> float:
    if amount - tax_credit < 0:
        return 0.0
    return amount - tax_credit

def calculate_post_tax_amount_by_location(amount: float, location: str) -> float:
    brackets_list = taxBracketsFederal if location == "Canada" else taxBrackets
    
    pre_tax_amount = amount
    post_tax_amount = amount
    current_bracket_idx = 0
    
    while current_bracket_idx < len(brackets_list):
        bracket = brackets_list[current_bracket_idx]
        if bracket.lower_bound > pre_tax_amount:
            break
            
        if bracket.upper_bound is not None:
            if bracket.upper_bound < pre_tax_amount:
                post_tax_amount -= (bracket.upper_bound - bracket.lower_bound) * bracket.rate
            else:
                post_tax_amount -= (pre_tax_amount - bracket.lower_bound) * bracket.rate
        else:
            post_tax_amount -= (pre_tax_amount - bracket.lower_bound) * bracket.rate
            
        current_bracket_idx += 1
        
    return post_tax_amount

def calculate_post_tax_amount(amount: float) -> float:
    provincial_basic_amount = 11865.0
    federal_basic_amount = 15000.0
    
    provincial_income = income_after_tax_credit(amount, provincial_basic_amount)
    federal_income = income_after_tax_credit(amount, federal_basic_amount)
    
    post_tax_provincial = calculate_post_tax_amount_by_location(provincial_income, "ON")
    post_tax_federal = calculate_post_tax_amount_by_location(federal_income, "Canada")
    
    tax_provincial = provincial_income - post_tax_provincial
    tax_federal = federal_income - post_tax_federal
    
    return amount - tax_provincial - tax_federal

def calculate_pre_tax_amount(after_tax_amount: float, income: float) -> float:
    current_tax_bracket = 0
    pre_tax_amount = 0.0
    after_tax_amount_still_needed = after_tax_amount
    
    while current_tax_bracket < len(taxBrackets) and after_tax_amount_still_needed > 0:
        bracket = taxBrackets[current_tax_bracket]
        lower_bound = bracket.lower_bound
        
        # Shift brackets based on income
        if bracket.upper_bound is not None and bracket.upper_bound <= income:
            after_tax_amount_still_needed = (bracket.upper_bound - lower_bound) * (1 - bracket.rate)
            income -= bracket.upper_bound
            current_tax_bracket += 1
            continue
        elif (bracket.upper_bound is None or income < bracket.upper_bound) and income > bracket.lower_bound:
            if income > lower_bound:
                after_tax_amount_still_needed = (income - lower_bound) * (1 - bracket.rate)
                lower_bound -= income
                
        # Calculate how much money we can get from current bracket
        if bracket.upper_bound is not None:
            pre_tax_amount_from_bracket = bracket.upper_bound - lower_bound
            after_tax_amount_from_bracket = (bracket.upper_bound - lower_bound) * (1 - bracket.rate)
        else:
            pre_tax_amount_from_bracket = after_tax_amount_still_needed / (1 - bracket.rate)
            after_tax_amount_from_bracket = after_tax_amount_still_needed
            
        if after_tax_amount_from_bracket < after_tax_amount_still_needed:
            pre_tax_amount += pre_tax_amount_from_bracket
            after_tax_amount_still_needed -= after_tax_amount_from_bracket
            current_tax_bracket += 1
        else:
            pre_tax_amount += after_tax_amount_still_needed / (1 - bracket.rate)
            after_tax_amount_still_needed = 0.0
            
    return pre_tax_amount

def calculate_pre_tax_amount_node(node, scenario_percentages: List[float]):
    income = node.startingAccountState.income
    total_withdrawal = node.startingAccountState.postTaxAmountNeededPerYear
    
    account_rrsp: Optional[Account] = None
    account_tfsa: Optional[Account] = None
    account_marg: Optional[Account] = None
    
    target_rrsp_pct = 0.0
    target_tfsa_pct = 0.0
    target_marg_pct = 0.0
    
    for i in range(len(node.startingAccountState.accounts)):
        account = node.startingAccountState.accounts[i]
        percentage = node.scenario.calculationPoint[i]
        if account.accountName == "RRSP":
            target_rrsp_pct = percentage
            account_rrsp = account
        elif account.accountName == "TFSA":
            target_tfsa_pct = percentage
            account_tfsa = account
        elif account.accountName == "MARG":
            target_marg_pct = percentage
            account_marg = account

    # Match Java line: double totalNonTaxable = targetRRSPpercentage + targetMARGpercentage;
    total_non_taxable = target_rrsp_pct + target_marg_pct
    
    ratio_cg_2_p = 0.0
    ratio_cg = 0.0
    if account_marg is None:
        target_marg_pct = 0.0
    else:
        margin_total = account_marg.capitalGainsAmount + account_marg.principalAmount
        if margin_total > 0:
            ratio_cg_2_p = account_marg.capitalGainsAmount / margin_total
        ratio_cg = account_marg.capitalGainsTaxablePercentage

    post_tax_target = total_withdrawal
    
    pre_tax_guess_rrsp = (post_tax_target - income) * target_rrsp_pct
    pre_tax_guess_marg = (post_tax_target - income) * target_marg_pct
    pre_tax_guess_tfsa = (post_tax_target - income) * target_tfsa_pct
    
    tolerance = 50.0
    difference_total = float('inf')
    iterations = 0
    
    if total_non_taxable != 0:
        while abs(difference_total) > tolerance:
            iterations += 1
            if iterations > 50:
                break
                
            taxable_rrsp = pre_tax_guess_rrsp
            taxable_margin = pre_tax_guess_marg * ratio_cg_2_p * ratio_cg
            pre_tax_total = income + taxable_rrsp + taxable_margin
            
            post_tax_total = calculate_post_tax_amount(pre_tax_total)
            
            effective_rate = 0.0
            if pre_tax_total != 0:
                effective_rate = 1.0 - post_tax_total / pre_tax_total
                
            effective_income = income * (1.0 - effective_rate)
            effective_rrsp = pre_tax_guess_rrsp * (1.0 - effective_rate)
            
            effective_margin_p = pre_tax_guess_marg * (1.0 - ratio_cg_2_p)
            effective_margin_cg_nontaxable = pre_tax_guess_marg * ratio_cg_2_p * ratio_cg
            effective_margin_cg_taxable = pre_tax_guess_marg * ratio_cg_2_p * (ratio_cg * (1.0 - effective_rate))
            
            effective_marg = effective_margin_p + effective_margin_cg_nontaxable + effective_margin_cg_taxable
            
            effective_tfsa = 0.0
            if target_tfsa_pct != 0:
                effective_tfsa = pre_tax_guess_tfsa
                
            difference_total = post_tax_target - effective_income - effective_rrsp - effective_marg - effective_tfsa
            
            new_guess_total = pre_tax_guess_rrsp + pre_tax_guess_marg + pre_tax_guess_tfsa + difference_total
            pre_tax_guess_rrsp = new_guess_total * target_rrsp_pct
            pre_tax_guess_marg = new_guess_total * target_marg_pct
            pre_tax_guess_tfsa = new_guess_total * target_tfsa_pct
    else:
        post_tax_total = calculate_post_tax_amount(income)
        pre_tax_guess_tfsa = total_withdrawal - post_tax_total
        
    # Save results to node
    # Clear and populate node.scenario.preTaxAmounts
    node.scenario.preTaxAmounts = []
    for i in range(len(node.startingAccountState.accounts)):
        account = node.startingAccountState.accounts[i]
        if account.accountName == "RRSP":
            node.scenario.preTaxAmounts.append(pre_tax_guess_rrsp)
        elif account.accountName == "TFSA":
            node.scenario.preTaxAmounts.append(pre_tax_guess_tfsa)
        elif account.accountName == "MARG":
            node.scenario.preTaxAmounts.append(pre_tax_guess_marg)
