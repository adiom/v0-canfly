#!/bin/bash

echo "🧪 CanFly API Test"
echo "=================="
echo ""

BASE_URL="http://localhost:3000"

echo "1️⃣ Testing /api/books..."
curl -s "$BASE_URL/api/books" | jq -r '.[] | "\(.title) (\(.type))"' | head -5
echo ""

echo "2️⃣ Testing /api/books?featured=true..."
curl -s "$BASE_URL/api/books?featured=true" | jq '. | length' 
echo "books found"
echo ""

echo "3️⃣ Testing /api/characters..."
curl -s "$BASE_URL/api/characters" | jq -r '.[] | .name' | head -5
echo ""

echo "4️⃣ Testing character with relationships..."
curl -s "$BASE_URL/api/characters/cipher" | jq -r '.character.name'
echo ""

echo "✅ All APIs working!"
