# TBi Bank Loan Platform - Quick Context for AI

## Project Summary
**TBi Bank CSDR Loan Assessment Platform** - AI-powered banking solution for credit risk assessment built with React 18, TypeScript, and Tailwind CSS.

## Core Purpose
Streamline loan application review process by automating credit risk assessment with intelligent algorithms, providing real-time scoring for loan officers and risk managers.

## Technology
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Type**: Single Page Application (SPA)

## Key Features
1. **AI Risk Scoring**: Multi-factor credit risk analysis (35% credit score, 30% DTI, 25% LTV, 10% employment)
2. **Application Dashboard**: Visual loan application cards with complete applicant profiles
3. **Risk Visualization**: Color-coded risk indicators (Low/Medium/High) with confidence scores
4. **Smart Recommendations**: Automatic approve/review/reject suggestions based on risk analysis

## Project Structure
```
src/
├── components/
│   ├── ApplicationCard.tsx    # Main loan display component
│   └── RiskScoreDisplay.tsx   # Risk visualization
├── services/
│   └── aiService.ts           # AI risk assessment algorithms
├── types/
│   └── banking.ts             # TypeScript definitions
├── data/
│   └── bankingMockData.ts     # Sample applications
└── App.tsx                    # Main app
```

## AI Risk Assessment Algorithm

### Risk Factors & Weights
1. **Credit Score** (35%)
   - ≥750: Low | 650-749: Medium | <650: High

2. **Debt-to-Income** (30%)
   - ≤36%: Low | 37-43%: Medium | >43%: High

3. **Loan-to-Value** (25%)
   - ≤80%: Low | 81-90%: Medium | >90%: High

4. **Employment** (10%)
   - ≥5yrs: Low | 2-4yrs: Medium | <2yrs: High

### Recommendation Logic
```
Risk Score = Weighted sum of all factors (0-100)
- Score ≤30 + Low Risk → APPROVE
- Score ≥70 + High Risk → REJECT
- Otherwise → REVIEW
```

## Sample Data
3 mock loan applications included:
- **LA-2024-001**: $250K home purchase, score 780, LOW risk (23/100) → APPROVE
- **LA-2024-002**: $45K business loan, score 710, LOW risk (31/100) → REVIEW
- **LA-2024-003**: $180K refinance, score 645, MEDIUM risk (53/100) → REVIEW

## Quick Start
```bash
npm install
npm run dev
# Opens on localhost:5173
```

## Current Status
- **Version**: 1.0.0
- **Type**: Frontend Demo (mock data only)
- **Purpose**: Internal TBi Bank tool
- **Next Steps**: Backend integration, authentication, database

## GitHub
Repository: `https://github.com/absulysuly/https-github.com-awatattor-alt--E-tbi-loan-platform-UPDATED`

---

**For Full Details**: See `AI_CONTEXT_COMPLETE_PROJECT.md` (includes complete source code, all components, and detailed algorithm explanations)
