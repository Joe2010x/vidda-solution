"use client";

import { useState, useEffect } from "react";
import type { EnhancedRetrievalResult, TaskRequirementMapping, RequirementMapping } from "@/types/retrieval";

interface RequirementsReviewProps {
  retrievalResult: EnhancedRetrievalResult;
  jdReviewId: string;
  onApprove: (approvedMappings: TaskRequirementMapping[]) => void;
  onReject: () => void;
}

/**
 * Validate task integrity within the component
 * Checks that taskDescription matches originalTaskDescription for all mappings
 */
function checkTaskIntegrity(mappings: TaskRequirementMapping[]): {
  isValid: boolean;
  driftedTasks: Array<{ taskId: string; expected: string; actual: string }>;
} {
  const driftedTasks: Array<{ taskId: string; expected: string; actual: string }> = [];
  
  mappings.forEach(mapping => {
    if (mapping.taskDescription !== mapping.originalTaskDescription) {
      driftedTasks.push({
        taskId: mapping.taskId,
        expected: mapping.originalTaskDescription,
        actual: mapping.taskDescription,
      });
    }
  });
  
  return {
    isValid: driftedTasks.length === 0,
    driftedTasks,
  };
}

export default function RequirementsReview({
  retrievalResult,
  jdReviewId,
  onApprove,
  onReject,
}: RequirementsReviewProps) {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [removedRequirements, setRemovedRequirements] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  const { taskRequirementMappings, summary, validation } = retrievalResult;

  // Check task integrity on mount and when mappings change
  const [taskIntegrity, setTaskIntegrity] = useState<{ isValid: boolean; driftedTasks: Array<{ taskId: string; expected: string; actual: string }> } | null>(null);

  useEffect(() => {
    setTaskIntegrity(checkTaskIntegrity(taskRequirementMappings));
  }, [taskRequirementMappings]);

  // Helper to get requirement ID (supports both new and legacy formats)
  const getRequirementId = (req: RequirementMapping): string => {
    // New format uses businessRequirement.id
    if ('businessRequirement' in req && req.businessRequirement?.id) {
      return req.businessRequirement.id;
    }
    // Fallback: generate ID from business requirement title and article
    if ('businessRequirement' in req) {
      return `${req.businessRequirement?.title || 'req'}-${req.regulatoryBasis?.article || ''}`.replace(/\s+/g, '-');
    }
    // Legacy format (shouldn't happen but for safety)
    return (req as any).id || 'unknown';
  };

  const handleApprove = () => {
    // Filter out removed requirements
    const approvedMappings = taskRequirementMappings.map(mapping => ({
      ...mapping,
      requirements: mapping.requirements.filter(req => !removedRequirements.has(getRequirementId(req))),
    })).filter(mapping => mapping.requirements.length > 0);

    onApprove(approvedMappings);
  };

  const toggleRequirementRemoval = (requirementId: string) => {
    setRemovedRequirements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(requirementId)) {
        newSet.delete(requirementId);
      } else {
        newSet.add(requirementId);
      }
      return newSet;
    });
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-blue-200">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Requirements Review</h2>
              <p className="text-sm text-gray-500">JD Review ID: {jdReviewId}</p>
            </div>
          </div>
          <button
            onClick={() => setShowJsonPreview(!showJsonPreview)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {showJsonPreview ? "Hide" : "Show"} JSON
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Review the AMLR requirements mapped to each task. Approve to continue or reject to revise mappings.
        </p>
      </div>

      {/* JSON Preview */}
      {showJsonPreview && (
        <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-2">JSON Data (Retrieval Result)</h3>
          <pre className="text-xs text-green-400 overflow-auto max-h-96">
            {JSON.stringify({
              jdReviewId,
              retrievalResult,
              notes
            }, null, 2)}
          </pre>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{summary.totalTasks}</div>
          <div className="text-xs text-gray-500">Total Tasks</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <div className="text-2xl font-bold text-red-700">{summary.highRiskTasks}</div>
          <div className="text-xs text-red-500">High Risk Tasks</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{summary.matchedRequirementCount}</div>
          <div className="text-xs text-blue-500">Requirements Matched</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
          <div className={`text-2xl font-bold ${getConfidenceColor(summary.avgConfidence)}`}>
            {Math.round(summary.avgConfidence * 100)}%
          </div>
          <div className="text-xs text-purple-500">Avg Confidence</div>
        </div>
      </div>

      {/* Validation Warnings */}
      {validation.needsHumanReview && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-amber-800">Review Required</h3>
              <ul className="mt-1 text-xs text-amber-700 list-disc list-inside">
                {validation.reviewReasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Task Integrity Warning */}
      {taskIntegrity && !taskIntegrity.isValid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">⚠️ Task Drift Detected</h3>
              <p className="mt-1 text-xs text-red-700">
                Task descriptions have been modified during retrieval. This breaks the audit trail and may cause compliance issues.
              </p>
              <div className="mt-2 space-y-2">
                {taskIntegrity.driftedTasks.map((drift, idx) => (
                  <div key={idx} className="bg-red-100 rounded p-2 text-xs">
                    <p className="font-medium text-red-900">{drift.taskId}:</p>
                    <p className="text-red-700 mt-0.5">
                      <span className="font-medium">Expected:</span> {drift.expected}
                    </p>
                    <p className="text-red-700">
                      <span className="font-medium">Actual:</span> {drift.actual}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-red-600 font-medium">
                Action: Please reject and revise the mappings to preserve task integrity.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Task Integrity Success Indicator */}
      {taskIntegrity && taskIntegrity.isValid && taskRequirementMappings.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-green-700 font-medium">Task integrity verified — all task descriptions preserved from original input</span>
          </div>
        </div>
      )}

      {/* Task Mappings */}
      <div className="space-y-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700">Task → Requirements Mappings</h3>
        
        {taskRequirementMappings.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No task mappings found. This may indicate tasks without identified risks.
          </div>
        ) : (
          taskRequirementMappings.map((mapping) => (
            <div
              key={mapping.taskId}
              className={`border rounded-lg overflow-hidden ${
                selectedTask === mapping.taskId ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'
              }`}
            >
              {/* Task Header */}
              <button
                onClick={() => setSelectedTask(selectedTask === mapping.taskId ? null : mapping.taskId)}
                className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskLevelColor(mapping.riskLevel)}`}>
                    {mapping.riskLevel.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{mapping.taskId}</span>
                  <span className="text-xs text-gray-500">({mapping.riskCategory})</span>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    selectedTask === mapping.taskId ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Task Details */}
              {selectedTask === mapping.taskId && (
                <div className="px-4 py-3 border-t border-gray-200">
                  {/* Task Description */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Task:</span> {mapping.taskDescription}
                    </p>
                  </div>

                  {/* Competency Needs */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Suggested Competency Needs:</p>
                    <div className="flex flex-wrap gap-1">
                      {mapping.suggestedCompetencyNeeds.knowledge.map((k, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                          K: {k}
                        </span>
                      ))}
                      {mapping.suggestedCompetencyNeeds.skills.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded">
                          S: {s}
                        </span>
                      ))}
                      {mapping.suggestedCompetencyNeeds.judgement.map((j, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded">
                          J: {j}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Matched Requirements */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Matched AMLR Requirements:</p>
                    <div className="space-y-2">
                      {mapping.requirements.map((req, reqIndex) => {
                        const reqId = getRequirementId(req);
                        const isRemoved = removedRequirements.has(reqId);
                        
                        // New format: has businessRequirement and regulatoryBasis
                        const hasBusinessReq = 'businessRequirement' in req && req.businessRequirement;
                        const businessTitle = hasBusinessReq 
                          ? req.businessRequirement.title 
                          : (req as any).title || 'Unknown';
                        const article = hasBusinessReq 
                          ? req.regulatoryBasis.article 
                          : (req as any).article || '';
                        const sourceExcerpt = hasBusinessReq 
                          ? req.regulatoryBasis.sourceExcerpt 
                          : (req as any).sourceExcerpt;
                        const relevanceReason = req.relevanceReason || (req as any).relevanceReason || '';
                        const confidence = req.confidence;
                        
                        // Mapping role badge
                        const mappingRole = hasBusinessReq ? req.mappingRole : undefined;
                        const roleBadge = mappingRole ? (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            mappingRole === 'primary' ? 'bg-blue-100 text-blue-700' :
                            mappingRole === 'training_obligation' ? 'bg-purple-100 text-purple-700' :
                            mappingRole === 'competency_obligation' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {mappingRole === 'primary' ? 'Primary' :
                             mappingRole === 'training_obligation' ? 'Training' :
                             mappingRole === 'competency_obligation' ? 'Competency' :
                             'Supporting'}
                          </span>
                        ) : null;

                        return (
                          <div
                            key={reqId}
                            className={`p-3 rounded-lg border ${
                              isRemoved
                                ? 'bg-gray-50 border-gray-200 opacity-50'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-gray-900">{businessTitle}</span>
                                  <span className={`text-xs font-medium ${getConfidenceColor(confidence)}`}>
                                    {Math.round(confidence * 100)}% confidence
                                  </span>
                                  {roleBadge}
                                </div>
                                <div className="text-xs text-gray-500 space-y-1">
                                  <p><span className="font-medium">Article:</span> {article}</p>
                                  {sourceExcerpt && (
                                    <p className="italic">&ldquo;{sourceExcerpt.substring(0, 100)}...&rdquo;</p>
                                  )}
                                  {relevanceReason && (
                                    <p><span className="font-medium">Why:</span> {relevanceReason}</p>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => toggleRequirementRemoval(reqId)}
                                className={`ml-2 p-1 rounded ${
                                  isRemoved
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                                }`}
                                title={isRemoved ? 'Restore requirement' : 'Remove requirement'}
                              >
                                {isRemoved ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Review Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Add any notes about this review..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          {removedRequirements.size > 0 ? (
            <span className="text-amber-600">
              {removedRequirements.size} requirement(s) marked for removal
            </span>
          ) : (
            <span>All requirements approved</span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onReject}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reject & Revise
          </button>
          <button
            onClick={handleApprove}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Approve & Continue
          </button>
        </div>
      </div>
    </div>
  );
}