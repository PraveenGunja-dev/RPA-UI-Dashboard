import pandas as pd
import sys
import os

if len(sys.argv) > 1:
    file_path = sys.argv[1]
else:
    file_path = "d:/Adani_projects/RPA_Dashboard/data/Updated RPA.xlsx"

print(f"Checking file: {file_path}")
if not os.path.exists(file_path):
    print("File does not exist!")
    sys.exit(1)

print("Attempting read_excel with openpyxl...")
try:
    df = pd.read_excel(file_path, engine='openpyxl')
    print("Success with read_excel!")
    print("Columns:", df.columns.tolist())
    print("First row:", df.iloc[0].to_dict())
    sys.exit(0)
except Exception as e:
    print(f"read_excel failed: {e}")

print("Attempting read_csv...")
try:
    df = pd.read_csv(file_path)
    print("Success with read_csv!")
    print("Columns:", df.columns.tolist())
    print("First row:", df.iloc[0].to_dict())
    sys.exit(0)
except Exception as e:
    print(f"read_csv failed: {e}")

print("All attempts failed.")
