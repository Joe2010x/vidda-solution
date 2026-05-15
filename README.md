# Vidda Solutions - Compliance Training Generator

An AI-powered compliance training plan generation system for Anti-Money Laundering (AML) and Counter-Terrorist Financing (CTF) regulations.

## Overview

Vidda Solutions helps organizations generate customized compliance training plans based on specific job roles and responsibilities. The system uses Google's Gemini AI model (via OpenRouter) to analyze job descriptions, identify regulatory risks, and create targeted training programs.

## Features

### Core Capabilities

- **Role-Based Training Plans**: Generate compliance training plans based on predefined roles or custom job descriptions
- **AI-Powered Analysis**: LLM-powered risk assessment and training plan optimization
- **Custom Job Description Parsing**: Paste any job description and let the AI extract tasks, assess risks, and generate a training plan
- **Regulatory Compliance**: Aligned with AML/CFT (Anti-Money Laundering / Combating the Financing of Terrorism) regulations
- **Human Review Workflow**: Built-in review and approval process for training plans
- **LMS Integration**: Generate assignments for Learning Management Systems

### Key Components

1. **Role Selector**: Choose from predefined roles with established risk profiles
2. **Custom Job Description Input**: Enter any job description for AI analysis
3. **Risk Analysis**: AI identifies relevant AML/CFT risk categories with confidence scores
4. **Training Plan Generator**: Creates optimized training plans with learning objectives
5. **Validation System**: Comprehensive quality assessment with scores and recommendations
6. **Human Review**: Review, approve, reject, or request revisions for training plans

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenRouter API key (get one at [openrouter.ai](https://openrouter.ai/))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ViddaSolution
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Edit `.env.local` and add your OpenRouter API key:
```env
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=google/gemini-2.0-flash-lite
NEXT_PUBLIC_APP_NAME="Vidda Solutions"
NEXT_PUBLIC_APP_VERSION="2.0.0-LLM"
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Usage

#### Using Predefined Roles

1. Select the "Select Role" tab
2. Choose a role from the list (e.g., "Compliance Officer", "Financial Analyst")
3. The system automatically generates a compliance training plan

#### Using Custom Job Descriptions

1. Select the "Custom Input" tab
2. Paste a job description into the textarea (or click "Load sample" for an example)
3. Click "Generate Training Plan"
4. The AI will:
   - Extract the job title and department
   - Identify key tasks and responsibilities
   - Assess the AML/CFT risk level
   - Generate a customized training plan

### Available Roles (Predefined)

The system includes several predefined roles across different departments and risk levels. Each role has:
- Job title and description
- Department assignment
- List of key tasks
- Risk level (low, medium, high)

## Project Structure

```
ViddaSolution/
├── src/
│   ├── app/
│   │   ├── api/llm/           # LLM API endpoints
│   │   │   ├── analyze-risk/  # Risk analysis endpoint
│   │   │   ├── generate-plan/ # Training plan generation endpoint
│   │   │   ├── validate-plan/ # Plan validation endpoint
│   │   │   └── parse-job-description/ # Job description parsing endpoint (NEW)
│   │   ├── page.tsx           # Main application page
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── RoleSelector.tsx   # Role selection component
│   │   ├── JobDescriptionInput.tsx # Custom job description input (NEW)
│   │   ├── TrainingPlan.tsx   # Training plan display
│   │   ├── ValidationScore.tsx # Validation scores display
│   │   ├── HumanReview.tsx    # Review workflow component
│   │   └── LMSAssignment.tsx  # LMS assignment component
│   ├── lib/
│   │   ├── llm/               # LLM integration module
│   │   │   ├── client.ts      # OpenRouter API client
│   │   │   ├── prompts.ts     # Prompt templates
│   │   │   ├── riskAnalyzer.ts # Risk analysis logic
│   │   │   ├── planGenerator.ts # Training plan generation
│   │   │   ├── validator.ts   # Validation logic
│   │   │   └── cache.ts       # Response caching
│   │   ├── retrieval.ts       # Requirements retrieval
│   │   ├── trainingGenerator.ts # Training plan generator
│   │   └── validation.ts      # Validation scoring
│   ├── data/
│   │   ├── roles.ts           # Predefined roles data
│   │   └── amirRequirements.ts # Regulatory requirements
│   └── types/
│       └── index.ts           # TypeScript type definitions
├── .env.example               # Environment variables template
├── .env.local                 # Local environment configuration
├── LLM_INTEGRATION.md         # Detailed LLM integration guide
└── README.md                  # This file
```

## API Endpoints

### LLM-Powered Endpoints

- `POST /api/llm/analyze-risk` - Analyze a role for AML/CFT risk categories
- `POST /api/llm/generate-plan` - Generate a training plan with LLM enhancement
- `POST /api/llm/validate-plan` - Validate a training plan with qualitative analysis
- `POST /api/llm/parse-job-description` - Parse raw job description text into structured role data (NEW)

### Example: Parse Job Description

```typescript
const response = await fetch('/api/llm/parse-job-description', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jobDescription: 'Senior Analyst responsible for transaction monitoring...'
  })
});

const { success, role } = await response.json();
// role contains: name, department, description, tasks, riskLevel
```

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI/LLM**: Google Gemini via OpenRouter API
- **State Management**: React Hooks (useState, useEffect)
- **Component Architecture**: Modular React components

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key | Yes |
| `OPENROUTER_MODEL` | LLM model to use | No (default: `google/gemini-2.0-flash-lite`) |
| `NEXT_PUBLIC_APP_NAME` | Application name | No |
| `NEXT_PUBLIC_APP_VERSION` | Application version | No |

### Model Selection

The system supports various Google Gemini models via OpenRouter:

- `google/gemini-2.0-flash-lite` (default) - Fast, cost-effective
- `google/gemini-pro` - Standard performance
- `google/gemini-1.5-pro` - Most capable, higher cost

## LLM Integration

For detailed information about the LLM integration, including prompt engineering, caching, error handling, and best practices, see [LLM_INTEGRATION.md](./LLM_INTEGRATION.md).

### Key LLM Features

- **Intelligent Risk Analysis**: Semantic understanding of job tasks and AML/CFT implications
- **Confidence Scoring**: Each identified risk includes a confidence score (0-100)
- **Fallback Mechanisms**: Automatic fallback to rule-based algorithms if LLM fails
- **Response Caching**: Reduces API calls and improves performance
- **Cost Optimization**: Uses entry-level Gemini model for efficiency

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Testing

The project uses a robust testing strategy with fallback mechanisms. Even if the LLM service is unavailable, the system falls back to rule-based algorithms to ensure functionality.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software developed for Vidda Solutions. All rights reserved.

## Support

For technical support or questions:

1. Review the [LLM Integration Guide](./LLM_INTEGRATION.md) for detailed LLM documentation
2. Check the [OpenRouter Documentation](https://openrouter.ai/docs)
3. Review the [Google Gemini API Documentation](https://ai.google.dev/docs)

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- AI powered by [Google Gemini](https://ai.google.dev/) via [OpenRouter](https://openrouter.ai/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

**Vidda Solutions** - Compliance Training Generator MVP | Built for Hackathon 2024