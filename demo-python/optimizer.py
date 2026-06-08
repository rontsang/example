import math
from typing import List, Optional
from models import Account, AccountState, OptimizationWindow, BurndownTimeEvent, TaxBracket
from finance import calc_years_until_depletion, calc_final_value
import tax

# Module constants
iterationsPerScenario = 4
intervalSize = 2
debugScenario = 0

class Scenario:
    def __init__(self):
        self.calculationPoint: List[float] = []
        self.preTaxAmounts: List[float] = []
        self.postTaxAmounts: List[float] = []
        self.taxableAmounts: List[float] = []
        self.yearsToDepletion: float = 0.0
        self.yearsToFirstAccountDepletion: float = float('inf')
        self.indexOfFirstAccountDepletion: int = -1


class ScenarioNode:
    def __init__(self, starting_state: Optional[AccountState] = None, ending_state: Optional[AccountState] = None, level: int = 0, scenario: Optional[Scenario] = None, debug_scenario: int = 0, optimization_windows: Optional[List[OptimizationWindow]] = None):
        self.startingAccountState = starting_state
        self.endingAccountState = ending_state
        self.level = level
        self.scenario = scenario or Scenario()
        self.debugScenario = debug_scenario
        self.optimizationWindows = optimization_windows if optimization_windows is not None else []
        self.children: List['ScenarioNode'] = []
        self.optimalNodes: List['ScenarioNode'] = []
        self.optimalChild: Optional['ScenarioNode'] = None
        self.yearsToDepletion: float = float('inf')
        self.optimalWindow: Optional[List[float]] = None
        self.optimalIndex: int = -1

    def getNumAccounts(self) -> int:
        return len(self.startingAccountState.accounts) if self.startingAccountState else 0

    def getOptimizationWindows(self) -> List[OptimizationWindow]:
        if not self.optimizationWindows:
            self.optimizationWindows = OptimizationWindow.init_list(self.getNumAccounts())
        return self.optimizationWindows

    def addChild(self, child: 'ScenarioNode'):
        self.children.append(child)

    def getChild(self, index: int) -> Optional['ScenarioNode']:
        return self.children[index] if index < len(self.children) else None

    def getCurrentOptimizationNode(self) -> 'ScenarioNode':
        return self.optimalNodes[-1]

    def cloneNodeWithoutChildren(self) -> 'ScenarioNode':
        return ScenarioNode(
            starting_state=self.startingAccountState,
            ending_state=None,
            level=self.level,
            scenario=None,
            debug_scenario=self.debugScenario
        )

    def getOptimalChildAndYearsToDepletion(self):
        self.setOptimalChild()
        self.setYearsToDepletion()

    def setOptimalChild(self):
        if len(self.optimalNodes) > 0:
            last_opt = self.optimalNodes[-1]
            last_opt.getOptimalChildAndYearsToDepletion()
            self.optimalChild = last_opt.optimalChild
            self.optimalWindow = last_opt.optimalWindow
            self.optimalIndex = last_opt.optimalIndex
        elif len(self.children) > 0:
            self.optimalChild = None
            for idx, child in enumerate(self.children):
                child.getOptimalChildAndYearsToDepletion()
                if self.optimalChild is None or child.yearsToDepletion > self.optimalChild.yearsToDepletion:
                    self.optimalChild = child
                    self.optimalWindow = child.optimalWindow
                    self.optimalIndex = idx

    def setYearsToDepletion(self):
        if self.scenario:
            self.yearsToDepletion = self.scenario.yearsToFirstAccountDepletion
        else:
            self.yearsToDepletion = 0.0
        
        if self.optimalChild:
            self.yearsToDepletion += self.optimalChild.yearsToDepletion


# --- Helper Functions ---

def generate_permutations(size: int, intervals: int) -> List[List[float]]:
    permutations = []
    
    def generate(current: List[float], size_rem: int, remaining: float):
        if size_rem == 1:
            val = round(remaining * 100.0) / 100.0
            current.append(val)
            permutations.append(list(current))
            current.pop()
        else:
            increment = 1.0 / intervals
            for i in range(intervals + 1):
                value = round(i * increment * 100.0) / 100.0
                rem = round(remaining * 100.0) / 100.0
                if value <= rem:
                    current.append(value)
                    generate(current, size_rem - 1, rem - value)
                    current.pop()
                    
    generate([], size, 1.0)
    return permutations


def calculate_post_tax_amounts(parent: ScenarioNode, scenario_perm: List[float]):
    optimization_windows = parent.getOptimizationWindows()
    adjusted_calculation = [0.0] * len(parent.startingAccountState.accounts)
    
    parent.scenario.calculationPoint = []
    
    for accountNumber in range(len(parent.startingAccountState.accounts)):
        lowerBound = optimization_windows[accountNumber].lowerBound
        upperBound = optimization_windows[accountNumber].upperBound
        range_val = upperBound - lowerBound
        
        if accountNumber == len(scenario_perm) - 1:
            adjustedPercentage = 1.0 - sum(adjusted_calculation[:accountNumber])
            adjusted_calculation[accountNumber] = adjustedPercentage
        else:
            adjustedPercentage = lowerBound + (scenario_perm[accountNumber] * range_val)
            adjusted_calculation[accountNumber] = adjustedPercentage
            
        scenario_perm[accountNumber] = adjustedPercentage
        parent.scenario.calculationPoint.append(adjustedPercentage)


def calculate_years_until_first_account_depletes(node: ScenarioNode):
    min_years = float('inf')
    node.scenario.yearsToFirstAccountDepletion = float('inf')
    node.scenario.indexOfFirstAccountDepletion = -1
    
    for i in range(len(node.startingAccountState.accounts)):
        account = node.startingAccountState.accounts[i]
        annual_withdrawal = node.scenario.preTaxAmounts[i]
        interest_rate = node.startingAccountState.interestRate
        
        years = calc_years_until_depletion(account.totalValue, annual_withdrawal, interest_rate)
        
        if years < min_years:
            min_years = years
            node.scenario.yearsToFirstAccountDepletion = years
            node.scenario.indexOfFirstAccountDepletion = i

    if node.scenario.yearsToFirstAccountDepletion == float('inf'):
        node.scenario.yearsToDepletion = float('inf')
        return


    print("=============================================")
    print(f"Scenario: {node.debugScenario}")
    print(f"Accounts: {[acc.principalAmount for acc in node.startingAccountState.accounts]}")
    print(f"Calculation Point: {node.scenario.calculationPoint}")
    print(f"Post Tax Amounts for each account: {node.scenario.postTaxAmounts}")
    print(f"Pre Tax Amounts for each account: {node.scenario.preTaxAmounts}")
    print(f"Years until first account depletion: {node.scenario.yearsToFirstAccountDepletion}")
    if node.scenario.indexOfFirstAccountDepletion != -1:
        print(f"Depleted account: {node.startingAccountState.accounts[node.scenario.indexOfFirstAccountDepletion].accountName}")


def calculate_ending_account(parent: ScenarioNode, i: int) -> Account:
    startingAccount = parent.startingAccountState.accounts[i]
    preTaxAmount = parent.scenario.preTaxAmounts[i]
    years_to_deplete = parent.scenario.yearsToFirstAccountDepletion
    interestRate = parent.startingAccountState.interestRate
    
    futureValuePrincipal = startingAccount.principalAmount
    futureValueCapitalGains = startingAccount.capitalGainsAmount
    
    # Match Java loop: for(int year = 1; year < parent.scenario.yearsToFirstAccountDepletion; year++)
    year = 1
    while year < years_to_deplete:
        totalValue = futureValuePrincipal + futureValueCapitalGains
        if totalValue > 0:
            futureValueCapitalGains += (futureValuePrincipal + futureValueCapitalGains) * interestRate
            totalValue = futureValuePrincipal + futureValueCapitalGains
            futureValuePrincipal -= preTaxAmount * futureValuePrincipal / totalValue
            futureValueCapitalGains -= preTaxAmount * futureValueCapitalGains / totalValue
        year += 1
            
    partialYear = years_to_deplete - math.floor(years_to_deplete)
    futureValueCapitalGains += (futureValuePrincipal + futureValueCapitalGains) * interestRate * partialYear
    totalValue = futureValuePrincipal + futureValueCapitalGains
    if totalValue > 0:
        futureValuePrincipal -= preTaxAmount * (futureValuePrincipal / totalValue) * partialYear
        futureValueCapitalGains -= preTaxAmount * (futureValueCapitalGains / totalValue) * partialYear
        
    endingAccount = Account(futureValuePrincipal, futureValueCapitalGains, startingAccount.accountName)
    endingAccount.isAmountTaxable = startingAccount.isAmountTaxable
    endingAccount.isCapitalGainsTaxable = startingAccount.isCapitalGainsTaxable
    endingAccount.capitalGainsTaxablePercentage = startingAccount.capitalGainsTaxablePercentage
    return endingAccount


def calculate_ending_account_state(parent: ScenarioNode):
    parent.endingAccountState = AccountState(
        post_tax_amount_needed=parent.startingAccountState.postTaxAmountNeededPerYear,
        interest_rate=parent.startingAccountState.interestRate,
        income=parent.startingAccountState.income
    )
    
    for i in range(parent.getNumAccounts()):
        if i != parent.scenario.indexOfFirstAccountDepletion and parent.startingAccountState.accounts[i].getTotalValue() > 0:
            ending_account = calculate_ending_account(parent, i)
            parent.endingAccountState.accounts.append(ending_account)


def generate_children(parent: ScenarioNode):
    global debugScenario
    numAccounts = len(parent.endingAccountState.accounts)
    if numAccounts == 0:
        return
        
    scenarioPermutations = generate_permutations(numAccounts, intervalSize)
    
    for scenario_perm in scenarioPermutations:
        debugScenario += 1
        child = ScenarioNode(
            starting_state=parent.endingAccountState,
            ending_state=AccountState(),
            level=parent.level + 1,
            scenario=Scenario(),
            debug_scenario=debugScenario,
            optimization_windows=list(parent.getOptimizationWindows())
        )
        calculate_post_tax_amounts(child, scenario_perm)
        tax.calculate_pre_tax_amount_node(child, scenario_perm)
        
        parent.addChild(child)


def calculate_children(parent: ScenarioNode):
    if parent is not None:
        for child in parent.children:
            calculate_years_until_accounts_are_empty(child)
            if child.scenario.yearsToDepletion == float('inf'):
                if parent.scenario is None:
                    parent.scenario = Scenario()
                parent.scenario.yearsToDepletion = float('inf')
                return


def calculate_years_until_accounts_are_empty(parent_node: ScenarioNode) -> float:
    calculate_years_until_first_account_depletes(parent_node)
    if parent_node.scenario.yearsToFirstAccountDepletion != float('inf'):
        calculate_ending_account_state(parent_node)
        generate_children_and_calculate(parent_node)
    return parent_node.scenario.yearsToDepletion


def generate_children_and_calculate(parent: ScenarioNode):
    generate_children(parent)
    calculate_children(parent)
    
    while (len(parent.children) > 1 and 
           len(parent.optimalNodes) < iterationsPerScenario and 
           parent.scenario.yearsToDepletion != float('inf')):
        setup_next_optimization_node(parent)
        generate_children(parent.getCurrentOptimizationNode())
        calculate_children(parent.getCurrentOptimizationNode())


def setup_next_optimization_node(nodeToOptimize: ScenarioNode):
    nodeToOptimize.getOptimalChildAndYearsToDepletion()
    set_next_optimal_node(nodeToOptimize)
    shrink_optimization_window(nodeToOptimize)


def set_next_optimal_node(nodeToOptimize: ScenarioNode):
    next_iteration = nodeToOptimize.cloneNodeWithoutChildren()
    nodeToOptimize.optimalNodes.append(next_iteration)
    nodeToOptimize.getCurrentOptimizationNode().optimizationWindows = []
    next_iteration.startingAccountState = nodeToOptimize.startingAccountState
    next_iteration.endingAccountState = nodeToOptimize.endingAccountState


def shrink_optimization_window(nodeToOptimize: ScenarioNode):
    prevOptimalPoint = nodeToOptimize.optimalChild.scenario.calculationPoint
    iteration = len(nodeToOptimize.optimalNodes)
    
    current_opt_node = nodeToOptimize.getCurrentOptimizationNode()
    current_opt_node.optimizationWindows = []
    
    num_accounts = int(nodeToOptimize.optimalChild.getNumAccounts())
    for j in range(num_accounts):
        prevAccountOptimalPoint = prevOptimalPoint[j]
        intervalShift = 1.0 / (intervalSize * (2 ** iteration))
        
        lowerBound = 0.0 if prevAccountOptimalPoint == 0 else prevAccountOptimalPoint - intervalShift
        upperBound = 1.0 if prevAccountOptimalPoint == 1 else prevAccountOptimalPoint + intervalShift
        
        if prevAccountOptimalPoint == 0:
            upperBound += intervalShift
        if prevAccountOptimalPoint == 1:
            lowerBound -= intervalShift
            
        current_opt_node.optimizationWindows.append(OptimizationWindow(lowerBound, upperBound))


# --- Postprocessing and Staging ---

def round_account_to_nearest_cent(yearEndState: AccountState, account_idx: int):
    acc = yearEndState.accounts[account_idx]
    acc.principalAmount = round(acc.principalAmount * 100.0) / 100.0
    if acc.principalAmount < 0.02:
        acc.principalAmount = 0.0
        
    acc.capitalGainsAmount = round(acc.capitalGainsAmount * 100.0) / 100.0
    if acc.capitalGainsAmount < 0.02:
        acc.capitalGainsAmount = 0.0


def calculate_years_until_first_account_depletes_for_postprocessor(startingAccountState: AccountState, withdrawalsPerYear: List[float]) -> float:
    min_years = float('inf')
    for i in range(len(startingAccountState.accounts)):
        account = startingAccountState.accounts[i]
        annual_withdrawal = withdrawalsPerYear[i]
        interest_rate = startingAccountState.interestRate
        years = calc_years_until_depletion(account.totalValue, annual_withdrawal, interest_rate)
        if years < min_years:
            min_years = years
    return min_years


def calculate_result_state_per_year(startingAccountState: AccountState, withdrawalsPerYear: List[float], burndown: List[BurndownTimeEvent], yearsToFirstAccountDepletion: float):
    currentState = startingAccountState.cloneAccountState()
    
    if all(acc.totalValue < 0.02 for acc in currentState.accounts):
        return
        
    partialYear = math.ceil(burndown[0].year) - burndown[0].year
    willItFillToNextYear = (yearsToFirstAccountDepletion - partialYear) > 0
    
    if burndown[0] is not None and burndown[0].year != 0.0 and willItFillToNextYear:
        yearEndState = currentState.cloneAccountState()
        for account in range(len(startingAccountState.accounts)):
            totalValue = currentState.accounts[account].totalValue
            capitalGains = currentState.accounts[account].capitalGainsAmount
            principal = currentState.accounts[account].principalAmount
            
            yearEndState.accounts[account].capitalGainsAmount += (principal + capitalGains) * currentState.interestRate * partialYear
            totalValue = yearEndState.accounts[account].capitalGainsAmount + yearEndState.accounts[account].principalAmount
            capitalGains = yearEndState.accounts[account].capitalGainsAmount
            
            if totalValue > 0:
                yearEndState.accounts[account].principalAmount -= withdrawalsPerYear[account] * principal / totalValue * partialYear
                yearEndState.accounts[account].capitalGainsAmount -= withdrawalsPerYear[account] * capitalGains / totalValue * partialYear
                
            round_account_to_nearest_cent(yearEndState, account)
            
        burndown.append(BurndownTimeEvent(yearEndState, math.ceil(burndown[0].year), list(withdrawalsPerYear)))
        currentState = yearEndState
        yearsToFirstAccountDepletion -= partialYear

    year = 1
    while year < yearsToFirstAccountDepletion:
        yearEndState = currentState.cloneAccountState()
        for account in range(len(startingAccountState.accounts)):
            totalValue = currentState.accounts[account].totalValue
            capitalGains = currentState.accounts[account].capitalGainsAmount
            principal = currentState.accounts[account].principalAmount
            
            yearEndState.accounts[account].capitalGainsAmount += (principal + capitalGains) * currentState.interestRate
            totalValue = yearEndState.accounts[account].capitalGainsAmount + yearEndState.accounts[account].principalAmount
            capitalGains = yearEndState.accounts[account].capitalGainsAmount
            
            if totalValue > 0:
                yearEndState.accounts[account].principalAmount -= withdrawalsPerYear[account] * principal / totalValue
                yearEndState.accounts[account].capitalGainsAmount -= withdrawalsPerYear[account] * capitalGains / totalValue
                
            round_account_to_nearest_cent(yearEndState, account)
            
        burndown.append(BurndownTimeEvent(yearEndState.cloneAccountState(), year + math.ceil(burndown[0].year), list(withdrawalsPerYear)))
        currentState = yearEndState
        year += 1

    partialYear = yearsToFirstAccountDepletion - math.floor(yearsToFirstAccountDepletion)
    yearEndState = currentState.cloneAccountState()
    for account in range(len(startingAccountState.accounts)):
        totalValue = currentState.accounts[account].totalValue
        capitalGains = currentState.accounts[account].capitalGainsAmount
        principal = currentState.accounts[account].principalAmount
        
        yearEndState.accounts[account].capitalGainsAmount += (principal + capitalGains) * currentState.interestRate * partialYear
        totalValue = yearEndState.accounts[account].capitalGainsAmount + yearEndState.accounts[account].principalAmount
        capitalGains = yearEndState.accounts[account].capitalGainsAmount
        
        if totalValue > 0:
            yearEndState.accounts[account].principalAmount -= withdrawalsPerYear[account] * principal / totalValue * partialYear
            yearEndState.accounts[account].capitalGainsAmount -= withdrawalsPerYear[account] * capitalGains / totalValue * partialYear
            
        round_account_to_nearest_cent(yearEndState, account)
        
    if willItFillToNextYear:
        burndown.append(BurndownTimeEvent(yearEndState, yearsToFirstAccountDepletion + math.ceil(burndown[0].year), list(withdrawalsPerYear)))
    else:
        burndown.append(BurndownTimeEvent(yearEndState, yearsToFirstAccountDepletion + burndown[0].year, list(withdrawalsPerYear)))


def generate_burndown_until_first_account_depletes(startingAccountState: AccountState, withdrawalsPerYear: List[float], currentBurnDown: List[BurndownTimeEvent], startingYearOverride: Optional[float] = None) -> List[BurndownTimeEvent]:
    startingYear = 0.0
    if startingYearOverride is not None:
        startingYear = startingYearOverride
        
    if currentBurnDown and len(currentBurnDown) > 0:
        lastEvent = currentBurnDown[-1]
        startingYear = lastEvent.year
        
    newBurndown = []
    startingEvent = BurndownTimeEvent(startingAccountState.cloneAccountState(), startingYear, list(withdrawalsPerYear))
    newBurndown.append(startingEvent)
    
    yearsToFirstAccountDepletion = calculate_years_until_first_account_depletes_for_postprocessor(startingAccountState, withdrawalsPerYear)
    if yearsToFirstAccountDepletion < 1:
        return newBurndown
        
    calculate_result_state_per_year(startingAccountState, withdrawalsPerYear, newBurndown, yearsToFirstAccountDepletion)
    return newBurndown


def burndown_stage_n(currentScenarioNode: ScenarioNode, burndown: List[BurndownTimeEvent], starting_year: Optional[float] = None):
    nextBurnDown = generate_burndown_until_first_account_depletes(currentScenarioNode.startingAccountState, currentScenarioNode.scenario.preTaxAmounts, burndown, starting_year)
    
    for event in nextBurnDown:
        event.taxableAmount = []
        for i in range(len(event.accountState.accounts)):
            acc = event.accountState.accounts[i]
            total_val = acc.principalAmount + acc.capitalGainsAmount
            ratio = acc.principalAmount / total_val if total_val > 0 else 0.0
            
            totalTaxable = 0.0
            if acc.isAmountTaxable:
                totalTaxable += event.preTaxAmounts[i] * ratio
            if acc.isCapitalGainsTaxable:
                totalTaxable += event.preTaxAmounts[i] * (1.0 - ratio) * acc.capitalGainsTaxablePercentage
                
            event.taxableAmount.append(totalTaxable)
        burndown.append(event)
        
    if currentScenarioNode.optimalChild is not None:
        burndown_stage_n(currentScenarioNode.optimalChild, burndown, starting_year)


# --- Core Entry Services ---

def run_minimization_main(startingState: AccountState) -> Optional[ScenarioNode]:
    global debugScenario
    debugScenario = 0
    
    root = ScenarioNode(
        starting_state=startingState,
        ending_state=startingState,
        level=1,
        scenario=Scenario(),
        debug_scenario=0
    )
    generate_children_and_calculate(root)
    root.getOptimalChildAndYearsToDepletion()
    
    if (root.optimalChild is not None and 
        root.optimalChild.scenario is not None and 
        root.optimalChild.scenario.yearsToDepletion < 100 and 
        root.scenario is not None and 
        root.scenario.yearsToDepletion < 100):
        
        burndown_stage_n(root.optimalChild, [])
        root.getOptimalChildAndYearsToDepletion()
        return root
        
    return None


def compute_burndown_minimization(startingState: AccountState) -> Optional[List[BurndownTimeEvent]]:
    root = run_minimization_main(startingState)
    if root is None or root.optimalChild is None:
        return None
        
    burndown = []
    burndown_stage_n(root.optimalChild, burndown)
    return burndown


def run_simulation_main(startingState: AccountState, withdrawals: List[float], startingYear: float) -> Optional[ScenarioNode]:
    scenario = Scenario()
    scenario.preTaxAmounts = withdrawals
    
    root = ScenarioNode(
        starting_state=startingState,
        ending_state=startingState,
        level=1,
        scenario=scenario,
        debug_scenario=0
    )
    
    # Calculate depletion
    calculate_years_until_first_account_depletes(root)
    if root.scenario.yearsToFirstAccountDepletion != float('inf'):
        calculate_ending_account_state(root)
        
    root.getOptimalChildAndYearsToDepletion()
    
    if root.scenario.yearsToDepletion < 100:
        return root
    return None


def compute_burndown_simulation(startingState: AccountState, withdrawals: List[float], startingYear: float) -> Optional[List[BurndownTimeEvent]]:
    root = run_simulation_main(startingState, withdrawals, startingYear)
    if root is None:
        return None
        
    burndown = []
    burndown_stage_n(root, burndown, startingYear)
    return burndown
