import pandas as pd
import sys

try:
    df = pd.read_excel(r'd:\Adani_projects\RPA_Dashboard\data\Updated RPA.xlsx')
    print("Columns found:")
    for col in df.columns:
        print(f" - {col}")
    
    # Check for SPOC specific columns
    spoc_cols = [c for c in df.columns if 'spoc' in c.lower()]
    print(f"\nPotential SPOC columns: {spoc_cols}")
    
except Exception as e:
    print(f"Error: {e}")
