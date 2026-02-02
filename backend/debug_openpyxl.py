import openpyxl
import os
import sys

path = r"d:\Adani_projects\RPA_Dashboard\data\Updated_RPAList_with_Description 1 1 (1).xlsx"

if not os.path.exists(path):
    print("File not found")
    sys.exit(1)

print(f"File size: {os.path.getsize(path)}")

try:
    wb = openpyxl.load_workbook(path, data_only=True)
    print("Success loading workbook")
    print("Sheets:", wb.sheetnames)
except Exception as e:
    print(f"Failed: {e}")
