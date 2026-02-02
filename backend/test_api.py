import requests
import json

try:
    response = requests.get('http://localhost:8000/api/bots?limit=5')
    if response.status_code == 200:
        data = response.json()
        print(f"Fetched {len(data)} records")
        if len(data) > 0:
            print("First record:")
            print(json.dumps(data[0], indent=2))
            
            if 'bu_name' in data[0]:
                 print(f"✅ bu_name is present: {data[0]['bu_name']}")
            else:
                 print("❌ bu_name is MISSING")
    else:
        print(f"Error: {response.status_code}")
except Exception as e:
    print(f"Failed to connect: {e}")
