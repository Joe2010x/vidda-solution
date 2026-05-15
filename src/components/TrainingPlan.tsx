"use client";

import { TrainingPlan, TrainingPlanItem } from "@/types";

interface TrainingPlanProps {
  trainingPlan: TrainingPlan | null;
  mappedRisks: string[];
  competencyNeeds: string[];
}

export default function TrainingPlanComponent({
  trainingPlan,
  mappedRisks,
  competencyNeeds,
}: TrainingPlanProps) {
  if (!trainingPlan) {
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
          {mappedRisks.map((risk) => (
            <span
              key={risk}
              className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded"
            >
              {risk.replace(/-/g, " ")}
            </span>
          ))}
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
  getPriorityColor,
  getModuleTypeIcon,
}: {
  item: TrainingPlanItem;
  getPriorityColor: (priority: number) => string;
  getModuleTypeIcon: (type: string) => string;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{getModuleTypeIcon(item.module.type)}</span>
            <h4 className="font-medium text-gray-900">{item.module.title}</h4>
            <span
              className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(
                item.priority
              )}`}
            >
              Priority: {item.priority}/10
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{item.module.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>⏱ {item.estimatedDuration} min</span>
            <span>📋 {item.requirement.title}</span>
            <span className="text-gray-400">{item.requirement.regulatoryReference}</span>
          </div>
        </div>
      </div>
    </div>
  );
}