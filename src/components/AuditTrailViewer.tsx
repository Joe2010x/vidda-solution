'use client';

import React, { useState } from 'react';
import type { AuditTrail, AuditEntry } from '@/types/audit';

interface AuditTrailViewerProps {
  auditTrail: AuditTrail;
}

/**
 * AuditTrailViewer - Displays audit trail information in a user-friendly format
 */
export const AuditTrailViewer: React.FC<AuditTrailViewerProps> = ({ auditTrail }) => {
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  const toggleEntry = (entryId: string) => {
    setExpandedEntries(prev => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const getStageLabel = (stage: string): string => {
    const labels: Record<string, string> = {
      jd_input: 'JD Input',
      jd_parsing: 'JD Parsing',
      jd_review: 'JD Review',
      risk_mapping: 'Risk Mapping',
      risk_review: 'Risk Review',
      training_generation: 'Training Generation',
      validation: 'Validation',
      final_review: 'Final Review',
    };
    return labels[stage] || stage;
  };

  const getActionColor = (action: string): string => {
    const colors: Record<string, string> = {
      created: 'bg-green-100 text-green-800',
      modified: 'bg-blue-100 text-blue-800',
      approved: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-red-100 text-red-800',
      reviewed: 'bg-purple-100 text-purple-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Audit Trail
      </h2>

      {/* Session Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded-md">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium">Session ID:</span> {auditTrail.sessionId}
          </div>
          <div>
            <span className="font-medium">Status:</span> 
            <span className={`ml-1 px-2 py-1 rounded text-xs ${
              auditTrail.status === 'completed' ? 'bg-green-100 text-green-800' : 
              auditTrail.status === 'failed' ? 'bg-red-100 text-red-800' : 
              'bg-yellow-100 text-yellow-800'
            }`}>
              {auditTrail.status}
            </span>
          </div>
          <div>
            <span className="font-medium">Started:</span> {formatTimestamp(auditTrail.startedAt)}
          </div>
          {auditTrail.completedAt && (
            <div>
              <span className="font-medium">Completed:</span> {formatTimestamp(auditTrail.completedAt)}
            </div>
          )}
        </div>
      </div>

      {/* Human Review Summary */}
      {auditTrail.humanReviewSummary.totalReviews > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <h3 className="font-medium text-sm mb-2">Human Review Summary</h3>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>Total Reviews: {auditTrail.humanReviewSummary.totalReviews}</div>
            <div className="text-green-700">Approvals: {auditTrail.humanReviewSummary.approvals}</div>
            <div className="text-red-700">Rejections: {auditTrail.humanReviewSummary.rejections}</div>
          </div>
        </div>
      )}

      {/* Integrity Check */}
      <div className={`mb-4 p-3 rounded-md ${
        auditTrail.integrityCheck.allHashesValid 
          ? 'bg-green-50 text-green-800' 
          : 'bg-red-50 text-red-800'
      }`}>
        <div className="font-medium text-sm">
          Data Integrity: {auditTrail.integrityCheck.allHashesValid ? '✓ Valid' : '✗ Issues Detected'}
        </div>
        {auditTrail.integrityCheck.brokenLinks.length > 0 && (
          <div className="text-xs mt-1">
            Broken Links: {auditTrail.integrityCheck.brokenLinks.length}
          </div>
        )}
        {auditTrail.integrityCheck.missingStages.length > 0 && (
          <div className="text-xs mt-1">
            Missing Stages: {auditTrail.integrityCheck.missingStages.join(', ')}
          </div>
        )}
      </div>

      {/* Audit Entries */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm mb-2">Pipeline Entries ({auditTrail.entries.length})</h3>
        
        {auditTrail.entries.map((entry: AuditEntry) => (
          <div key={entry.id} className="border rounded-md overflow-hidden">
            <button
              onClick={() => toggleEntry(entry.id)}
              className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(entry.action)}`}>
                  {entry.action.toUpperCase()}
                </span>
                <span className="font-medium">{getStageLabel(entry.stage)}</span>
                <span className="text-sm text-gray-600">{formatTimestamp(entry.timestamp)}</span>
              </div>
              <svg 
                className={`w-4 h-4 transition-transform ${expandedEntries.has(entry.id) ? 'transform rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedEntries.has(entry.id) && (
              <div className="px-4 py-3 bg-white border-t">
                {/* Input Reference */}
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">Input:</div>
                  <div className="text-sm">
                    <div>From: {getStageLabel(entry.inputReference.sourceStage)}</div>
                    <div>Hash: <code className="bg-gray-100 px-1 rounded text-xs">{entry.inputReference.dataHash}</code></div>
                  </div>
                </div>

                {/* Output Reference */}
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">Output:</div>
                  <div className="text-sm">
                    <div>Hash: <code className="bg-gray-100 px-1 rounded text-xs">{entry.outputReference.dataHash}</code></div>
                  </div>
                </div>

                {/* AI Processing Info */}
                {entry.aiProcessing && (
                  <div className="mb-3 p-2 bg-purple-50 rounded">
                    <div className="text-xs font-medium text-purple-700 mb-1">AI Processing:</div>
                    <div className="text-sm space-y-1">
                      <div><span className="font-medium">Model:</span> {entry.aiProcessing.model}</div>
                      <div><span className="font-medium">Confidence:</span> {(entry.aiProcessing.confidence * 100).toFixed(1)}%</div>
                      <div><span className="font-medium">Reasoning:</span> {entry.aiProcessing.reasoning}</div>
                      {entry.aiProcessing.warnings && entry.aiProcessing.warnings.length > 0 && (
                        <div className="text-yellow-700">
                          <span className="font-medium">Warnings:</span> 
                          <ul className="list-disc list-inside ml-2">
                            {entry.aiProcessing.warnings.map((warning, i) => (
                              <li key={i}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Human Review Info */}
                {entry.humanReview && (
                  <div className="mb-3 p-2 bg-blue-50 rounded">
                    <div className="text-xs font-medium text-blue-700 mb-1">Human Review:</div>
                    <div className="text-sm space-y-1">
                      <div><span className="font-medium">Reviewer:</span> {entry.humanReview.reviewerName}</div>
                      <div><span className="font-medium">Status:</span> 
                        <span className={`ml-1 px-2 py-1 rounded text-xs ${
                          entry.humanReview.status === 'approved' ? 'bg-green-100 text-green-800' :
                          entry.humanReview.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {entry.humanReview.status}
                        </span>
                      </div>
                      <div><span className="font-medium">Comment:</span> {entry.humanReview.comment}</div>
                      {entry.humanReview.changes && entry.humanReview.changes.length > 0 && (
                        <div>
                          <span className="font-medium">Changes:</span>
                          <ul className="list-disc list-inside ml-2 mt-1">
                            {entry.humanReview.changes.map((change, i) => (
                              <li key={i} className="text-xs">
                                {change.field}: {JSON.stringify(change.oldValue)} → {JSON.stringify(change.newValue)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Traceability Links */}
      {auditTrail.traceabilityLinks.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium text-sm mb-2">Traceability Links ({auditTrail.traceabilityLinks.length})</h3>
          <div className="space-y-1">
            {auditTrail.traceabilityLinks.map((link, index) => (
              <div key={index} className="text-sm p-2 bg-gray-50 rounded flex items-center">
                <span className="font-medium">{getStageLabel(link.fromStage)}</span>
                <span className="mx-2 text-gray-400">→</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  link.linkageType === 'derived_from' ? 'bg-green-100 text-green-800' :
                  link.linkageType === 'modified_from' ? 'bg-blue-100 text-blue-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {link.linkageType.replace(/_/g, ' ')}
                </span>
                <span className="mx-2 text-gray-400">→</span>
                <span className="font-medium">{getStageLabel(link.toStage)}</span>
                <span className="ml-auto text-xs text-gray-500">
                  Confidence: {(link.confidence * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditTrailViewer;