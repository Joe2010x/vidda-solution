"use client";

import { useState, useEffect } from "react";
import type { ParsedJobDescription, ParsedTask, RiskHint, RiskCategory, FunctionType, SeniorityLevel, JDQualityMetrics } from "@/types";

interface JdReviewEditorProps {
  parsedRole: ParsedJobDescription;
  quality: JDQualityMetrics;
  originalJobDescription: string;
  onApprove: (role: ParsedJobDescription) => void;
  onReject: () => void;
  onReparsed: () => void;
}

export default function JdReviewEditor({
  parsedRole: initialParsedRole,
  quality,
  originalJobDescription,
  onApprove,
  onReject,
  onReparsed,
}: JdReviewEditorProps) {
  const [parsedRole, setParsedRole] = useState<ParsedJobDescription>(initialParsedRole);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [showOriginalJd, setShowOriginalJd] = useState(false);

  // Sync with initial value
  useEffect(() => {
    setParsedRole(initialParsedRole);
  }, [initialParsedRole]);

  const handleRoleNameChange = (value: string) => {
    setParsedRole(prev => ({ ...prev, roleName: value }));
  };

  const handleDepartmentChange = (value: string) => {
    setParsedRole(prev => ({ ...prev, department: value || undefined }));
  };

  const handleSeniorityChange = (value: SeniorityLevel) => {
    setParsedRole(prev => ({ ...prev, seniority: value }));
  };

  const handleRoleSummaryChange = (value: string) => {
    setParsedRole(prev => ({ ...prev, roleSummary: value }));
  };

  const handleOverallRiskLevelChange = (value: "low" | "medium" | "high") => {
    setParsedRole(prev => ({ ...prev, overallRiskLevel: value }));
  };

  const handleTaskChange = (index: number, field: keyof ParsedTask, value: any) => {
    setParsedRole(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }));
  };

  const handleRiskHintChange = (taskIndex: number, hintIndex: number, field: keyof RiskHint, value: any) => {
    setParsedRole(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === taskIndex 
          ? { 
              ...task, 
              riskHints: task.riskHints.map((hint, j) => 
                j === hintIndex ? { ...hint, [field]: value } : hint
              )
            }
          : task
      )
    }));
  };

  const addRiskHint = (taskIndex: number) => {
    setParsedRole(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === taskIndex 
          ? { 
              ...task, 
              riskHints: [...task.riskHints, { category: "governance", level: "low", reason: "New risk hint" }]
            }
          : task
      )
    }));
  };

  const removeRiskHint = (taskIndex: number, hintIndex: number) => {
    setParsedRole(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === taskIndex 
          ? { 
              ...task, 
              riskHints: task.riskHints.filter((_, j) => j !== hintIndex)
            }
          : task
      )
    }));
  };

  const addTask = () => {
    const newTask: ParsedTask = {
      taskId: `task-${Date.now()}`,
      description: "New task",
      evidenceText: "",
      riskHints: [{ category: "governance", level: "low", reason: "Task risk" }],
      functionType: "other"
    };
    setParsedRole(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
  };

  const removeTask = (index: number) => {
    setParsedRole(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }));
  };

  const handleAddRiskCategory = (category: RiskCategory) => {
    if (!parsedRole.riskCategories.includes(category)) {
      setParsedRole(prev => ({ 
        ...prev, 
        riskCategories: [...prev.riskCategories, category] 
      }));
    }
  };

  const handleRemoveRiskCategory = (category: RiskCategory) => {
    setParsedRole(prev => ({
      ...prev,
      riskCategories: prev.riskCategories.filter(c => c !== category)
    }));
  };

  const handleApprove = () => {
    onApprove(parsedRole);
  };

  const availableRiskCategories: RiskCategory[] = ["AML", "KYC", "sanctions", "fraud", "documentation", "data_protection", "governance"];
  const availableFunctionTypes: FunctionType[] = [
    "customer_onboarding", "transaction_monitoring", "kyc_due_diligence", 
    "investigation", "escalation", "reporting", "governance", 
    "data_handling", "training_oversight", "other"
  ];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 bg-green-50";
    if (confidence >= 0.6) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Review Parsed Job Description
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOriginalJd(!showOriginalJd)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {showOriginalJd ? "Hide" : "Show"} Original JD
          </button>
          <button
            onClick={() => setShowJsonPreview(!showJsonPreview)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {showJsonPreview ? "Hide" : "Show"} JSON
          </button>
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Confidence:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(quality.confidence)}`}>
              {Math.round(quality.confidence * 100)}%
            </span>
          </div>
          {quality.needsHumanReview && (
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span className="text-sm text-yellow-700">Human review recommended</span>
            </div>
          )}
        </div>
        {quality.issues.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Quality Issues:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              {quality.issues.map((issue, idx) => (
                <li key={idx}>• {issue}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Original JD Panel */}
      {showOriginalJd && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Original Job Description</h3>
          <p className="text-sm text-blue-900 whitespace-pre-line max-h-48 overflow-y-auto">
            {originalJobDescription}
          </p>
        </div>
      )}

      {/* JSON Preview */}
      {showJsonPreview && (
        <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Parsed JSON (Console Output)</h3>
          <pre className="text-xs text-green-400 overflow-auto max-h-96">
            {JSON.stringify(parsedRole, null, 2)}
          </pre>
        </div>
      )}

      {/* Editable Fields */}
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role Name *
            </label>
            <input
              type="text"
              value={parsedRole.roleName}
              onChange={(e) => handleRoleNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <input
              type="text"
              value={parsedRole.department || ""}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              placeholder="e.g., Compliance, Operations"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seniority Level
            </label>
            <select
              value={parsedRole.seniority || "unknown"}
              onChange={(e) => handleSeniorityChange(e.target.value as SeniorityLevel)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="unknown">Unknown</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid-Level</option>
              <option value="senior">Senior</option>
              <option value="manager">Manager</option>
              <option value="executive">Executive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Risk Level *
            </label>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as const).map(level => (
                <button
                  key={level}
                  onClick={() => handleOverallRiskLevelChange(level)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    parsedRole.overallRiskLevel === level
                      ? getRiskLevelColor(level) + " ring-2 ring-offset-1 ring-blue-500"
                      : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Role Summary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role Summary
          </label>
          <textarea
            value={parsedRole.roleSummary}
            onChange={(e) => handleRoleSummaryChange(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
          />
        </div>

        {/* Risk Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Risk Categories
          </label>
          <div className="flex flex-wrap gap-2">
            {availableRiskCategories.map(category => (
              <button
                key={category}
                onClick={() => parsedRole.riskCategories.includes(category) 
                  ? handleRemoveRiskCategory(category) 
                  : handleAddRiskCategory(category)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  parsedRole.riskCategories.includes(category)
                    ? "bg-blue-100 text-blue-800 border-blue-200"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {parsedRole.riskCategories.includes(category) ? "✓ " : "+ "}{category}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Tasks & Responsibilities *
            </label>
            <button
              onClick={addTask}
              className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              + Add Task
            </button>
          </div>
          <div className="space-y-4">
            {parsedRole.tasks.map((task, taskIndex) => (
              <TaskEditor
                key={task.taskId || taskIndex}
                task={task}
                index={taskIndex}
                onChange={handleTaskChange}
                onRiskHintChange={handleRiskHintChange}
                onAddRiskHint={addRiskHint}
                onRemoveRiskHint={removeRiskHint}
                onRemove={() => removeTask(taskIndex)}
                availableFunctionTypes={availableFunctionTypes}
              />
            ))}
          </div>
        </div>

        {/* Ambiguity Flags */}
        {parsedRole.ambiguityFlags.length > 0 && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              ⚠️ Ambiguities Detected
            </h3>
            <ul className="text-sm text-yellow-700 space-y-2">
              {parsedRole.ambiguityFlags.map((flag, idx) => (
                <li key={idx}>
                  <strong>{flag.field}:</strong> {flag.issue}
                  <br />
                  <span className="text-xs">💡 {flag.suggestedQuestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
        <button
          onClick={onReparsed}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Re-parse JD
        </button>
        <div className="flex gap-3">
          <button
            onClick={onReject}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
          >
            Reject & Cancel
          </button>
          <button
            onClick={handleApprove}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Approve & Continue →
          </button>
        </div>
      </div>
    </div>
  );
}

// Task Editor Sub-component
function TaskEditor({
  task,
  index,
  onChange,
  onRiskHintChange,
  onAddRiskHint,
  onRemoveRiskHint,
  onRemove,
  availableFunctionTypes,
}: {
  task: ParsedTask;
  index: number;
  onChange: (index: number, field: keyof ParsedTask, value: any) => void;
  onRiskHintChange: (taskIndex: number, hintIndex: number, field: keyof RiskHint, value: any) => void;
  onAddRiskHint: (taskIndex: number) => void;
  onRemoveRiskHint: (taskIndex: number, hintIndex: number) => void;
  onRemove: () => void;
  availableFunctionTypes: FunctionType[];
}) {
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-gray-500">Task {index + 1}</span>
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Task Description */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
        <input
          type="text"
          value={task.description}
          onChange={(e) => onChange(index, "description", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      {/* Evidence Text */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-600 mb-1">Evidence Text (from JD)</label>
        <textarea
          value={task.evidenceText}
          onChange={(e) => onChange(index, "evidenceText", e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
          placeholder="Quote from the original JD..."
        />
      </div>

      {/* Function Type */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-600 mb-1">Function Type</label>
        <select
          value={task.functionType}
          onChange={(e) => onChange(index, "functionType", e.target.value as FunctionType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          {availableFunctionTypes.map(type => (
            <option key={type} value={type}>
              {type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {/* Risk Hints */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-medium text-gray-600">Risk Hints</label>
          <button
            onClick={() => onAddRiskHint(index)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            + Add
          </button>
        </div>
        <div className="space-y-2">
          {task.riskHints.map((hint, hintIndex) => (
            <div key={hintIndex} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
              <select
                value={hint.category}
                onChange={(e) => onRiskHintChange(index, hintIndex, "category", e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
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
                value={hint.level}
                onChange={(e) => onRiskHintChange(index, hintIndex, "level", e.target.value)}
                className={`px-2 py-1 border border-gray-300 rounded text-xs ${getRiskLevelColor(hint.level)}`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button
                onClick={() => onRemoveRiskHint(index, hintIndex)}
                className="text-gray-400 hover:text-red-500 p-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        {/* Reason for last hint */}
        {task.riskHints.length > 0 && (
          <div className="mt-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
            <input
              type="text"
              value={task.riskHints[task.riskHints.length - 1].reason}
              onChange={(e) => onRiskHintChange(index, task.riskHints.length - 1, "reason", e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
              placeholder="Why is this a risk?"
            />
          </div>
        )}
      </div>
    </div>
  );
}