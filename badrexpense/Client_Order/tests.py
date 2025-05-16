import requests

def test_login():
    url = "http://127.0.0.1:8000/auth/api/login/"
    data = {
        "username": "vinci",
        "password": "BAdr1234"
    }
    
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    print(f"Sending request to: {url}")
    print(f"With data: {data}")
    
    try:
        response = requests.post(url, json=data, headers=headers)
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            print(f"Success response: {response.json()}")
        else:
            print(f"Error response: {response.text}")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_login()