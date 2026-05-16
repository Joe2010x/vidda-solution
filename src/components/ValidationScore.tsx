"use client";

import { ValidationScore } from "@/types";

interface ValidationScoreProps {
  score: ValidationScore | null;
}

export default function ValidationScoreComponent({ score }: ValidationScoreProps) {
  if (!score) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Validation Score
        </h2>
        <p className="text-gray-500 text-center py-8">
          Generate a training plan to see validation metrics
        </p>
      </div>
    );
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "text-green-600 bg-green-100 border-green-200";
      case "B":
        return "text-blue-600 bg-blue-100 border-blue-200";
      case "C":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "D":
        return "text-orange-600 bg-orange-100 border-orange-200";
      case "F":
        return "text-red-600 bg-red-100 border-red-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const { grade, status, recommendations } = getQualityAssessment(score);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Validation & Quality Score
      </h2>

      {/* Overall Score */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-gray-600">Overall Quality Score</p>
          <p className={`text-3xl font-bold ${getScoreColor(score.overallScore)}`}>
            {score.overallScore}/100
          </p>
        </div>
        <div
          className={`text-4xl font-bold px-4 py-2 rounded-lg border-2 ${getGradeColor(
            grade
          )}`}
        >
          Grade: {grade}
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-4 mb-6">
        <ScoreBar
          label="Coverage Score"
          value={score.coverageScore}
          description="How well requirements are covered"
        />
        <ScoreBar
          label="Relevance Score"
          value={score.relevanceScore}
          description="How relevant modules are to role"
        />
        <ScoreBar
          label="Completeness Score"
          value={score.completenessScore}
          description="Are all risk areas addressed"
        />
      </div>

      {/* Detailed Breakdown */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Detailed Breakdown:
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded">
            <p className="text-lg font-bold text-gray-800">
              {score.breakdown.riskCoverage}%
            </p>
            <p className="text-xs text-gray-500">Risk Coverage</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <p className="text-lg font-bold text-gray-800">
              {score.breakdown.competencyCoverage}%
            </p>
            <p className="text-xs text-gray-500">Competency Coverage</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <p className="text-lg font-bold text-gray-800">
              {score.breakdown.moduleRelevance}%
            </p>
            <p className="text-xs text-gray-500">Module Relevance</p>
          </div>
        </div>
      </div>

      {/* Status & Recommendations */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">
            {status === "excellent"
              ? "✅"
              : status === "good"
              ? "👍"
              : status === "adequate"
              ? "⚠️"
              : "❌"}
          </span>
          <span className="font-medium text-gray-800 capitalize">{status.replace("_", " ")}</span>
        </div>
        <ul className="text-sm text-gray-700 space-y-1">
          {recommendations.map((rec, idx) => (
            <li key={idx} className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ScoreBar({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  const getColor = () => {
    if (value >= 80) return "bg-green-500";
    if (value >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${getColor()} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  );
}

function getQualityAssessment(score: ValidationScore): {
  grade: "A" | "B" | "C" | "D" | "F";
  status: "excellent" | "good" | "adequate" | "needs_improvement" | "poor";
  recommendations: string[];
} {
  const recommendations: string[] = [];

  let grade: "A" | "B" | "C" | "D" | "F";
  let status: "excellent" | "good" | "adequate" | "needs_improvement" | "poor";

  if (score.overallScore >= 90) {
    grade = "A";
    status = "excellent";
  } else if (score.overallScore >= 80) {
    grade = "B";
    status = "good";
  } else if (score.overallScore >= 70) {
    grade = "C";
    status = "adequate";
  } else if (score.overallScore >= 60) {
    grade = "D";
    status = "needs_improvement";
  } else {
    grade = "F";
    status = "poor";
  }

  if (score.breakdown.riskCoverage < 80) {
    recommendations.push(
      "Consider adding more training modules to cover identified risk categories"
    );
  }

  if (score.breakdown.competencyCoverage < 80) {
    recommendations.push(
      "Additional modules may be needed to address all competency requirements"
    );
  }

  if (score.breakdown.moduleRelevance < 70) {
    recommendations.push(
      "Review module selection to ensure better alignment with role-specific tasks"
    );
  }

  if (score.completenessScore < 70) {
    recommendations.push(
      "Consider expanding the training plan to cover more regulatory requirements"
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("Training plan meets all quality criteria");
  }

  return { grade, status, recommendations };
}