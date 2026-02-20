"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Reply, Send, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommentUser {
  id: string;
  name: string | null;
  profileImageUrl: string | null;
}

interface CommentData {
  id: string;
  body: string;
  isSellerResponse: boolean;
  isPinned: boolean;
  createdAt: string | Date;
  user: CommentUser;
  parentId: string | null;
  replies: CommentData[];
}

interface CommentSectionProps {
  listingId: string;
  sellerId: string;
  comments: CommentData[];
}

// ─── Single comment ───────────────────────────────────────────────────────────

function CommentItem({
  comment,
  sellerId,
  listingId,
  isReply,
}: {
  comment: CommentData;
  sellerId: string;
  listingId: string;
  isReply?: boolean;
}) {
  const { data: session } = useSession();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replies, setReplies] = useState<CommentData[]>(comment.replies ?? []);

  const isSeller = comment.user.id === sellerId;
  const date = new Date(comment.createdAt);

  async function handleSubmitReply() {
    if (!replyBody.trim() || !session?.user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          body: replyBody.trim(),
          parentId: comment.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to post reply");
      }

      const newComment: CommentData = await res.json();
      setReplies((prev) => [...prev, newComment]);
      setReplyBody("");
      setShowReplyForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post reply");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className={`${
        isSeller ? "border-l-2 border-brand-600 pl-4" : isReply ? "pl-4" : ""
      }`}
    >
      <div className="py-3">
        {/* Header */}
        <div className="mb-1 flex items-center gap-2">
          {/* Avatar */}
          {comment.user.profileImageUrl ? (
            <img
              src={comment.user.profileImageUrl}
              alt=""
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <UserIcon className="h-3 w-3" />
            </div>
          )}

          {/* Name */}
          <span
            className={`text-sm font-medium ${
              isSeller ? "text-brand-700" : "text-gray-900"
            }`}
          >
            {comment.user.name || "Anonymous"}
          </span>

          {/* Seller tag */}
          {isSeller && (
            <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
              Seller
            </span>
          )}

          {/* Pinned tag */}
          {comment.isPinned && (
            <span className="rounded bg-navy-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy-600">
              Pinned
            </span>
          )}

          {/* Separator dot */}
          <span className="text-gray-300">&middot;</span>

          {/* Timestamp */}
          <span className="text-xs text-gray-400">
            {date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            at{" "}
            {date.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Body */}
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {comment.body}
        </p>

        {/* Reply button (only for top-level comments) */}
        {!isReply && session?.user && (
          <button
            type="button"
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-gray-400 transition-colors hover:text-brand-600"
          >
            <Reply className="h-3 w-3" />
            Reply
          </button>
        )}

        {/* Reply form */}
        {showReplyForm && (
          <div className="mt-3 space-y-2 pl-8">
            <Textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Write a reply..."
              className="min-h-[60px] border-gray-200 text-sm"
            />
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSubmitReply}
                disabled={isSubmitting || !replyBody.trim()}
                size="sm"
              >
                <Send className="mr-1.5 h-3 w-3" />
                {isSubmitting ? "Posting..." : "Reply"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyBody("");
                }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </div>
        )}
      </div>

      {/* Nested replies (one level deep) */}
      {replies.length > 0 && (
        <div className="ml-8 border-l border-gray-100">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              sellerId={sellerId}
              listingId={listingId}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CommentSection({
  listingId,
  sellerId,
  comments: initialComments,
}: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [newBody, setNewBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show top-level comments (no parentId)
  const topLevel = comments.filter((c) => !c.parentId);

  async function handleSubmitComment() {
    if (!newBody.trim() || !session?.user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          body: newBody.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to post comment");
      }

      const newComment: CommentData = await res.json();
      setComments((prev) => [...prev, newComment]);
      setNewBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      {/* ── Section header ── */}
      <div className="mb-4 flex items-baseline gap-2 border-b border-gray-200 pb-3">
        <h3 className="text-lg font-semibold text-navy-900">
          Comments
        </h3>
        <span className="text-sm text-gray-400">
          ({topLevel.length})
        </span>
      </div>

      {/* ── Comment form ── */}
      {session?.user ? (
        <div className="mb-6">
          <Textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="Ask the seller a question or leave a comment..."
            className="min-h-[80px] border-gray-200 text-sm"
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Be respectful. Questions about the truck are encouraged.
            </p>
            <Button
              onClick={handleSubmitComment}
              disabled={isSubmitting || !newBody.trim()}
              size="sm"
            >
              <Send className="mr-1.5 h-3 w-3" />
              {isSubmitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      ) : (
        <div className="mb-6 border-b border-gray-100 pb-6 text-center">
          <p className="mb-2 text-sm text-gray-500">
            Sign in to leave a comment or ask a question
          </p>
          <Link href="/auth/signin">
            <Button variant="default" size="sm">Sign In</Button>
          </Link>
        </div>
      )}

      {/* ── Comment list ── */}
      {topLevel.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {topLevel.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              sellerId={sellerId}
              listingId={listingId}
            />
          ))}
        </div>
      ) : (
        <div className="py-10 text-center">
          <p className="text-sm text-gray-400">
            No comments yet. Be the first to ask a question!
          </p>
        </div>
      )}
    </div>
  );
}
