from fastapi.testclient import TestClient
from main import app
import sys

client = TestClient(app)

try:
    print("Sending request to /api/bots")
    response = client.get("/api/bots?limit=5")
    print(f"Status: {response.status_code}")
    if response.status_code != 200:
        print("Response text:", response.text)
    else:
        print("Success!")
        print(response.json()[0])
except Exception as e:
    print(f"Exception: {e}")
    import traceback
    traceback.print_exc()
