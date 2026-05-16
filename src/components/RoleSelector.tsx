"use client";

import { Role } from "@/types";

interface RoleSelectorProps {
  roles: Role[];
  selectedRole: Role | null;
  onSelectRole: (role: Role | null) => void;
}

export default function RoleSelector({
  roles,
  selectedRole,
  onSelectRole,
}: RoleSelectorProps) {
  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Select Role
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Choose a role to generate a compliance training plan based on their
        responsibilities and risk profile.
      </p>

      <div className="space-y-3">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => onSelectRole(role.id === selectedRole?.id ? null : role)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
              selectedRole?.id === role.id
                ? "border-blue-500 bg-blue-50 shadow-sm"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{role.name}</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {role.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">
                    {role.department}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full border ${getRiskBadgeColor(
                      role.riskLevel
                    )}`}
                  >
                    {role.riskLevel.charAt(0).toUpperCase() +
                      role.riskLevel.slice(1)}{" "}
                    Risk
                  </span>
                </div>
              </div>
              {selectedRole?.id === role.id && (
                <svg
                  className="w-5 h-5 text-blue-500 flex-shrink-0 ml-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      {selectedRole && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Key Tasks:
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {selectedRole.tasks.slice(0, 4).map((task, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                {task}
              </li>
            ))}
            {selectedRole.tasks.length > 4 && (
              <li className="text-gray-500 italic">
                +{selectedRole.tasks.length - 4} more tasks
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}