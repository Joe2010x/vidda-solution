"use client";

import { useState, useEffect } from "react";
import type { ParsedJobDescription, ParsedTask, RiskHint, RiskCategory } from "@/types";

interface TaskRiskMapping {
  task: ParsedTask;
  mappedRisks: RiskHint[];
  aiConfidence: number;
  aiReasoning: string;
  // Traceability
  sourceJdReviewId: string;
}

interface RiskMappingReviewProps {
  parsedRole: ParsedJobDescription;
  jdReviewId: string;
  onApprove: (approvedMappings: TaskRiskMapping[]) => void;
  onReject: () => void;
}

export default function RiskMappingReview({
  parsedRole,
  jdReviewId,
  onApprove,
  onReject,
}: RiskMappingReviewProps) {
  const [taskMappings, setTaskMappings] = useState<TaskRiskMapping[]>([]);
  const [showTraceability, setShowTraceability] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  useEffect(() => {
    // Initialize task mappings from parsed role
    const mappings: TaskRiskMapping[] = parsedRole.tasks.map(task => ({
      task,
      mappedRisks: task.riskHints,
      aiConfidence: 0.85, // Default confidence
      aiReasoning: `Risk mapping based on task analysis and regulatory requirements.`,
      sourceJdReviewId: jdReviewId,
    }));
    setTaskMappings(mappings);
  }, [parsedRole, jdReviewId]);

  const handleRiskChange = (taskIndex: number, risks: RiskHint[]) => {
    setTaskMappings(prev => prev.map((mapping, i) => 
      i === taskIndex ? { ...mapping, mappedRisks: risks } : mapping
    ));
  };

  const handleApprove = () => {
    onApprove(taskMappings);
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Risk Mapping Review
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Review AI-mapped risks for each task before training plan generation
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTraceability(!showTraceability)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {showTraceability ? "Hide" : "Show"} Traceability
          </button>
          <button
            onClick={() => setShowJsonPreview(!showJsonPreview)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {showJsonPreview ? "Hide" : "Show"} JSON
          </button>
        </div>
      </div>

      {/* Traceability Info */}
      {showTraceability && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            Traceability Chain
          </h3>
          <div className="text-xs text-blue-700 space-y-1">
            <p><strong>Source:</strong> JD Review (ID: {jdReviewId})</p>
            <p><strong>Role:</strong> {parsedRole.roleName}</p>
            <p><strong>Tasks:</strong> {parsedRole.tasks.length} tasks with mapped risks</p>
            <p><strong>Overall Risk Level:</strong> {parsedRole.overallRiskLevel}</p>
            <p><strong>Risk Categories:</strong> {parsedRole.riskCategories.join(", ")}</p>
          </div>
        </div>
      )}

      {/* JSON Preview */}
      {showJsonPreview && (
        <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-2">JSON Data (parsedRole + taskMappings)</h3>
          <pre className="text-xs text-green-400 overflow-auto max-h-96">
            {JSON.stringify({
              jdReviewId,
              parsedRole,
              taskMappings
            }, null, 2)}
          </pre>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">Total Tasks</p>
          <p className="text-2xl font-bold text-gray-800">{taskMappings.length}</p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-xs text-red-500">High Risk Tasks</p>
          <p className="text-2xl font-bold text-red-800">
            {taskMappings.filter(m => m.mappedRisks.some(r => r.level === 'high')).length}
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-xs text-green-500">Avg Confidence</p>
          <p className="text-2xl font-bold text-green-800">
            {Math.round(taskMappings.reduce((sum, m) => sum + m.aiConfidence, 0) / taskMappings.length * 100)}%
          </p>
        </div>
      </div>

      {/* Task Risk Mappings */}
      <div className="space-y-4">
        {taskMappings.map((mapping, taskIndex) => (
          <TaskRiskMappingItem
            key={mapping.task.taskId}
            mapping={mapping}
            index={taskIndex}
            onChange={handleRiskChange}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
        <button
          onClick={onReject}
          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
        >
          Reject & Restart
        </button>
        <button
          onClick={handleApprove}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Approve & Generate Training Plan →
        </button>
      </div>
    </div>
  );
}

// Individual Task Risk Mapping Item
function TaskRiskMappingItem({
  mapping,
  index,
  onChange,
}: {
  mapping: TaskRiskMapping;
  index: number;
  onChange: (taskIndex: number, risks: RiskHint[]) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gray-50 flex items-start justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-500">Task {index + 1}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${getConfidenceColor(mapping.aiConfidence)}`}>
              {Math.round(mapping.aiConfidence * 100)}% confidence
            </span>
          </div>
          <p className="text-sm font-medium text-gray-800">{mapping.task.description}</p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <div className="flex gap-1">
            {mapping.mappedRisks.map((risk, i) => (
              <span key={i} className={`text-xs px-2 py-1 rounded border ${getRiskLevelColor(risk.level)}`}>
                {risk.category}
              </span>
            ))}
          </div>
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          {/* Evidence Text */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Evidence from JD
            </label>
            <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
              {mapping.task.evidenceText}
            </p>
          </div>

          {/* AI Reasoning */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              AI Reasoning
            </label>
            <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded border border-blue-200">
              {mapping.aiReasoning}
            </p>
          </div>

          {/* Risk Hints Editor */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Risk Mapping (Editable)
            </label>
            <div className="space-y-2">
              {mapping.mappedRisks.map((risk, riskIndex) => (
                <div key={riskIndex} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                  <select
                    value={risk.category}
                    onChange={(e) => {
                      const newRisks = [...mapping.mappedRisks];
                      newRisks[riskIndex] = { ...risk, category: e.target.value as RiskCategory };
                      onChange(index, newRisks);
                    }}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="AML">AML</option>
                    <option value="KYC">KYC</option>
                    <option value="sanctions">Sanctions</option>
                    <option value="fraud">Fraud</option>
                    <option value="documentation">Documentation</option>
                    <option value="data_protection">Data Protection</option>
                    <option value="governance">Governance</option>
                  </select>
                  <select
                    value={risk.level}
                    onChange={(e) => {
                      const newRisks = [...mapping.mappedRisks];
                      newRisks[riskIndex] = { ...risk, level: e.target.value as 'low' | 'medium' | 'high' };
                      onChange(index, newRisks);
                    }}
                    className={`px-2 py-1 border border-gray-300 rounded text-xs ${getRiskLevelColor(risk.level)}`}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Traceability Info */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <strong>Source:</strong> JD Review ID: {mapping.sourceJdReviewId} | Task ID: {mapping.task.taskId}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}