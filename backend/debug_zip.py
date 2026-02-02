import zipfile
import sys
import os

path = r"d:\Adani_projects\RPA_Dashboard\data\Updated_RPAList_with_Description 1 1 (1).xlsx"

print(f"Checking zip integrity: {path}")

try:
    with zipfile.ZipFile(path, 'r') as zip_ref:
        print("Zip validation: Success")
        print("Files in archive:")
        for name in zip_ref.namelist():
            print(f" - {name}")
except zipfile.BadZipFile:
    print("Error: BadZipFile - The file is corrupted")
except Exception as e:
    print(f"Error: {e}")
