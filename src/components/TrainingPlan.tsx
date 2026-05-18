"use client";

import { useState, useMemo } from "react";
import { TrainingPlan, TrainingPlanItem } from "@/types";
import type { EnrichmentResult } from "@/types/rag";

interface TrainingPlanProps {
  trainingPlan: TrainingPlan | null;
  mappedRisks: string[];
  competencyNeeds: string[];
  enrichmentByRisk?: Record<string, EnrichmentResult>;
  enrichmentError?: string | null;
}

export default function TrainingPlanComponent({
  trainingPlan,
  mappedRisks,
  competencyNeeds,
  enrichmentByRisk = {},
  enrichmentError = null,
}: TrainingPlanProps) {
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const [openRiskCite, setOpenRiskCite] = useState<string | null>(null);

  const contextMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const enrichment of Object.values(enrichmentByRisk)) {
      for (const ctx of enrichment.contexts ?? []) {
        map.set(ctx.full_path, ctx.text);
      }
    }
    return map;
  }, [enrichmentByRisk]);

  if (!trainingPlan) {
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
