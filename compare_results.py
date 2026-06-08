import subprocess
import time
import requests
import sys
import os

def start_java_server(repo_root):
    demo_dir = os.path.join(repo_root, "demo")
    wrapper = os.path.join(demo_dir, "mvnw.cmd")
    print("Starting Java server on port 8091...")
    env = os.environ.copy()
    env["SERVER_PORT"] = "8091"
    # Run in background
    proc = subprocess.Popen(
        [wrapper, "spring-boot:run"],
        cwd=demo_dir,
        env=env
    )
    return proc

def start_python_server(repo_root):
    python_dir = os.path.join(repo_root, "demo-python")
    print("Starting Python server on port 8092...")
    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"
    # Run uvicorn in background
    proc = subprocess.Popen(
        ["uvicorn", "main:app", "--port", "8092"],
        cwd=python_dir,
        env=env
    )
    return proc

def wait_for_server(url, timeout=30):
    start = time.time()
    while time.time() - start < timeout:
        try:
            resp = requests.get(url)
            if resp.status_code == 200:
                return True
        except requests.RequestException:
            pass
        time.sleep(1)
    return False

def compare_json(java_res, python_res):
    if len(java_res) != len(python_res):
        print(f"FAIL: Result lengths differ: Java has {len(java_res)} events, Python has {len(python_res)} events.")
        print("\n--- Java Timeline Details ---")
        for idx, ev in enumerate(java_res):
            acc_vals = [a["principalAmount"] + a["capitalGainsAmount"] for a in ev["accountState"]["accounts"]]
            print(f"  [{idx}] Year={ev['year']:.4f}, PreTax={ev['preTaxAmounts']}, Vals={[round(x, 1) for x in acc_vals]}")
        print("\n--- Python Timeline Details ---")
        for idx, ev in enumerate(python_res):
            acc_vals = [a["principalAmount"] + a["capitalGainsAmount"] for a in ev["accountState"]["accounts"]]
            print(f"  [{idx}] Year={ev['year']:.4f}, PreTax={ev['preTaxAmounts']}, Vals={[round(x, 1) for x in acc_vals]}")
        return False
    
    mismatch_count = 0
    for idx, (j_ev, p_ev) in enumerate(zip(java_res, python_res)):
        # Compare year
        j_year = j_ev["year"]
        p_year = p_ev["year"]
        if abs(j_year - p_year) > 1e-4:
            print(f"  Event {idx} year mismatch: Java={j_year}, Python={p_year}")
            mismatch_count += 1
            
        # Compare pre-tax amounts
        j_pre = j_ev.get("preTaxAmounts", [])
        p_pre = p_ev.get("preTaxAmounts", [])
        for a_idx, (j_p, p_p) in enumerate(zip(j_pre, p_pre)):
            if abs(j_p - p_p) > 5.0:  # Allow small solver tolerance
                print(f"  Event {idx} account {a_idx} preTaxAmount mismatch: Java={j_p:.2f}, Python={p_p:.2f}")
                mismatch_count += 1
                
        # Compare account values
        j_accs = j_ev["accountState"]["accounts"]
        p_accs = p_ev["accountState"]["accounts"]
        for a_idx, (j_acc, p_acc) in enumerate(zip(j_accs, p_accs)):
            j_val = j_acc["principalAmount"] + j_acc["capitalGainsAmount"]
            p_val = p_acc["principalAmount"] + p_acc["capitalGainsAmount"]
            if abs(j_val - p_val) > 10.0:  # Allow small diffs due to compound interest paths
                print(f"  Event {idx} account '{j_acc['accountName']}' value mismatch: Java={j_val:.2f}, Python={p_val:.2f}")
                mismatch_count += 1
                
    if mismatch_count == 0:
        print("PASS: Calculations match within acceptable tolerances!")
        return True
    else:
        print(f"FAIL: Found {mismatch_count} discrepancies.")
        return False

def run_tests():
    repo_root = os.path.dirname(os.path.abspath(__file__))
    
    java_proc = start_java_server(repo_root)
    python_proc = start_python_server(repo_root)
    
    print("Waiting for servers to boot...")
    java_ready = wait_for_server("http://localhost:8091/hello")
    python_ready = wait_for_server("http://localhost:8092/hello")
    
    if not java_ready:
        print("ERROR: Java server failed to start.")
        java_proc.terminate()
        python_proc.terminate()
        sys.exit(1)
        
    if not python_ready:
        print("ERROR: Python server failed to start.")
        java_proc.terminate()
        python_proc.terminate()
        sys.exit(1)
        
    print("Both servers running. Sending test requests...")
    
    # Payload 1: Submit Form (Optimized Strategy)
    payload_opt = {
        "tfsaAmount": 500000.0,
        "rrspAmount": 650000.0,
        "margAmountPrincipal": 500000.0,
        "margAmountCapitalGain": 500000.0,
        "amountPerYear": 150000.0,  # Higher spending to ensure depletion < 100 years
        "income": 5000.0,
        "interestRate": 0.04,
        "province": "Ontario"
    }
    
    print("\n--- Test 1: Submit Form (Optimization) ---")
    j_opt_resp = requests.post("http://localhost:8091/submit-form", json=payload_opt)
    p_opt_resp = requests.post("http://localhost:8092/submit-form", json=payload_opt)
    
    try:
        j_res_opt = j_opt_resp.json()
    except Exception as e:
        print(f"Java opt response failed to parse as JSON. Status={j_opt_resp.status_code}, Text={j_opt_resp.text}")
        raise e
        
    try:
        p_res_opt = p_opt_resp.json()
    except Exception as e:
        print(f"Python opt response failed to parse as JSON. Status={p_opt_resp.status_code}, Text={p_opt_resp.text}")
        raise e
    
    print(f"Java optimal timeline length: {len(j_res_opt)} years")
    print(f"Python optimal timeline length: {len(p_res_opt)} years")
    
    opt_ok = compare_json(j_res_opt, p_res_opt)
    
    # Payload 2: User Test (Manual Simulation)
    payload_sim = {
        "tfsaAmount": 500000.0,
        "rrspAmount": 650000.0,
        "margAmountPrincipal": 500000.0,
        "margAmountCapitalGain": 500000.0,
        "amountPerYear": 0.0, # not used in manual sim
        "income": 5000.0,
        "interestRate": 0.04,
        "startingYear": 0.0,
        "tfsaWithdraw": 50000.0,     # Higher withdrawals to ensure depletion
        "rrspWithdraw": 60000.0,
        "margWithdraw": 40000.0,
        "province": "Ontario"
    }
    
    print("\n--- Test 2: User Test (Manual Simulation) ---")
    j_sim_resp = requests.post("http://localhost:8091/user-test", json=payload_sim)
    p_sim_resp = requests.post("http://localhost:8092/user-test", json=payload_sim)
    
    try:
        j_res_sim = j_sim_resp.json()
    except Exception as e:
        print(f"Java sim response failed to parse as JSON. Status={j_sim_resp.status_code}, Text={j_sim_resp.text}")
        raise e
        
    try:
        p_res_sim = p_sim_resp.json()
    except Exception as e:
        print(f"Python sim response failed to parse as JSON. Status={p_sim_resp.status_code}, Text={p_sim_resp.text}")
        raise e
    
    print(f"Java simulation timeline length: {len(j_res_sim)} years")
    print(f"Python simulation timeline length: {len(p_res_sim)} years")
    
    sim_ok = compare_json(j_res_sim, p_res_sim)
    
    # Cleanup
    print("\nTerminating background server processes...")
    java_proc.terminate()
    python_proc.terminate()
    
    # Kill any lingering Java / Python process if needed
    if os.name == 'nt':
        # On Windows, terminate cmd.exe subprocess tree
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(java_proc.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(python_proc.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
    if opt_ok and sim_ok:
        print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("\nSOME VERIFICATIONS FAILED.")
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
