"use client";

import { LMSAssignment } from "@/types";

interface LMSAssignmentProps {
  assignments: LMSAssignment[];
  onAssignTraining: (roleId: string, roleName: string) => void;
}

export default function LMSAssignmentComponent({
  assignments,
  onAssignTraining,
}: LMSAssignmentProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          LMS Assignments
        </h2>
        <span className="text-sm text-gray-500">
          {assignments.length} total assignments
        </span>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No training assignments yet</p>
          <p className="text-sm mt-1">
            Approve a training plan to create an LMS assignment
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Training Plan
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Plan #{assignment.id.slice(-4).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {assignment.roleName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="flex -space-x-2">
                      {assignment.assignedTo.slice(0, 3).map((userId, idx) => (
                        <div
                          key={idx}
                          className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium"
                          title={`User ${userId}`}
                        >
                          {userId.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {assignment.assignedTo.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-medium">
                          +{assignment.assignedTo.length - 3}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {new Date(assignment.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge status={assignment.status} />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${assignment.completionRate}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {assignment.completionRate}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() =>
                        alert(`Viewing details for assignment ${assignment.id}`)
                      }
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "assigned" | "in_progress" | "completed" | "overdue";
}) {
  const getStatusStyles = () => {
    switch (status) {
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "assigned":
        return "Assigned";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "overdue":
        return "Overdue";
      default:
        return status;
    }
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles()}`}
    >
      {getStatusText()}
    </span>
  );
}