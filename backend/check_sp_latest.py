import os
from services.sharepoint_service import SharePointService
from datetime import datetime

def main():
    sp_service = SharePointService()
    files = sp_service.list_files()
    
    print(f"Total files in SharePoint folder: {len(files)}")
    
    # Sort files by modification date descending
    files_sorted = sorted(files, key=lambda x: x['TimeLastModified'], reverse=True)
    
    print("\nTop 15 Most Recently Modified Files in SharePoint:")
    for f in files_sorted[:15]:
        print(f" - {f['Name']} (Modified: {f['TimeLastModified']})")

if __name__ == "__main__":
    main()
