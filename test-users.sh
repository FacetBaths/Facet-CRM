# Create Test Users - Facet CRM

# Run these curl commands with the server running on localhost:3000

## 1. Sales Rep
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWM0NWM1MjYyNjAwOTg2NWQyMmFlMWEiLCJpYXQiOjE3NzQ4MDk1MzgsImV4cCI6MTc3NTQxNDMzOH0.my1XxrLU5OhBLOfx5k8NwtRDYxNW6gO_sKfhXsYcc4UYOUR_ADMIN_TOKEN_HERE" \
  -d '{
    "firstName": "Sales",
    "lastName": "Rep",
    "email": "sales@facetrenovations.us",
    "password": "Sales!",
    "phone": "1234567890",
    "roles": ["sales"]
  }'
```

## 2. BDC Agent
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
  -d '{
    "firstName": "BDC",
    "lastName": "Agent",
    "email": "bdc@facetrenovations.us",
    "password": "BDCagent!",
    "phone": "0987654321",
    "roles": ["bdc"]
  }'
```

## 3. Warehouse Manager
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWM0NWM1MjYyNjAwOTg2NWQyMmFlMWEiLCJpYXQiOjE3NzQ4MDk1MzgsImV4cCI6MTc3NTQxNDMzOH0.my1XxrLU5OhBLOfx5k8NwtRDYxNW6gO_sKfhXsYcc4U" \
  -d '{
    "firstName": "Warehouse",
    "lastName": "Manager",
    "email": "warehouse@facetrenovations.us",
    "password": "Warehouse!",
    "phone": "1111111111",
    "roles": ["warehouse"]
  }'
```

## 4. Hybrid: BDC + Sales
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWM0NWM1MjYyNjAwOTg2NWQyMmFlMWEiLCJpYXQiOjE3NzQ4MDk1MzgsImV4cCI6MTc3NTQxNDMzOH0.my1XxrLU5OhBLOfx5k8NwtRDYxNW6gO_sKfhXsYcc4U" \
  -d '{
    "firstName": "BDC",
    "lastName": "Sales",
    "email": "bdcsales@facetrenovations.us",
    "password": "Hybrid!123",
    "phone": "2222222222",
    "roles": ["bdc", "sales"]
  }'
```

## 5. Hybrid: Warehouse + Sales
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWM0NWM1MjYyNjAwOTg2NWQyMmFlMWEiLCJpYXQiOjE3NzQ4MDk1MzgsImV4cCI6MTc3NTQxNDMzOH0.my1XxrLU5OhBLOfx5k8NwtRDYxNW6gO_sKfhXsYcc4U" \
  -d '{
    "firstName": "Warehouse",
    "lastName": "Sales",
    "email": "warehousesales@facetrenovations.us",
    "password": "Hybrid!123",
    "phone": "3333333333",
    "roles": ["warehouse", "sales"]
  }'
```

## 6. Production Manager
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWM0NWM1MjYyNjAwOTg2NWQyMmFlMWEiLCJpYXQiOjE3NzQ4MDk1MzgsImV4cCI6MTc3NTQxNDMzOH0.my1XxrLU5OhBLOfx5k8NwtRDYxNW6gO_sKfhXsYcc4U" \
  -d '{
    "firstName": "Production",
    "lastName": "Manager",
    "email": "production@facetrenovations.us",
    "password": "Production!",
    "phone": "4444444444",
    "roles": ["production"]
  }'
```

## 7. Contractor
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWM0NWM1MjYyNjAwOTg2NWQyMmFlMWEiLCJpYXQiOjE3NzQ4MDk1MzgsImV4cCI6MTc3NTQxNDMzOH0.my1XxrLU5OhBLOfx5k8NwtRDYxNW6gO_sKfhXsYcc4U" \
  -d '{
    "firstName": "Contractor",
    "lastName": "One",
    "email": "contractor@facetrenovations.us",
    "password": "Contractor!",
    "phone": "5555555555",
    "roles": ["contractor"]
  }'
```

## Notes:
# - Replace `YOUR_ADMIN_TOKEN_HERE` with your actual JWT token
# - Get your token from browser localStorage after logging in as admin
# - Or create a simple script to run these
# - Emails have typos fixed (facetrenovaitons.us → facetrenovations.us)