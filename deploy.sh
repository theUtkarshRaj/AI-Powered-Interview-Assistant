#!/bin/bash

# AI Interview Assistant Deployment Script

echo "🚀 Starting deployment process..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "📝 Please create .env file with your OpenAI API key:"
    echo "   VITE_OPENAI_API_KEY=your_api_key_here"
    echo ""
    read -p "Do you want to continue without .env? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled. Please create .env file first."
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run linting
echo "🔍 Running linting..."
npm run lint

# Build the project
echo "🏗️  Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "🎉 Your project is ready for deployment!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Push to GitHub: git push origin main"
    echo "2. Deploy to Vercel/Netlify"
    echo "3. Set environment variables in your deployment platform"
    echo "4. Test your live application"
else
    echo "❌ Build failed! Please fix the errors above."
    exit 1
fi
