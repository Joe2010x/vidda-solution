"use client";

import { ReviewStatus, ReviewComment } from "@/types";

interface HumanReviewProps {
  reviewStatus: ReviewStatus | null;
  onApprove: (comment: string) => void;
  onReject: (comment: string) => void;
  onNeedsRevision: (comment: string) => void;
}

export default function HumanReviewComponent({
  reviewStatus,
  onApprove,
  onReject,
  onNeedsRevision,
}: HumanReviewProps) {
  const getStatusColor = () => {
    switch (reviewStatus?.status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "needs_revision":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = () => {
    switch (reviewStatus?.status) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "needs_revision":
        return "Needs Revision";
      default:
        return "Pending Review";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Human Review
      </h2>

      {/* Status Display */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Current Status:</span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor()}`}
          >
            {getStatusText()}
          </span>
        </div>
        {reviewStatus && (
          <p className="text-xs text-gray-500">
            Last updated: {new Date(reviewStatus.lastUpdated).toLocaleString()}
          </p>
        )}
      </div>

      {/* Review Actions - Only show if pending */}
      {(!reviewStatus || reviewStatus.status === "pending") && (
        <ReviewActions
          onApprove={onApprove}
          onReject={onReject}
          onNeedsRevision={onNeedsRevision}
        />
      )}

      {/* Comments History */}
      {reviewStatus && reviewStatus.comments.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Review Comments:
          </h3>
          <div className="space-y-3">
            {reviewStatus.comments.map((comment) => (
              <ReviewCommentCard key={comment.id} comment={comment} />
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Review Guidelines:
        </h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Verify that all high-risk areas are adequately covered</li>
          <li>• Check that training duration is appropriate for the role</li>
          <li>• Ensure module selection aligns with job responsibilities</li>
          <li>• Review quality score and recommendations</li>
        </ul>
      </div>
    </div>
  );
}

function ReviewActions({
  onApprove,
  onReject,
  onNeedsRevision,
}: {
  onApprove: (comment: string) => void;
  onReject: (comment: string) => void;
  onNeedsRevision: (comment: string) => void;
}) {
  const handleSubmit = (
    action: "approve" | "reject" | "needs_revision",
    comment: string
  ) => {
    switch (action) {
      case "approve":
        onApprove(comment);
        break;
      case "reject":
        onReject(comment);
        break;
      case "needs_revision":
        onNeedsRevision(comment);
        break;
    }
  };

  return (
    <div className="border-t pt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Take Action:
      </h3>

      <div className="space-y-3">
        <ActionForm
          action="approve"
          label="Approve"
          description="Approve this training plan as-is"
          color="green"
          onSubmit={handleSubmit}
        />
        <ActionForm
          action="needs_revision"
          label="Needs Revision"
          description="Request changes before approval"
          color="yellow"
          onSubmit={handleSubmit}
        />
        <ActionForm
          action="reject"
          label="Reject"
          description="Reject this training plan entirely"
          color="red"
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

function ActionForm({
  action,
  label,
  description,
  color,
  onSubmit,
}: {
  action: "approve" | "reject" | "needs_revision";
  label: string;
  description: string;
  color: "green" | "yellow" | "red";
  onSubmit: (action: "approve" | "reject" | "needs_revision", comment: string) => void;
}) {
  const getButtonColor = () => {
    switch (color) {
      case "green":
        return "bg-green-600 hover:bg-green-700 text-white";
      case "yellow":
        return "bg-yellow-600 hover:bg-yellow-700 text-white";
      case "red":
        return "bg-red-600 hover:bg-red-700 text-white";
    }
  };

  return (
    <div className="flex gap-3">
      <div className="flex-1">
        <textarea
          placeholder={`Comment for ${label.toLowerCase()} (optional)...`}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          id={`comment-${action}`}
        />
      </div>
      <button
        onClick={() => {
          const commentEl = document.getElementById(
            `comment-${action}`
          ) as HTMLTextAreaElement;
          onSubmit(action, commentEl?.value || "");
        }}
        className={`px-4 py-2 rounded-lg font-medium text-sm ${getButtonColor()} transition-colors self-end`}
      >
        {label}
      </button>
    </div>
  );
}

function ReviewCommentCard({ comment }: { comment: ReviewComment }) {
  const getRatingColor = () => {
    switch (comment.rating) {
      case "approve":
        return "bg-green-100 text-green-800";
      case "reject":
        return "bg-red-100 text-red-800";
      case "needs_revision":
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-800">
            {comment.reviewerName}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded ${getRatingColor()}`}
          >
            {comment.rating.replace("_", " ")}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(comment.createdAt).toLocaleString()}
        </span>
      </div>
      {comment.comment && (
        <p className="text-sm text-gray-700">{comment.comment}</p>
      )}
    </div>
  );
}