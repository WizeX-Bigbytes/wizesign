import requests
import json
import os
import base64

API_URL = "http://localhost:8000"

print("1. Generating test SSO token...")
r = requests.post(f"{API_URL}/api/auth/sso/generate-test-token")
sso_token = r.json()["token"]

print("2. Exchanging SSO token for Access Token...")
r = requests.post(f"{API_URL}/api/auth/sso/validate", json={"token": sso_token, "source": "wizeflow"})
access_token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {access_token}"}
print("Login successful.")

print("3. Creating a dummy PDF and uploading it as a template...")
# Create a valid minimum PDF Base64
MINIMAL_PDF_B64 = "JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmogCjwwCiAgL1R5cGUgL1BhZ2VzCiAgL01lZGlhQm94IFsgMCAwIDIwMCAyMDAgXQogIC9Db3VudCAxCiAgL0tpZHMgWyAzIDAgUiBdCj4+CmVuZG9iagoKMyAwIG9iago8PAogIC9UeXBlIC9QYWdlCiAgL1BhcmVudCAyIDAgUgogIC9SZXNvdXJjZXMgPDwKICAgIC9Gb250IDw8CiAgICAgIC9GMSA0IDAgUgogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCgo1IDAgb2JqCjw8IC9MZW5ndGggNDQgPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9GMSAxMiBUZmoKKEhlbGxvLCBXb3JsZCEpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDEwIDEwMDAwIG4gCjAwMDAwMDAwNjggMDAwMDAgbiAKMDAwMDAwMDE2NyAwMDAwMCBuIAowMDAwMDAwMjc0IDAwMDAwIG4gCjAwMDAwMDAzODIgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDc4CiUlRU9GCg=="
payload = {
    "name": "Test Script Template",
    "file_url": "blob:http://localhost:3000/should-be-replaced",
    "file_content": f"data:application/pdf;base64,{MINIMAL_PDF_B64}"
}
r = requests.post(f"{API_URL}/api/templates/", json=payload, headers=headers)
if not r.ok:
    print(f"Failed to create template: {r.text}")
    import sys; sys.exit(1)

t = r.json()
print(f"Created template: {t.get('name')}")
print(f"File URL: {t.get('file_url')}")
print(f"File Path: {t.get('file_path')}")

if t.get('file_url') and not t['file_url'].startswith('blob:'):
    print(f"\n4. Testing download of {t['file_url']}...")
    download_url = f"{API_URL}{t['file_url']}"
    r = requests.get(download_url, headers=headers)
    print(f"Download status: {r.status_code}")
    if r.ok:
        print(f"Downloaded {len(r.content)} bytes of PDF")
        
        # Test updating the template as well
        print("\n5. Testing updating the template...")
        update_payload = {
            "name": "Test Script Template Updated",
            "file_url": "blob:http://localhost:3000/another-blob-that-should-be-ignored",
            "category": "MARKETING"
        }
        r = requests.patch(f"{API_URL}/api/templates/{t['id']}", json=update_payload, headers=headers)
        if r.ok:
            updated_t = r.json()
            print(f"Updated File URL: {updated_t.get('file_url')}")
            if not updated_t['file_url'].startswith('blob:'):
                print("SUCCESS: Blob URL was ignored during update!")
            else:
                print("FAILURE: Blob URL overwrote the backend URL during update")
        else:
            print(f"Update failed: {r.text}")
    else:
        print(f"Error: {r.text}")
else:
    print("\nFAILURE: Backend URL was not generated!")
