"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface AdminReviewActionsProps {
  listingId: string;
}

export function AdminReviewActions({ listingId }: AdminReviewActionsProps) {
  const router = useRouter();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReview(action: "approve" | "reject") {
    if (action === "reject" && !rejectReason.trim()) {
      setError("Please provide a reason for rejection.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/listings/${listingId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: action === "reject" ? rejectReason : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to process review.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-yellow-700">
        This listing is awaiting your review. Approving will set it live with a
        7-day auction window.
      </p>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!showRejectForm ? (
        <div className="flex gap-3">
          <Button
            onClick={() => handleReview("approve")}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Approve
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowRejectForm(true)}
            disabled={isLoading}
            className="flex-1"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Reject
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Textarea
            label="Rejection reason"
            placeholder="Explain why this listing is being rejected..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
          <div className="flex gap-3">
            <Button
              variant="destructive"
              onClick={() => handleReview("reject")}
              disabled={isLoading || !rejectReason.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Confirm Rejection
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectForm(false);
                setRejectReason("");
                setError(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
