import requests
import jwt

url = "https://tjyrrdhzpslrwkacvhki.supabase.co/auth/v1/.well-known/jwks.json"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqeXJyZGh6cHNscndrYWN2aGtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODI3MjksImV4cCI6MjA5NDg1ODcyOX0.esoIXrbUyiLWpNyTAzz_WRmD6dui--V-OS3lD8kwkLI"
}

res = requests.get(url, headers=headers)
jwks = res.json()
jwk = jwks['keys'][0]

try:
    public_key = jwt.algorithms.ECAlgorithm.from_jwk(jwk)
    print("EC Public Key imported successfully!", type(public_key))
except Exception as e:
    print("Error parsing JWK EC key:", e)
