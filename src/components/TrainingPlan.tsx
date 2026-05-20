"use client";

import { useState, useMemo } from "react";
import { TrainingPlan, TrainingPlanItem } from "@/types";
import type { EnrichmentResult } from "@/types/rag";
import type { EnhancedTrainingPlan, TrainingModuleItem, QuarterlySection } from "@/types/training";

interface TrainingPlanProps {
  trainingPlan: TrainingPlan | null;
  enhancedPlan?: EnhancedTrainingPlan | null;
  mappedRisks: string[];
  competencyNeeds: string[];
  enrichmentByRisk?: Record<string, EnrichmentResult>;
  enrichmentError?: string | null;
}

export default function TrainingPlanComponent({
  trainingPlan,
  enhancedPlan,
  mappedRisks,
  competencyNeeds,
  enrichmentByRisk = {},
  enrichmentError = null,
}: TrainingPlanProps) {
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const [openRiskCite, setOpenRiskCite] = useState<string | null>(null);
  const [expandedQuarters, setExpandedQuarters] = useState<Set<string>>(new Set(['Q1', 'Q2']));

  const contextMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const enrichment of Object.values(enrichmentByRisk)) {
      for (const ctx of enrichment.contexts ?? []) {
        map.set(ctx.full_path, ctx.text);
      }
    }
    return map;
  }, [enrichmentByRisk]);

  const toggleQuarter = (quarter: string) => {
    setExpandedQuarters(prev => {
      const next = new Set(prev);
      if (next.has(quarter)) next.delete(quarter);
      else next.add(quarter);
      return next;
    });
  };

  if (!trainingPlan && !enhancedPlan) {
    if (enrichmentError) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Training Plan</h2>
          <div role="alert" className="flex items-start gap-3 bg-red-50 border border-red-300 text-red-900 rounded-lg px-4 py-4">
            <svg className="w-6 h-6 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold">Cannot generate training plan</p>
              <p className="text-sm mt-1">Regulatory citation retrieval failed. A training plan cannot be produced without verified regulatory references.</p>
              <p className="text-xs mt-2 font-mono text-red-700">{enrichmentError}</p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Training Plan
        </h2>
        <p className="text-gray-500 text-center py-8">
          Select a role to generate a training plan
        </p>
      </div>
    );
  }

  // ── Enhanced Q1-Q4 view ──────────────────────────────────────────
  if (enhancedPlan) {
    const quarterMeta: Record<string, { color: string; border: string; bg: string; badge: string; label: string }> = {
      Q1: { color: 'text-blue-700', border: 'border-blue-300', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-800', label: 'Foundation (Months 1-3)' },
      Q2: { color: 'text-green-700', border: 'border-green-300', bg: 'bg-green-50', badge: 'bg-green-100 text-green-800', label: 'Application (Months 4-6)' },
      Q3: { color: 'text-amber-700', border: 'border-amber-300', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800', label: 'Deepening (Months 7-9)' },
      Q4: { color: 'text-purple-700', border: 'border-purple-300', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-800', label: 'Embedding (Months 10-12)' },
    };

    const priorityBadge = (p: string) => {
      if (p === 'critical') return 'bg-red-100 text-red-800';
      if (p === 'high') return 'bg-orange-100 text-orange-800';
      if (p === 'medium') return 'bg-yellow-100 text-yellow-800';
      return 'bg-green-100 text-green-800';
    };

    const assessmentIcon: Record<string, string> = {
      quiz: '📝',
      scenario: '🎭',
      case_review: '📋',
      manager_observation: '👁️',
      qa_review: '✅',
    };

    const categoryBadge: Record<string, string> = {
      knowledge: 'bg-blue-50 text-blue-700 border-blue-200',
      skill: 'bg-green-50 text-green-700 border-green-200',
      judgement: 'bg-purple-50 text-purple-700 border-purple-200',
    };

    const qs = enhancedPlan.qualityScore;

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Training Plan: {enhancedPlan.roleName}
          </h2>
          <span className="text-sm text-gray-500">
            Generated: {new Date(enhancedPlan.generatedAt).toLocaleDateString()}
          </span>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{enhancedPlan.totalModules}</p>
            <p className="text-xs text-gray-600">Modules</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {Math.floor(enhancedPlan.totalDurationMinutes / 60)}h {enhancedPlan.totalDurationMinutes % 60}m
            </p>
            <p className="text-xs text-gray-600">Total Duration</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{Math.round(qs.overallScore)}%</p>
            <p className="text-xs text-gray-600">Quality Score</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{Math.round(qs.riskCoverage)}%</p>
            <p className="text-xs text-gray-600">Risk Coverage</p>
          </div>
        </div>

        {/* Quality Score Bar */}
        <div className="mb-5 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-600 mb-2">Competency Coverage</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.round(qs.competencyCoverage)}%` }}
              />
            </div>
            <span className="text-xs text-gray-600 w-10 text-right">{Math.round(qs.competencyCoverage)}%</span>
          </div>
          <p className="text-xs font-medium text-gray-600 mt-2 mb-2">Regulatory Traceability</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.round(qs.regulatoryTraceability)}%` }}
              />
            </div>
            <span className="text-xs text-gray-600 w-10 text-right">{Math.round(qs.regulatoryTraceability)}%</span>
          </div>
        </div>

        {/* Q1-Q4 Sections */}
        <div className="space-y-3">
          {enhancedPlan.quarters.map((section) => {
            const meta = quarterMeta[section.quarter] ?? quarterMeta.Q1;
            const isOpen = expandedQuarters.has(section.quarter);
            return (
              <div key={section.quarter} className={`border ${meta.border} rounded-lg overflow-hidden`}>
                <button
                  onClick={() => toggleQuarter(section.quarter)}
                  className={`w-full flex items-center justify-between p-3 ${meta.bg} hover:opacity-90 transition-opacity`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${meta.color} text-base`}>{section.quarter}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.badge}`}>{meta.label}</span>
                    <span className="text-sm font-medium text-gray-700">{section.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{section.modules.length} modules</span>
                    <span className={`text-xs ${meta.color}`}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="p-3 space-y-3">
                    {section.description && (
                      <p className="text-sm text-gray-600 italic mb-2">{section.description}</p>
                    )}
                    {section.modules.map((mod) => (
                      <EnhancedModuleCard key={mod.moduleId} module={mod} priorityBadge={priorityBadge} assessmentIcon={assessmentIcon} categoryBadge={categoryBadge} />
                    ))}
                    {section.modules.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">No modules scheduled for this quarter</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {enhancedPlan.humanReviewRequired && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="text-amber-600">⚠️</span>
            <p className="text-sm text-amber-800">Some modules require human review before finalising the plan.</p>
          </div>
        )}
      </div>
    );
  }

  // ── Legacy view (fallback) ──────────────────────────────────────
  if (!trainingPlan) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Training Plan</h2>
        <p className="text-gray-500 text-center py-8">Select a role to generate a training plan</p>
      </div>
    );
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 7) return "bg-red-100 text-red-800";
    if (priority >= 4) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getModuleTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return "📹";
      case "interactive":
        return "🎯";
      case "assessment":
        return "📝";
      case "document":
        return "📄";
      default:
        return "📚";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Training Plan: {trainingPlan.roleName}
        </h2>
        <span className="text-sm text-gray-500">
          Generated: {new Date(trainingPlan.generatedAt).toLocaleDateString()}
        </span>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">
            {trainingPlan.items.length}
          </p>
          <p className="text-sm text-gray-600">Modules</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">
            {Math.round(trainingPlan.totalDuration / 60)}h{" "}
            {trainingPlan.totalDuration % 60}m
          </p>
          <p className="text-sm text-gray-600">Total Duration</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">
            {trainingPlan.items.filter((i) => i.priority >= 7).length}
          </p>
          <p className="text-sm text-gray-600">High Priority</p>
        </div>
      </div>

      {/* Mapped Risks */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Identified Risk Categories:
        </h3>
        <div className="flex flex-wrap gap-2">
          {mappedRisks.map((risk) => {
            const enrichment = enrichmentByRisk[risk];
            const isOpen = expandedRisk === risk;
            return (
              <div key={risk}>
                <button
                  onClick={() => { setExpandedRisk(isOpen ? null : risk); setOpenRiskCite(null); }}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors text-left"
                >
                  {risk.replace(/-/g, " ")}
                  {enrichment && (
                    <span className="ml-1 opacity-60">{isOpen ? "▲" : "▼"}</span>
                  )}
                </button>
                {isOpen && enrichment && (
                  <div className="mt-1 ml-1 pl-2 border-l-2 border-blue-200">
                    <p className="text-xs text-gray-600 mb-1">{enrichment.reasoning}</p>
                    <div className="flex flex-wrap gap-1">
                      {enrichment.citations.map((cite) => {
                        const isCiteOpen = openRiskCite === cite;
                        const text = contextMap.get(cite);
                        return (
                          <div key={cite}>
                            <button
                              onClick={() => setOpenRiskCite(isCiteOpen ? null : cite)}
                              disabled={!text}
                              className={`text-xs px-1.5 py-0.5 border rounded font-mono transition-colors
                                ${text ? "cursor-pointer hover:bg-gray-100" : "cursor-default"}
                                ${isCiteOpen ? "bg-gray-100 text-gray-700 border-gray-300" : "bg-gray-50 text-gray-500 border-gray-200"}`}
                            >
                              {cite}
                            </button>
                            {isCiteOpen && text && (
                              <div className="mt-1 pl-2 border-l-2 border-gray-200 bg-gray-50/50 rounded-r py-1 pr-2">
                                <p className="text-xs text-gray-600 italic leading-relaxed">{text}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Competency Needs */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Competency Needs:
        </h3>
        <div className="flex flex-wrap gap-2">
          {competencyNeeds.map((comp) => (
            <span
              key={comp}
              className="text-xs px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded"
            >
              {comp}
            </span>
          ))}
        </div>
      </div>

      {/* Training Modules List */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">
          Recommended Training Modules:
        </h3>
        {trainingPlan.items.map((item, idx) => (
          <TrainingPlanItemCard
            key={idx}
            item={item}
            enrichmentByRisk={enrichmentByRisk}
            contextMap={contextMap}
            getPriorityColor={getPriorityColor}
            getModuleTypeIcon={getModuleTypeIcon}
          />
        ))}
      </div>
    </div>
  );
}

function TrainingPlanItemCard({
  item,
  enrichmentByRisk,
  contextMap,
  getPriorityColor,
  getModuleTypeIcon,
}: {
  item: TrainingPlanItem;
  enrichmentByRisk: Record<string, EnrichmentResult>;
  contextMap: Map<string, string>;
  getPriorityColor: (priority: number) => string;
  getModuleTypeIcon: (type: string) => string;
}) {
  const [showArticles, setShowArticles] = useState(false);
  const [openCite, setOpenCite] = useState<string | null>(null);

  const ragCitations = Array.from(new Set(
    item.requirement.riskCategories.flatMap(
      (cat) => enrichmentByRisk[cat]?.citations ?? []
    )
  ));

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{getModuleTypeIcon(item.module.type)}</span>
            <h4 className="font-medium text-gray-900">{item.module.title}</h4>
            <span
              className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(item.priority)}`}
            >
              Priority: {item.priority}/10
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{item.module.description}</p>
          <div className="mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>⏱ {item.estimatedDuration} min</span>
              <span>📋 {item.requirement.title}</span>
              {ragCitations.length > 0 && (
                <button
                  onClick={() => { setShowArticles(!showArticles); setOpenCite(null); }}
                  className="text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
                >
                  {showArticles ? "Hide regulatory provisions" : "Show regulatory provisions"} ({ragCitations.length})
                </button>
              )}
            </div>
            {showArticles && ragCitations.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {ragCitations.map((cite) => {
                  const isCiteOpen = openCite === cite;
                  const text = contextMap.get(cite);
                  return (
                    <div key={cite}>
                      <button
                        onClick={() => setOpenCite(isCiteOpen ? null : cite)}
                        disabled={!text}
                        className={`px-1.5 py-0.5 border rounded font-mono text-xs transition-colors
                          ${text ? "cursor-pointer hover:bg-gray-100" : "cursor-default"}
                          ${isCiteOpen ? "bg-gray-100 text-gray-700 border-gray-300" : "bg-gray-50 text-gray-500 border-gray-200"}`}
                      >
                        {cite}
                      </button>
                      {isCiteOpen && text && (
                        <div className="mt-1 pl-2 border-l-2 border-gray-200 bg-gray-50/50 rounded-r py-1 pr-2">
                          <p className="text-xs text-gray-600 italic leading-relaxed">{text}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EnhancedModuleCard({
  module,
  priorityBadge,
  assessmentIcon,
  categoryBadge,
}: {
  module: TrainingModuleItem;
  priorityBadge: (p: string) => string;
  assessmentIcon: Record<string, string>;
  categoryBadge: Record<string, string>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 text-sm">{module.title}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge(module.priority)}`}>
              {module.priority}
            </span>
            {module.humanReviewRequired && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                ⚠️ Review needed
              </span>
            )}
          </div>

          {/* Why included — always visible */}
          {module.whyIncluded && (
            <p className="text-xs text-gray-500 italic mb-2">💡 {module.whyIncluded}</p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-2">
            <span>⏱ {module.durationMinutes} min</span>
            <span>📋 {module.primaryRequirement}</span>
            <span>{assessmentIcon[module.assessmentMethod] ?? '📝'} {module.assessmentMethod?.replace(/_/g, ' ')}</span>
          </div>

          {/* Competency categories */}
          {module.competencyCategoriesCovered.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {module.competencyCategoriesCovered.map((cat) => (
                <span key={cat} className={`text-xs px-2 py-0.5 border rounded ${categoryBadge[cat] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  {cat}
                </span>
              ))}
            </div>
          )}

          {/* Expand/collapse for details */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
          >
            {expanded ? 'Hide details ▲' : 'Show details ▼'}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3">
              {/* Description */}
              <p className="text-sm text-gray-600">{module.description}</p>

              {/* Review reason */}
              {module.humanReviewRequired && module.reviewReason && (
                <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                  <span className="shrink-0">⚠️</span>
                  <span>{module.reviewReason}</span>
                </div>
              )}

              {/* Linked risks */}
              {module.linkedRisks && module.linkedRisks.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Risk Categories:</p>
                  <div className="flex flex-wrap gap-1">
                    {module.linkedRisks.map((risk) => (
                      <span key={risk} className="text-xs px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded">
                        {risk.replace(/-/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Competency breakdown K/S/J */}
              {module.linkedCompetenciesByCategory && (
                <div className="space-y-2">
                  {module.linkedCompetenciesByCategory.knowledge.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-blue-700 mb-1">📘 Knowledge</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {module.linkedCompetenciesByCategory.knowledge.map((k, i) => (
                          <li key={i} className="text-xs text-gray-600">{k}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {module.linkedCompetenciesByCategory.skills.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-green-700 mb-1">🛠 Skills</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {module.linkedCompetenciesByCategory.skills.map((s, i) => (
                          <li key={i} className="text-xs text-gray-600">{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {module.linkedCompetenciesByCategory.judgement.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-purple-700 mb-1">⚖️ Judgement</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {module.linkedCompetenciesByCategory.judgement.map((j, i) => (
                          <li key={i} className="text-xs text-gray-600">{j}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Learning objectives */}
              {module.learningObjectives.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Learning Objectives:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {module.learningObjectives.slice(0, 5).map((obj, i) => (
                      <li key={i} className="text-xs text-gray-600">{obj}</li>
                    ))}
                    {module.learningObjectives.length > 5 && (
                      <li className="text-xs text-gray-400">+{module.learningObjectives.length - 5} more…</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Regulatory basis */}
              {module.regulatoryBasis.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Regulatory Basis:</p>
                  <div className="flex flex-wrap gap-1">
                    {module.regulatoryBasis.map((basis, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded font-mono">
                        {basis}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Linked task IDs */}
              {module.linkedTaskIds.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Linked Tasks:</p>
                  <div className="flex flex-wrap gap-1">
                    {module.linkedTaskIds.map((id) => (
                      <span key={id} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono">{id}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Linked competency IDs */}
              {module.linkedCompetencyIds.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Linked Competencies:</p>
                  <div className="flex flex-wrap gap-1">
                    {module.linkedCompetencyIds.map((id) => (
                      <span key={id} className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded font-mono">{id}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
