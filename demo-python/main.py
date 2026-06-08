import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional

from models import FormData, UserTestFormData, Account, AccountState
import tax
import optimizer

app = FastAPI()

# Enable CORS to allow the frontend to access endpoints
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:4021"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize tax system using files relative to script directory
script_dir = os.path.dirname(os.path.abspath(__file__))
repo_root = os.path.dirname(script_dir)

# Initialize with dummy brackets by default to match Java baseline
# Can be switched to real brackets by passing use_real_brackets=True
use_real_brackets = False
tax.initialize_tax_system(use_real_brackets=use_real_brackets, base_dir=repo_root)


@app.get("/hello")
def get_hello() -> str:
    return "Hello, World!"


@app.get("/all")
def get_all() -> List[Dict[str, Any]]:
    return [b.to_dict() for b in tax.taxBrackets]


@app.get("/results")
def get_results() -> Any:
    return None



@app.post("/submit-form")
def post_submit_form(data: FormData) -> Optional[List[Dict[str, Any]]]:
    starting_state = AccountState(
        post_tax_amount_needed=data.amountPerYear,
        interest_rate=data.interestRate,
        income=data.income
    )
    starting_state.accounts.append(Account(data.tfsaAmount, 0, "TFSA"))
    starting_state.accounts.append(Account(data.rrspAmount, 0, "RRSP"))
    actual_marg_principal = max(0.0, data.margAmountPrincipal - data.margAmountCapitalGain)
    starting_state.accounts.append(Account(actual_marg_principal, data.margAmountCapitalGain, "MARG"))
    
    burndown = optimizer.compute_burndown_minimization(starting_state)
    if burndown is None:
        return None
    return [event.to_dict() for event in burndown]


@app.post("/user-test")
def post_user_test(data: UserTestFormData) -> Optional[List[Dict[str, Any]]]:
    starting_state = AccountState(
        post_tax_amount_needed=0, # not used in manual simulation, but matching Java builder
        interest_rate=data.interestRate,
        income=data.income
    )
    starting_state.accounts.append(Account(data.tfsaAmount, 0, "TFSA"))
    starting_state.accounts.append(Account(data.rrspAmount, 0, "RRSP"))
    actual_marg_principal = max(0.0, data.margAmountPrincipal - data.margAmountCapitalGain)
    starting_state.accounts.append(Account(actual_marg_principal, data.margAmountCapitalGain, "MARG"))
    
    # Withdrawals mapping in Java: tfsa, rrsp, marg
    withdrawals = [data.tfsaWithdraw, data.rrspWithdraw, data.margWithdraw]
    
    burndown = optimizer.compute_burndown_simulation(starting_state, withdrawals, data.startingYear)
    if burndown is None:
        return None
    return [event.to_dict() for event in burndown]


@app.post("/set-brackets")
def set_brackets(mode: str):
    """
    Utility endpoint to toggle between 'real' Ontario/Canada brackets and 'dummy' baseline brackets.
    """
    global use_real_brackets
    if mode == "real":
        use_real_brackets = True
        tax.initialize_tax_system(use_real_brackets=True, base_dir=repo_root)
        return {"status": "Switched to real Ontario/Canada tax brackets"}
    else:
        use_real_brackets = False
        tax.initialize_tax_system(use_real_brackets=False, base_dir=repo_root)
        return {"status": "Switched to dummy baseline tax brackets"}
