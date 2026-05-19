"use client";

import { useState } from "react";
import type { NormalizedCompetency, PriorityLevel } from "@/types/retrieval";

interface CompetencyReviewProps {
  competencies: NormalizedCompetency[];
  jdReviewId: string;
  onApprove: () => void;
  onReject: () => void;
}

export default function CompetencyReview({
  competencies,
  jdReviewId,
  onApprove,
  onReject,
}: CompetencyReviewProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'knowledge' | 'skills' | 'judgement'>('all');
  const [selectedPriority, setSelectedPriority] = useState<'all' | PriorityLevel>('all');
  const [removedCompetencies, setRemovedCompetencies] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  const filteredCompetencies = competencies.filter(comp => {
    if (selectedCategory !== 'all' && comp.category !== selectedCategory) return false;
    if (selectedPriority !== 'all' && comp.priority !== selectedPriority) return false;
    return true;
  });

  const getCategoryBadge = (category: 'knowledge' | 'skills' | 'judgement') => {
    switch (category) {
      case 'knowledge':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">Knowledge</span>;
      case 'skills':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">Skills</span>;
      case 'judgement':
        return <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded font-medium">Judgement</span>;
    }
  };

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'critical':
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">Critical</span>;
      case 'high':
        return <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded font-medium">High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded font-medium">Medium</span>;
      case 'low':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">Low</span>;
    }
  };

  const getConfidenceBadge = (status: 'verified' | 'tentative' | 'assumed') => {
    switch (status) {
      case 'verified':
        return <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded border border-green-200">Verified</span>;
      case 'tentative':
        return <span className="px-2 py-0.5 bg-yellow-50 text-yellow-600 text-xs rounded border border-yellow-200">Tentative</span>;
      case 'assumed':
        return <span className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded border border-gray-200">Assumed</span>;
    }
  };

  const handleApprove = () => {
    onApprove();
  };

  const toggleCompetencyRemoval = (competencyId: string) => {
    setRemovedCompetencies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(competencyId)) {
        newSet.delete(competencyId);
      } else {
        newSet.add(competencyId);
      }
      return newSet;
    });
  };

  // Calculate statistics
  const stats = {
    total: competencies.length,
    byCategory: {
      knowledge: competencies.filter(c => c.category === 'knowledge').length,
      skills: competencies.filter(c => c.category === 'skills').length,
      judgement: competencies.filter(c => c.category === 'judgement').length,
    },
    byPriority: {
      critical: competencies.filter(c => c.priority === 'critical').length,
      high: competencies.filter(c => c.priority === 'high').length,
      medium: competencies.filter(c => c.priority === 'medium').length,
      low: competencies.filter(c => c.priority === 'low').length,
    },
    requiringReview: competencies.filter(c => c.humanReviewRequired).length,
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-purple-200">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Competency Review</h2>
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
          Review normalized competency needs derived from task-requirement mappings. These competencies will inform the training plan generation.
        </p>
      </div>

      {/* JSON Preview */}
      {showJsonPreview && (
        <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-2">JSON Data (Normalized Competencies)</h3>
          <pre className="text-xs text-green-400 overflow-auto max-h-96">
            {JSON.stringify({
              jdReviewId,
              totalCompetencies: competencies.length,
              stats,
              competencies: filteredCompetencies.filter(c => !removedCompetencies.has(c.competencyId)),
              notes
            }, null, 2)}
          </pre>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <div className="text-2xl font-bold text-red-700">{stats.byPriority.critical}</div>
          <div className="text-xs text-red-600">Critical</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
          <div className="text-2xl font-bold text-orange-700">{stats.byPriority.high}</div>
          <div className="text-xs text-orange-600">High</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
          <div className="text-2xl font-bold text-purple-700">{stats.requiringReview}</div>
          <div className="text-xs text-purple-600">Need Review</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Filters:</h3>
        <div className="flex flex-wrap gap-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Category:</span>
            {(['all', 'knowledge', 'skills', 'judgement'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Priority:</span>
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map(pri => (
              <button
                key={pri}
                onClick={() => setSelectedPriority(pri)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedPriority === pri
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {pri.charAt(0).toUpperCase() + pri.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Competency Items */}
      <div className="space-y-3 mb-6">
        <h3 className="text-sm font-semibold text-gray-700">
          Normalized Competencies ({filteredCompetencies.filter(c => !removedCompetencies.has(c.competencyId)).length})
        </h3>
        
        {filteredCompetencies.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No competencies match the current filters.
          </div>
        ) : (
          filteredCompetencies.map((comp) => {
            const isRemoved = removedCompetencies.has(comp.competencyId);
            return (
              <div
                key={comp.competencyId}
                className={`p-4 rounded-lg border transition-all ${
                  isRemoved
                    ? 'bg-gray-50 border-gray-200 opacity-50'
                    : 'bg-white border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header with badges */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {getCategoryBadge(comp.category)}
                      {getPriorityBadge(comp.priority)}
                      {getConfidenceBadge(comp.confidenceStatus)}
                      {comp.humanReviewRequired && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">
                          Review Required
                        </span>
                      )}
                    </div>

                    {/* Competency text */}
                    <p className="text-sm font-medium text-gray-900 mb-2">{comp.text}</p>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>
                        <span className="font-medium">Task:</span> {comp.taskId}
                      </div>
                      <div>
                        <span className="font-medium">Requirement:</span> {comp.linkedRequirement}
                      </div>
                      <div>
                        <span className="font-medium">Regulatory Basis:</span> {comp.linkedRegulatoryBasis.join(', ')}
                      </div>
                      <div>
                        <span className="font-medium">Risk Level:</span> {comp.riskLevel.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleCompetencyRemoval(comp.competencyId)}
                    className={`ml-2 p-1 rounded shrink-0 ${
                      isRemoved
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                    title={isRemoved ? 'Restore competency' : 'Remove competency'}
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
          })
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
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Add any notes about competency needs..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          {removedCompetencies.size > 0 ? (
            <span className="text-amber-600">
              {removedCompetencies.size} competency need(s) marked for removal
            </span>
          ) : (
            <span>All competency needs approved</span>
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
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
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