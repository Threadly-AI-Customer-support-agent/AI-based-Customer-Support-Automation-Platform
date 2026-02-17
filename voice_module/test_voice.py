import requests
import os

# URL of your local API
url = "http://127.0.0.1:8000/transcribe/"

# 1. Create a dummy audio file for testing if one doesn't exist
test_filename = "sample.mp3"

if not os.path.exists(test_filename):
    print(f"⚠️ Warning: '{test_filename}' not found.")
    print("Please place a real audio file named 'sample.mp3' in this folder to test properly.")
    with open(test_filename, "w") as f:
        f.write("This is not real audio")

# 2. Send the file to the API
try:
    print(f"Sending '{test_filename}' to server...")
    with open(test_filename, "rb") as f:
        files = {"file": f}
        response = requests.post(url, files=files)

    # 3. Print the result
    print("\n--- SERVER RESPONSE ---")
    if response.status_code == 200:
        print(response.json())
    else:
        print(f"Error {response.status_code}: {response.text}")

except Exception as e:
    print(f"Connection Error: {e}")
    print("Make sure the server is running (python main.py)")