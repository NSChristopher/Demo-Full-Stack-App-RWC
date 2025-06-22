#!/bin/bash

# Test script for the Beauty Shop API

echo "Testing Beauty Shop API endpoints..."

# Start backend server in background
cd backend
npm start &
BACKEND_PID=$!

# Wait for server to start
sleep 5

echo "Backend started with PID: $BACKEND_PID"

# Test health check
echo "Testing health check..."
curl -s http://localhost:5000/api/health | head -1

# Test product categories endpoint
echo "Testing product categories..."
curl -s http://localhost:5000/api/products/categories | head -1

# Test products endpoint
echo "Testing products endpoint..."
curl -s http://localhost:5000/api/products | head -1

# Clean up - stop backend
kill $BACKEND_PID

echo "Test completed"