import requests
import json

try:
    # 1. Check get_departments - Expect only ONE "Business Transformation"
    r = requests.get('http://127.0.0.1:8000/api/departments')
    depts = r.json()
    
    bt_entries = [d for d in depts if d['name'] == 'Business Transformation' or d['name'] == 'BT']
    
    print(f"Total 'Business Transformation' entries in list: {len(bt_entries)}")
    if len(bt_entries) == 1:
        print("SUCCESS: Merged into single entry.")
        print(f"Total Bots in Merged Entry: {bt_entries[0]['total_bots']}")
    else:
        print("FAIL: Duplicates still exist.")
        
    if bt_entries:
        merged_dept = bt_entries[0]
        # 2. Check get_department_bots for this ID
        dept_id = merged_dept['id']
        r = requests.get(f'http://127.0.0.1:8000/api/departments/{dept_id}/bots')
        bots = r.json()
        print(f"Total Bots fetched from Detail API: {len(bots)}")
        
        # Check active status match
        deployed_count_summary = merged_dept['deployed_bots']
        
        # Calculate active from detail list (using the new criteria)
        active_list = [b for b in bots if 'active' in (b['status'] or '').lower() or 'deployed' in (b['status'] or '').lower() or 'live' in (b['status'] or '').lower()]
        print(f"Summary Deployed Count: {deployed_count_summary}")
        print(f"List Calculated Active: {len(active_list)}")
        
        if deployed_count_summary == len(active_list):
             print("SUCCESS: Counts match and include Active status.")
        else:
             print("FAIL: Mismatch in counts.")

except Exception as e:
    print(f"Error: {e}")
