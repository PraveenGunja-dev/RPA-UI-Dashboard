import os
import requests
from dotenv import load_dotenv

load_dotenv("backend/.env")
base_url = os.environ.get("AA_BASE_URL")
username = os.environ.get("AA_USERNAME")
password = os.environ.get("AA_PASSWORD")
api_key = os.environ.get("AA_API_KEY")

url = f"{base_url}/v2/authentication"

def test_auth(payload, label):
    print(f"\n--- Testing: {label} ---")
    print(f"Payload keys: {list(payload.keys())}")
    try:
        resp = requests.post(url, json=payload, timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print("SUCCESS")
        else:
            print(f"Failed: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

# 1. Original (password + apikey lowercase)
test_auth({
    "username": username,
    "password": password,
    "apikey": api_key,
    "multipleLogin": False,
}, "Original from aa_service.py")

# 2. apiKey camelCase
test_auth({
    "username": username,
    "apiKey": api_key,
}, "Only username + apiKey (camelCase)")

# 3. apikey lowercase
test_auth({
    "username": username,
    "apikey": api_key,
}, "Only username + apikey (lowercase)")

# 4. Only password
test_auth({
    "username": username,
    "password": password,
}, "Only username + password")

