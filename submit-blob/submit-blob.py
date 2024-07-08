import requests
import json

CELESTIA_NODE_AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJwdWJsaWMiLCJyZWFkIiwid3JpdGUiLCJhZG1pbiJdfQ.34tSih2qt9eH00DQzicqtb1AHkmH2RTZAWWLlgctvc4"
COMMITMENT="wqJfJgA9LZXHsaFvLfQb4yz4XnH7P1sQfFptthmR6cQ="
NAMESPACE="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQIDBAU="

def load_data_from_file(filepath):
    with open(filepath, 'r') as file:
        return file.read().strip()

blob_base64_filepath = './bd64'
blob_base64 = load_data_from_file(blob_base64_filepath)

url = "http://127.0.0.1:26658"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {CELESTIA_NODE_AUTH_TOKEN}"
}
payload = {
    "id": 1,
    "jsonrpc": "2.0",
    "method": "blob.Submit",
    "params": [
        [
            {
                "namespace": "{NAMESPACE}",
                "data": "{blob_base64}",
                "share_version": 0,
                "commitment": "{COMMITMENT}"
            }
        ],
        0.1
    ]
}

print(json.dumps(payload))

response = requests.post(url, headers=headers, data=json.dumps(payload))

print(response.status_code)
print(response.json())
