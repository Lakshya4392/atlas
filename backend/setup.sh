#!/bin/bash

# Alta Daily Backend Setup Script

echo "🚀 Setting up Alta Daily Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if MongoDB is running (optional for local development)
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB not found locally. Make sure to set up MongoDB Atlas or local MongoDB."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual configuration values!"
fi

# Build the project
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Backend setup complete!"
echo ""
echo "🚀 To start development server:"
echo "   npm run dev"
echo ""
echo "📱 For production:"
echo "   npm run build && npm start"
echo ""
echo "🗄️  Make sure MongoDB is running and .env is configured!"