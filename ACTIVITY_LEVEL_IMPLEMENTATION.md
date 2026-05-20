# Activity-Level Q1-Q4 Training Plan Implementation

## Overview

This document describes the implementation of **Option B: Activity-Level Breakdown** for the training plan generator, which ensures proper Q1-Q4 distribution of learning activities based on competency categories.

## Problem Statement

Previously, the training plan generator only created a flat list of modules without proper quarter distribution. This resulted in:
- Only Q1/Q2 being populated in the UI
- No Q3/Q4 activities generated
- Modules not broken down into granular learning activities
- Lack of clear learning progression (knowledge → skills → judgement → assessment)

## Solution

### 1. New Data Structures

Added `LearningActivity` interface to represent granular training components:

```typescript
export interface LearningActivity {
  id: string;
  title: string;
  description: string;
  parentModuleId: string;
  parentModuleTitle: string;
  assignedQuarter: TrainingQuarter;
  competencyCategory: ActivityCompetencyCategory;
  durationMinutes: number;
  linkedCompetencies: string[];
  linkedTaskIds: string[];
  riskCategories: string[];
  primaryRequirement: string;
  whyIncluded: string;
  humanReviewRequired: boolean;
}
```

### 2. Quarter Assignment Logic

Each activity is assigned to a quarter based on its competency category:

- **Q1 (Foundation)**: Knowledge activities
- **Q2 (Application)**: Skills activities  
- **Q3 (Deepening)**: Judgement activities
- **Q4 (Embedding)**: Assessment activities (for critical/high priority modules)

### 3. Activity Generation Function

New function `splitClusterToActivities()` breaks down each competency cluster into multiple activities:

```typescript
export function splitClusterToActivities(
  cluster: CompetencyCluster,
  roleName: string,
  moduleIndex: number
): LearningActivity[]
```

This function:
1. Creates Q1 activities for all knowledge competencies
2. Creates Q2 activities for all skills competencies
3. Creates Q3 activities for all judgement competencies
4. Creates Q4 assessment activities for critical/high priority modules

### 4. Module Structure Update

Updated `TrainingModuleItem` to include activities:

```typescript
export interface TrainingModuleItem {
  // ... existing fields ...
  activities: LearningActivity[];
}
```

### 5. Quarterly Section Update

Updated `QuarterlySection` to include activities:

```typescript
export interface QuarterlySection {
  quarter: TrainingQuarter;
  title: string;
  description: string;
  modules: TrainingModuleItem[];
  activities: LearningActivity[]; // All activities for this quarter
}
```

## Example Output

### Before (Flat Structure)
```json
{
  "items": [
    "Suspicious Activity Reporting...",
    "Enhanced Due Diligence...",
    "Customer Due Diligence...",
    "AML Internal Controls..."
  ]
}
```

### After (Q1-Q4 Structure)
```json
{
  "quarters": [
    {
      "quarter": "Q1",
      "title": "Q1: Foundation & Knowledge",
      "activities": [
        {
          "id": "module-sar-1-q1-knowledge",
          "title": "Suspicious Activity Reporting: Knowledge Foundation",
          "competencyCategory": "knowledge",
          "linkedCompetencies": ["Know SAR reporting thresholds", "Understand tipping-off risks"]
        },
        {
          "id": "module-cdd-2-q1-knowledge", 
          "title": "Customer Due Diligence: Knowledge Foundation",
          "competencyCategory": "knowledge"
        }
      ]
    },
    {
      "quarter": "Q2",
      "activities": [
        {
          "id": "module-sar-1-q2-skills",
          "title": "Suspicious Activity Reporting: Practical Skills Workshop",
          "competencyCategory": "skills"
        }
      ]
    },
    {
      "quarter": "Q3",
      "activities": [
        {
          "id": "module-sar-1-q3-judgement",
          "title": "Suspicious Activity Reporting: Decision-Making Scenario Lab",
          "competencyCategory": "judgement"
        }
      ]
    },
    {
      "quarter": "Q4",
      "activities": [
        {
          "id": "module-sar-1-q4-assessment",
          "title": "Suspicious Activity Reporting: Competency Assessment",
          "competencyCategory": "assessment"
        }
      ]
    }
  ]
}
```

## Benefits

1. **Complete Q1-Q4 Coverage**: Every quarter now has activities when competencies exist
2. **Clear Learning Progression**: Knowledge → Skills → Judgement → Assessment
3. **Better Traceability**: Each activity links to specific competencies and tasks
4. **Granular Duration Control**: Each activity has its own duration
5. **Flexible Assessment**: Q4 assessments only for critical/high priority modules

## Files Modified

1. `src/types/training.ts` - Added LearningActivity interface and updated structures
2. `src/llm/generation/ruleBased.ts` - Implemented splitClusterToActivities() and updated generator
3. `src/app/page.tsx` - Fixed type references ('skill' → 'skills')

## Testing

The build completes successfully with no TypeScript errors. The training plan generator now:
- Creates activities for all competency categories
- Distributes activities across all four quarters
- Maintains full traceability and explainability
- Generates Q4 assessments for high-priority modules

## Next Steps

To fully utilize this structure, the UI components may need updates to:
1. Display activities grouped by quarter
2. Show activity details (duration, competencies, etc.)
3. Allow expansion/collapse of module activities
4. Visualize the learning progression across quarters