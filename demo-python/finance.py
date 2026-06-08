import math

def calc_years_until_depletion(balance: float, annual_withdrawal: float, annual_return_rate: float) -> float:
    years = 0.0
    MAX_YEARS = 150.0
    while balance > 0:
        year_end_balance = balance * (1 + annual_return_rate) - annual_withdrawal
        if year_end_balance >= balance or years > MAX_YEARS:
            years = float('inf')
            break
        
        if year_end_balance > 0:
            years += 1.0
        else:
            partial = balance / annual_withdrawal
            balance *= 1 + annual_return_rate * partial
            years += balance / annual_withdrawal
        balance = year_end_balance
    return years

def calc_final_value(balance: float, annual_return_rate: float, years: float, annual_withdrawal: float) -> float:
    # We must match Java's for (int i = 1; i < years; i++) logic exactly:
    i = 1
    while i < years:
        balance = balance * (1 + annual_return_rate) - annual_withdrawal
        i += 1
        
    final_year_percentage = years - int(years)
    balance = balance * (1 + annual_return_rate * final_year_percentage) - annual_withdrawal * final_year_percentage
    return balance
