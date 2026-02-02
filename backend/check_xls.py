import pandas as pd
import sys

file_path = "d:/Adani_projects/RPA_Dashboard/data/Updated_RPAList_with_Description 1 1 (1).xlsx"

print(f"Attempting to read as .xls (xlrd): {file_path}")
try:
    # Force engine='xlrd' even if extension is xlsx
    df = pd.read_excel(file_path, engine='xlrd')
    print("Success with xlrd!")
    print("Columns:", df.columns.tolist())
    sys.exit(0)
except Exception as e:
    print(f"xlrd failed: {e}")
    sys.exit(1)
