#!/bin/bash
# Create Test Users - Facet CRM
# Usage: ./create-test-users.sh <admin-jwt-token>

if [ -z "$1" ]; then
  echo "Usage: $0 <admin-jwt-token>"
  echo "Get your token from browser localStorage after logging in as admin"
  exit 1
fi

TOKEN="$1"
API_URL="http://localhost:3000/api/users"

echo "Creating test users..."
echo "API: $API_URL"
echo "Token: $(echo "$TOKEN" | cut -c1-20)... (truncated)"
echo ""

# 1. Sales Rep
echo "Creating Sales Rep..."
curl -s --max-time 10 -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "firstName": "Sales",
    "lastName": "Rep",
    "email": "sales@facetrenovations.us",
    "password": "Sales!",
    "phone": "1234567890",
    "roles": ["sales"]
  }' | jq -r '.email // .error // "Created"' && echo " ✓ Sales Rep created" || echo " ✗ Sales Rep failed"

# 2. BDC Agent
echo "Creating BDC Agent..."
curl -s --max-time 10 -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "firstName": "BDC",
    "lastName": "Agent",
    "email": "bdc@facetrenovations.us",
    "password": "BDCagent!",
    "phone": "0987654321",
    "roles": ["bdc"]
  }' | jq -r '.email // .error // "Created"' && echo " ✓ BDC Agent created" || echo " ✗ BDC Agent failed"

# 3. Warehouse Manager
echo "Creating Warehouse Manager..."
curl -s --max-time 10 -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "firstName": "Warehouse",
    "lastName": "Manager",
    "email": "warehouse@facetrenovations.us",
    "password": "Warehouse!",
    "phone": "1111111111",
    "roles": ["warehouse"]
  }' | jq -r '.email // .error // "Created"' && echo " ✓ Warehouse Manager created" || echo " ✗ Warehouse Manager failed"

# 4. Hybrid: BDC + Sales
echo "Creating Hybrid BDC+Sales..."
curl -s --max-time 10 -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "firstName": "BDC",
    "lastName": "Sales",
    "email": "bdcsales@facetrenovations.us",
    "password": "Hybrid!123",
    "phone": "2222222222",
    "roles": ["bdc", "sales"]
  }' | jq -r '.email // .error // "Created"' && echo " ✓ Hybrid BDC+Sales created" || echo " ✗ Hybrid BDC+Sales failed"

# 5. Hybrid: Warehouse + Sales
echo "Creating Hybrid Warehouse+Sales..."
curl -s --max-time 10 -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "firstName": "Warehouse",
    "lastName": "Sales",
    "email": "warehousesales@facetrenovations.us",
    "password": "Hybrid!123",
    "phone": "3333333333",
    "roles": ["warehouse", "sales"]
  }' | jq -r '.email // .error // "Created"' && echo " ✓ Hybrid Warehouse+Sales created" || echo " ✗ Hybrid Warehouse+Sales failed"

# 6. Production Manager
echo "Creating Production Manager..."
curl -s --max-time 10 -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "firstName": "Production",
    "lastName": "Manager",
    "email": "production@facetrenovations.us",
    "password": "Production!",
    "phone": "4444444444",
    "roles": ["production"]
  }' | jq -r '.email // .error // "Created"' && echo " ✓ Production Manager created" || echo " ✗ Production Manager failed"

# 7. Contractor
echo "Creating Contractor..."
curl -s --max-time 10 -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "firstName": "Contractor",
    "lastName": "One",
    "email": "contractor@facetrenovations.us",
    "password": "Contractor!",
    "phone": "5555555555",
    "roles": ["contractor"]
  }' | jq -r '.email // .error // "Created"' && echo " ✓ Contractor created" || echo " ✗ Contractor failed"

echo ""
echo "Done!"
