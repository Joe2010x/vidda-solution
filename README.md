# Vidda Solutions - Compliance Training Generator

An AI-powered compliance training plan generation system for Anti-Money Laundering (AML) and Counter-Terrorist Financing (CTF) regulations.

## Overview

Vidda Solutions helps organizations generate customized compliance training plans based on specific job roles and responsibilities. The system uses Google's Gemini AI model (via OpenRouter) to analyze job descriptions, identify regulatory risks, and create targeted training programs — including precise citations to the EU AML/CFT Regulation retrieved via a hybrid RAG pipeline.

## Features

### Core Capabilities

- **Role-Based Training Plans**: Generate compliance training plans based on predefined roles or custom job descriptions
- **AI-Powered Analysis**: LLM-powered risk assessment and training plan optimization
- **Custom Job Description Parsing**: Paste any job description and let the AI extract tasks, assess risks, and generate a training plan
- **Regulatory Compliance**: Aligned with AML/CFT (Anti-Money Laundering / Combating the Financing of Terrorism) regulations
- **Regulatory Basis Enrichment**: After risk categories are identified, each is enriched with specific EU AML Regulation article citations retrieved via hybrid BM25 + dense-vector RAG retrieval
- **Human Review Workflow**: Built-in review and approval process for training plans
- **LMS Integration**: Generate assignments for Learning Management Systems

### Enhanced Training Plan Generation

- **Full Traceability**: Each training module links back to specific tasks, competencies, and regulatory requirements
- **Explainability**: `whyIncluded` field explains why each module is assigned to the training plan
- **Activity-Level Q1-Q4 Organization**: Each module is broken down into learning activities distributed across quarters:
  - **Q1 (Foundation)**: Knowledge-based activities (regulatory frameworks, policies, procedures)
  - **Q2 (Application)**: Skills-based activities (practical exercises, workshops)
  - **Q3 (Deepening)**: Judgement-based activities (scenario labs, decision-making practice)
  - **Q4 (Embedding)**: Assessment activities (QA review, coaching, competency validation)
- **Smart Quarter Assignment**: Competencies with keywords like "coach", "review", "feedback", "assessment", "audit", "QA" are automatically assigned to Q4
- **Quality Scoring**: Comprehensive quality metrics including risk coverage, competency coverage, and regulatory traceability
- **Enhanced Priority Calculation**: Priority scoring based on task risk level + competency type

### Key Components

1. **Role Selector**: Choose from predefined roles with established risk profiles
2. **Custom Job Description Input**: Enter any job description for AI analysis
3. **Risk Analysis**: AI identifies relevant AML/CFT risk categories with confidence scores
4. **Requirements Review**: Review and approve mapped regulatory requirements
5. **Competency Review**: Review normalized competencies with full traceability
6. **Training Plan Generator**: Creates optimized training plans with learning objectives and quarterly organization
7. **Validation System**: Comprehensive quality assessment with scores and recommendations
8. **Human Review**: Review, approve, reject, or request revisions for training plans

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenRouter API key (get one at [openrouter.ai](https://openrouter.ai/)) — required for both LLM inference and building the embedding corpus. Without a key, the system falls back to BM25-only retrieval (no dense embeddings).

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd NerveHackathon
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
OPENROUTER_API_KEY=your_api_key_here   # used for LLM inference AND corpus embeddings
OPENROUTER_MODEL=google/gemini-3.1-flash-lite
NEXT_PUBLIC_APP_NAME="Vidda Solutions"
NEXT_PUBLIC_APP_VERSION="2.0.0-LLM"
```

5. Start the development server:
```bash
npm run dev
```

The `predev` hook runs `scripts/ensure_corpus.js` automatically. On first run it will build `src/data/AMLCFT_Regulation_corpus.json` from `documents/AMLCFT_Regulation.json` (requires `OPENROUTER_API_KEY` for dense embeddings; omit the key to build a BM25-only corpus). Subsequent starts skip the build if the corpus is already up to date.

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
   - Map tasks to regulatory requirements
   - Normalize competencies from the requirements
   - Generate a customized training plan with quarterly organization
   - Enrich each identified risk category with EU AML Regulation citations

### Available Roles (Predefined)

The system includes several predefined roles across different departments and risk levels. Each role has:
- Job title and description
- Department assignment
- List of key tasks
- Risk level (low, medium, high)

## Project Structure

```
NerveHackathon/
├── documents/
│   └── AMLCFT_Regulation.json     # Source EU AML/CFT Regulation (input to corpus builder)
├── scripts/
│   ├── build_corpus.js            # Offline corpus builder (embed + BM25 pre-compute)
│   └── ensure_corpus.js           # npm predev/prestart hook — builds corpus if missing/stale
├── src/
│   ├── app/
│   │   ├── api/llm/               # LLM API endpoints
│   │   │   ├── analyze-risk/      # Risk analysis endpoint
│   │   │   ├── generate-plan/     # Training plan generation endpoint
│   │   │   ├── validate-plan/     # Plan validation endpoint
│   │   │   ├── parse-job-description/ # Job description parsing endpoint
│   │   │   └── enrich-risk/       # RAG-powered regulatory citation endpoint
│   │   ├── page.tsx               # Main application page
│   │   └── layout.tsx             # Root layout
│   ├── components/                # React components
│   │   ├── RoleSelector.tsx       # Role selection component
│   │   ├── JobDescriptionInput.tsx # Custom job description input
│   │   ├── TrainingPlan.tsx       # Training plan display (with citation badges)
│   │   ├── ValidationScore.tsx    # Validation scores display
│   │   ├── HumanReview.tsx        # Review workflow component
│   │   ├── CompetencyReview.tsx   # Competency review with traceability
│   │   ├── RequirementsReview.tsx # Requirements mapping review
│   │   ├── RiskMappingReview.tsx  # Risk mapping review
│   │   ├── JdReviewEditor.tsx     # JD review editor
│   │   └── LMSAssignment.tsx      # LMS assignment component
│   ├── llm/                       # LLM integration — staged pipeline
│   │   ├── index.ts               # Top-level barrel export
│   │   ├── extraction/            # Job description parsing, risk analysis, prompts
│   │   ├── retrieval/             # Requirements retrieval (rule-based + LLM)
│   │   │   ├── ruleBased.ts       # Rule-based retrieval
│   │   │   ├── competencyNormalizer.ts  # Normalize competencies from mappings
│   │   │   ├── competencyClusterer.ts   # Cluster competencies for module generation
│   │   │   └── index.ts           # Barrel export
│   │   ├── generation/            # Training plan generation
│   │   │   ├── ruleBased.ts       # Enhanced rule-based generator with Q1-Q4 organization
│   │   │   └── index.ts           # Barrel export
│   │   ├── validation/            # Plan validation (rule-based + LLM), prompts
│   │   ├── delivery/              # Per-endpoint handler functions
│   │   └── rag/                   # RAG subsystem
│   │       ├── constants.ts       # BM25 params, RRF k, TOP_K, embedding model
│   │       ├── tokenizer.ts       # Stopword-filtered tokenizer
│   │       ├── sparse.ts          # BM25 scoring
│   │       ├── dense.ts           # Embedding + cosine similarity (cached)
│   │       ├── corpus_registry.ts # Singleton — loads src/data/*_corpus.json
│   │       ├── retriever.ts       # Hybrid retrieval: BM25 + dense → RRF
│   │       ├── prompts.ts         # Enrichment system prompt
│   │       ├── validator.ts       # Citation normalization and hallucination rejection
│   │       └── index.ts           # Barrel export
│   ├── data/
│   │   ├── roles.ts               # Predefined roles data
│   │   ├── jdTemplates.ts         # Job description templates
│   │   ├── amlrRequirements.ts    # Regulatory requirements and training modules
│   │   └── AMLCFT_Regulation_corpus.json  # Generated — do not edit manually
│   └── types/
│       ├── index.ts               # Core TypeScript type definitions
│       ├── retrieval.ts           # Retrieval types: NormalizedCompetency, CompetencyCluster
│       ├── training.ts            # Training types: EnhancedTrainingPlan, TrainingModuleItem
│       ├── audit.ts               # Audit trail types
│       └── rag.ts                 # RAG types: ChildChunk, ParentChunk, Corpus
├── .env.example                   # Environment variables template
├── RAG_INTEGRATION.md             # Detailed RAG subsystem specification
├── LLM_INTEGRATION.md             # LLM integration guide
├── ACTIVITY_LEVEL_IMPLEMENTATION.md  # Activity-level Q1-Q4 training plan documentation
└── README.md                      # This file
```

## API Endpoints

### LLM-Powered Endpoints

- `POST /api/llm/analyze-risk` — Analyze a role for AML/CFT risk categories
- `POST /api/llm/generate-plan` — Generate a training plan with LLM enhancement
- `POST /api/llm/validate-plan` — Validate a training plan with qualitative analysis
- `POST /api/llm/parse-job-description` — Parse raw job description text into structured role data
- `POST /api/llm/enrich-risk` — Retrieve relevant EU AML Regulation paragraphs for a risk category and generate LLM reasoning with validated citations

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

### Example: Enrich Risk Category

```typescript
const response = await fetch('/api/llm/enrich-risk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    riskCategory: 'transaction-monitoring',   // risk slug
    sourceDocument: 'AMLCFT_Regulation'       // optional, this is the default
  })
});

const { success, riskCategory, reasoning, citations, contexts } = await response.json();
// citations: string[] — e.g. ["§ 74 (1) (a)", "§ 83 (2)"]
// contexts: Array<{ full_path: string, text: string }> — full paragraph text for each citation
```

**Status codes:** `200` success · `422` enrichment failed (no relevant chunks found) · `503` corpus not built yet

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI/LLM**: Google Gemini via OpenRouter API
- **Embeddings**: `google/gemini-embedding-2-preview` via OpenRouter (RAG corpus)
- **Retrieval**: Hybrid BM25 + cosine similarity with Reciprocal Rank Fusion (RRF)
- **State Management**: React Hooks (useState, useEffect, useMemo)
- **Component Architecture**: Modular React components

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENROUTER_API_KEY` | OpenRouter API key — used for LLM inference and corpus embeddings | Yes |
| `OPENROUTER_MODEL` | LLM model for inference | No (default: `google/gemini-3.1-flash-lite`) |
| `OPENROUTER_EMBEDDING_MODEL` | Embedding model for RAG corpus | No (default: `google/gemini-embedding-2-preview`) |
| `NEXT_PUBLIC_APP_NAME` | Application name | No |
| `NEXT_PUBLIC_APP_VERSION` | Application version | No |

### Model Selection

The system supports various Google Gemini models via OpenRouter:

- `google/gemini-3.1-flash-lite` (default) - Fast, cost-effective
- `google/gemini-3.1-pro-preview` - Most capable, higher cost

## LLM Integration

For detailed information about the LLM integration, including prompt engineering, caching, error handling, and best practices, see [LLM_INTEGRATION.md](./LLM_INTEGRATION.md).

### Key LLM Features

- **Intelligent Risk Analysis**: Semantic understanding of job tasks and AML/CFT implications
- **Confidence Scoring**: Each identified risk includes a confidence score (0-100)
- **Fallback Mechanisms**: Automatic fallback to rule-based algorithms if LLM fails
- **Response Caching**: Reduces API calls and improves performance (includes embedding cache for RAG)
- **Cost Optimization**: Uses entry-level Gemini model for efficiency

## RAG — Regulatory Basis Enrichment

After risk analysis identifies relevant AML/CFT risk categories, each category is enriched with specific legal basis citations from the EU AML/CFT Regulation. See [RAG_INTEGRATION.md](./RAG_INTEGRATION.md) for the full specification.

### How it works

1. **Offline corpus build** (`npm run build:corpus`): Parses `documents/AMLCFT_Regulation.json` into child chunks (sub-point level, used for retrieval) and parent chunks (paragraph level, used as LLM context). Embeds child chunks via `google/gemini-embedding-2-preview` and pre-computes BM25 IDF statistics. Output: `src/data/AMLCFT_Regulation_corpus.json`.

2. **Automatic build on startup**: The `predev` and `prestart` npm hooks run `scripts/ensure_corpus.js`, which skips the build if the corpus is already up to date.

3. **Hybrid retrieval at runtime**: For each risk category, the system runs BM25 sparse retrieval and dense cosine similarity in parallel, then fuses rankings with Reciprocal Rank Fusion (RRF, k=60). The top-20 unique parent paragraphs are passed to the LLM.

4. **Validated citations**: The LLM output is validated — each citation is normalized and cross-checked against the corpus index. Hallucinated citations are rejected and the call returns a 422 error rather than silently returning wrong references.

### Building / rebuilding the corpus

```bash
# Build with embeddings (requires OPENROUTER_API_KEY)
npm run build:corpus

# Build without embeddings (BM25-only mode at runtime, no API key needed)
node scripts/build_corpus.js documents/AMLCFT_Regulation.json --dry-run
```

The build is resumable — if interrupted, re-running continues from the last completed batch (via a `.partial.json` sidecar file).

## Training Plan Generation Pipeline

The enhanced training plan generator follows a multi-stage pipeline:

1. **Task Extraction**: Parse job description to extract individual tasks
2. **Risk Mapping**: Map each task to AML/CFT risk categories
3. **Requirements Retrieval**: Retrieve relevant regulatory requirements for each risk
4. **Competency Normalization**: Extract and normalize competencies from requirements
5. **Competency Clustering**: Group related competencies to avoid module proliferation
6. **Module Generation**: Create training modules with full traceability
7. **Activity Breakdown**: Split each module into learning activities across Q1-Q4
8. **Smart Quarter Assignment**: Assign activities based on competency category and keywords
9. **Quality Scoring**: Calculate coverage and traceability metrics

### Activity-Level Organization

Each training module is broken down into granular learning activities:

- **Knowledge competencies** → Q1 Foundation activities
- **Skills competencies** → Q2 Application activities  
- **Judgement competencies** → Q3 Deepening activities
- **Q4-type competencies** (containing keywords: coach, review, feedback, assessment, audit, QA, sign-off, junior, mentoring) → Q4 Embedding activities

Modules appear in all quarters where they have activities, ensuring complete Q1-Q4 coverage.

For detailed implementation information, see [ACTIVITY_LEVEL_IMPLEMENTATION.md](./ACTIVITY_LEVEL_IMPLEMENTATION.md).

### Output Structure

Each generated training plan includes:

```typescript
interface EnhancedTrainingPlan {
  roleId: string;
  roleName: string;
  generatedAt: string;
  
  // Quarterly organization
  quarters: QuarterlySection[];  // Q1-Q4 sections
  
  // Summary statistics
  totalModules: number;
  totalDurationMinutes: number;
  
  // Full traceability
  linkedTaskIds: string[];
  linkedRequirementIds: string[];
  linkedCompetencyIds: string[];
  
  // Quality metrics
  qualityScore: {
    riskCoverage: number;        // % of high-risk tasks covered
    competencyCoverage: number;  // % of competencies addressed
    regulatoryTraceability: number; // % of modules with regulatory basis
    overallScore: number;        // Weighted average (0-100)
  };
}
```

## Development

### Available Scripts

```bash
npm run dev          # Start development server (runs ensure_corpus.js first)
npm run build        # Build for production (runs ensure_corpus.js first)
npm run start        # Start production server (runs ensure_corpus.js first)
npm run build:corpus # Manually build/rebuild the RAG embedding corpus
npm run lint         # Run ESLint
```

### Testing

The project uses a robust testing strategy with fallback mechanisms. Even if the LLM service is unavailable, the system falls back to rule-based algorithms to ensure functionality. The RAG enrichment endpoint (`/api/llm/enrich-risk`) returns appropriate HTTP error codes on failure rather than silently degrading.

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

1. Review the [RAG Design Document](./RAG_INTEGRATION.md) for the regulatory enrichment pipeline
2. Review the [LLM Integration Guide](./LLM_INTEGRATION.md) for detailed LLM documentation
3. Check the [OpenRouter Documentation](https://openrouter.ai/docs)
4. Review the [Google Gemini API Documentation](https://ai.google.dev/docs)

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- AI powered by [Google Gemini](https://ai.google.dev/) via [OpenRouter](https://openrouter.ai/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

**Vidda Solutions** - Compliance Training Generator MVP | Built for Hackathon 2026