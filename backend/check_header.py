import sys

path = r"d:\Adani_projects\RPA_Dashboard\data\Updated_RPAList_with_Description 1 1 (1).xlsx"

try:
    with open(path, "rb") as f:
        header = f.read(16)
        print(f"Header hex: {header.hex()}")
        # Check for PK (Zip/XLSX)
        if header.startswith(b'PK'):
            print("Signature: Zip/XLSX")
        # Check for OLE (XLS)
        elif header.hex().upper().startswith("D0CF11E0"):
            print("Signature: OLE/XLS")
        else:
            print("Signature: Unknown")
except Exception as e:
    print(f"Error: {e}")
