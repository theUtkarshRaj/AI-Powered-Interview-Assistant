# OpenAI API Setup Guide

## Quick Setup

### 1. Get Your OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in with your OpenAI account
3. Click "Create new secret key"
4. Copy the generated key (starts with `sk-`)

### 2. Set Environment Variable
Create a `.env` file in your project root and add:

```bash
VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 3. Restart Development Server
```bash
npm run dev
```

## Features

### ✅ **AI-Powered Resume Parsing**
- Uses GPT-3.5-turbo for intelligent text analysis
- Better name extraction accuracy
- Confidence scoring for results
- Fallback to regex if AI fails

### ✅ **AI Interview Questions**
- Dynamic question generation based on candidate profile
- Difficulty progression (Easy → Medium → Hard)
- Context-aware follow-up questions
- Keyword-based evaluation

### ✅ **Smart Answer Evaluation**
- AI-powered answer analysis
- Score from 0-100
- Constructive feedback
- Keyword matching

## API Usage

The system uses OpenAI's GPT-3.5-turbo model which is:
- **Cost-effective**: ~$0.002 per 1K tokens
- **Fast**: Quick response times
- **Reliable**: Stable API with good uptime
- **Accurate**: Excellent for text analysis tasks

## Troubleshooting

### Common Issues

1. **API Key Not Found**
   - Ensure `VITE_OPENAI_API_KEY` is set in `.env`
   - Restart the development server
   - Check the key starts with `sk-`

2. **Rate Limits**
   - OpenAI has rate limits based on your plan
   - Free tier: 3 requests per minute
   - Paid tier: Higher limits

3. **Network Issues**
   - System automatically falls back to regex parsing
   - No interruption to user workflow

## Security

- API key is only used client-side for this demo
- In production, use a backend proxy for security
- Never commit API keys to version control

## Cost Estimation

For typical usage:
- Resume parsing: ~$0.001 per resume
- Interview questions: ~$0.002 per question
- Answer evaluation: ~$0.002 per evaluation

**Total cost per interview**: ~$0.01-0.02
