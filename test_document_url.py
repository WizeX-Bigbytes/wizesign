import requests
import json
import base64

API_URL = "http://localhost:8000"

print("1. Logging in with SSO...")
r = requests.post(f"{API_URL}/api/auth/sso/generate-test-token")
sso_token = r.json()["token"]

r = requests.post(f"{API_URL}/api/auth/sso/validate", json={"token": sso_token, "source": "wizeflow"})
access_token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {access_token}"}
print("Login successful.")

print("2. Creating a blank PDF document...")
MINIMAL_PDF_B64 = "JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmogCjwwCiAgL1R5cGUgL1BhZ2VzCiAgL01lZGlhQm94IFsgMCAwIDIwMCAyMDAgXQogIC9Db3VudCAxCiAgL0tpZHMgWyAzIDAgUiBdCj4+CmVuZG9iagoKMyAwIG9iago8PAogIC9UeXBlIC9QYWdlCiAgL1BhcmVudCAyIDAgUgogIC9SZXNvdXJjZXMgPDwKICAgIC9Gb250IDw8CiAgICAgIC9GMSA0IDAgUgogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCgo1IDAgb2JqCjw8IC9MZW5ndGggNDQgPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9GMSAxMiBUZmoKKEhlbGxvLCBXb3JsZCEpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDEwIDEwMDAwIG4gCjAwMDAwMDAwNjggMDAwMDAgbiAKMDAwMDAwMDE2NyAwMDAwMCBuIAowMDAwMDAwMjc0IDAwMDAwIG4gCjAwMDAwMDAzODIgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDc4CiUlRU9GCg=="
payload = {
    "procedure_name": "Test Procedure",
    "doctor_name": "Dr. Smith",
    "clinic_name": "Test Clinic",
    "patient": {
        "full_name": "John Doe",
        "email": "johndoe@example.com",
        "phone": "+1234567890",
        "dob": "1990-01-01"
    },
    "file_url": "blob:http://localhost:3000/should-be-replaced",
    "file_content": f"data:application/pdf;base64,{MINIMAL_PDF_B64}"
}
r = requests.post(f"{API_URL}/api/documents/create", json=payload, headers=headers)
if not r.ok:
    print(f"Failed to create document: {r.text}")
    import sys; sys.exit(1)

doc = r.json()
print(f"Created document ID: {doc.get('id')}")
print(f"File URL: {doc.get('file_url')}")
print(f"File Path: {doc.get('file_path')}")

if doc.get('file_url') and not doc['file_url'].startswith('blob:'):
    print(f"\n3. Testing download of {doc['file_url']}...")
    download_url = f"{API_URL}{doc['file_url']}"
    r = requests.get(download_url, headers=headers)
    print(f"Download status: {r.status_code}")
    if r.ok:
        print(f"Downloaded {len(r.content)} bytes of PDF")
        if len(r.content) > 0:
            print("SUCCESS: Original document PDF retrieved successfully!")
    else:
        print(f"Error: {r.text}")
else:
    print("\nFAILURE: Backend URL was not generated!")
