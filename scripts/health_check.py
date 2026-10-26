#!/usr/bin/env python3
"""
System Health & Environment Verification Script
Verifies Python version, virtual environment status, required directories,
and installed dependency health for the Self-Healing Cloud Infrastructure system.
"""

import sys
import os
import importlib
from pathlib import Path


def check_python_version() -> bool:
    print("\n[1/5] Checking Python Version...")
    version_info = sys.version_info
    version_str = f"{version_info.major}.{version_info.minor}.{version_info.micro}"
    print(f"      Detected: Python {version_str}")
    
    if version_info.major == 3 and version_info.minor in (11, 12):
        print(f"      [OK] Compatible Python version ({version_str})")
        return True
    elif version_info.major == 3 and version_info.minor >= 13:
        print(f"      [WARN] Python {version_str} is very new; some prebuilt ML binary wheels may require build tools.")
        return True
    else:
        print(f"      [FAIL] Incompatible Python version: {version_str}. Python 3.11 or 3.12 recommended.")
        return False


def check_virtualenv() -> bool:
    print("\n[2/5] Checking Virtual Environment Status...")
    in_venv = (sys.prefix != sys.base_prefix) or ("VIRTUAL_ENV" in os.environ)
    if in_venv:
        print(f"      [OK] Active virtual environment: {sys.prefix}")
        return True
    else:
        print("      [WARN] Not running inside an active virtual environment.")
        print("             Please activate with: .\\venv\\Scripts\\Activate.ps1")
        return False


def check_directories() -> bool:
    print("\n[3/5] Checking Project Directory Structure...")
    root = Path(__file__).resolve().parent.parent
    required_dirs = [
        root / "backend",
        root / "backend" / "api",
        root / "backend" / "agents",
        root / "backend" / "ml",
        root / "backend" / "ml" / "artifacts",
        root / "backend" / "cloud",
        root / "backend" / "data" / "raw",
        root / "backend" / "data" / "processed",
        root / "backend" / "data" / "knowledge_base",
        root / "backend" / "services",
        root / "backend" / "reports",
        root / "scripts",
        root / "frontend",
    ]
    
    all_ok = True
    for d in required_dirs:
        rel_path = d.relative_to(root)
        if d.is_dir():
            print(f"      [OK] Directory exists: {rel_path}")
        else:
            print(f"      [MISSING] Directory: {rel_path}")
            all_ok = False
            
    return all_ok


def check_configuration_templates() -> bool:
    print("\n[4/5] Checking Configuration Templates...")
    root = Path(__file__).resolve().parent.parent
    env_example = root / ".env.example"
    gitignore = root / ".gitignore"
    
    all_ok = True
    if env_example.is_file():
        print("      [OK] .env.example found")
    else:
        print("      [MISSING] .env.example")
        all_ok = False
        
    if gitignore.is_file():
        print("      [OK] .gitignore found")
    else:
        print("      [MISSING] .gitignore")
        all_ok = False
        
    env_file = root / ".env"
    if env_file.is_file():
        print("      [OK] .env file detected (local configuration)")
    else:
        print("      [INFO] .env not yet created; copy from .env.example when adding custom credentials.")
        
    return all_ok


def check_dependencies() -> dict:
    print("\n[5/5] Checking Core Python Dependencies...")
    core_packages = [
        ("fastapi", "FastAPI Framework"),
        ("uvicorn", "Uvicorn ASGI Server"),
        ("pydantic", "Pydantic Data Validation"),
        ("sqlalchemy", "SQLAlchemy ORM"),
        ("sklearn", "Scikit-learn ML Library"),
        ("numpy", "NumPy Numerical Computing"),
        ("pandas", "Pandas Data Analysis"),
        ("joblib", "Joblib Model Serialization"),
        ("boto3", "AWS SDK (Boto3)"),
    ]
    
    results = {}
    missing = []
    for pkg_name, label in core_packages:
        try:
            mod = importlib.import_module(pkg_name)
            version = getattr(mod, "__version__", "installed")
            print(f"      [OK] {label:<28} : v{version}")
            results[pkg_name] = True
        except ImportError:
            print(f"      [PENDING] {label:<24} : Not yet installed")
            results[pkg_name] = False
            missing.append(pkg_name)
            
    if missing:
        print(f"\n      Tip: Install dependencies via: .\\venv\\Scripts\\pip install -r backend/requirements.txt")
        
    return results


def main():
    print("=" * 70)
    print("  Self-Healing Cloud Infrastructure - System Health Check")
    print("=" * 70)
    
    py_ok = check_python_version()
    venv_ok = check_virtualenv()
    dirs_ok = check_directories()
    conf_ok = check_configuration_templates()
    dep_results = check_dependencies()
    
    print("\n" + "=" * 70)
    print("  Summary:")
    print(f"    - Python Version:       {'PASS' if py_ok else 'FAIL'}")
    print(f"    - Virtual Environment:  {'PASS' if venv_ok else 'WARN'}")
    print(f"    - Directory Structure:  {'PASS' if dirs_ok else 'FAIL'}")
    print(f"    - Config Templates:     {'PASS' if conf_ok else 'FAIL'}")
    installed_count = sum(1 for v in dep_results.values() if v)
    print(f"    - Core Dependencies:    {installed_count}/{len(dep_results)} Installed")
    print("=" * 70)
    
    if py_ok and dirs_ok and conf_ok:
        print("[SUCCESS] Phase 1 Environment Initialization Verified!\n")
        return 0
    else:
        print("[ERROR] Environment setup incomplete. Please resolve issues above.\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
