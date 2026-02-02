import requests
import json

# Find the ID for "BT" or "Business Transformation" department
try:
    # First list departments to get ID
    r = requests.get('http://127.0.0.1:8000/api/departments')
    depts = r.json()
    bt_dept = next((d for d in depts if d['name'] == 'Business Transformation' or d['name'] == 'BT'), None)
    
    if not bt_dept:
        print("Department 'Business Transformation' or 'BT' not found via API.")
        exit()
        
    print(f"Found Department: {bt_dept['name']} (ID: {bt_dept['id']})")
    
    # Get bots for this department
    r = requests.get(f'http://127.0.0.1:8000/api/departments/{bt_dept["id"]}/bots')
    bots = r.json()
    
    print(f"Total Bots fetched: {len(bots)}")
    
    active_bots = [b for b in bots if 'active' in (b['status'] or '').lower() or 'deployed' in (b['status'] or '').lower()]
    print(f"Active/Deployed Bots: {len(active_bots)}")
    
    # Check hours
    bots_with_hours = [b for b in bots if (b['hours_till_now'] or 0) > 0]
    print(f"Bots with hours_till_now > 0: {len(bots_with_hours)}")
    
    if len(bots_with_hours) == 0 and len(bots) > 0:
        print("\nSAMPLE BOT DATA (First 10):")
        for b in bots[:10]:
            print(f"Name: {b['bot_name']}")
            print(f"Status: {b['status']}")
            print(f"Deployed Date: {b['deployed_date']}")
            print(f"Monthly Hours: {b['hours_saved_monthly']}")
            print(f"Hours Till Now: {b['hours_till_now']}")
            print("-" * 20)
            
except Exception as e:
    print(f"Error: {e}")
