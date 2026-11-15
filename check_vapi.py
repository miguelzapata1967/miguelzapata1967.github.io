import os
import requests
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("VAPI_API_KEY")

r = requests.get(
    "https://api.vapi.ai/assistant",
    headers={"Authorization": f"Bearer {key}"},
)
print("Status:", r.status_code)
for a in r.json():
    print(a["name"], "-", a["id"])