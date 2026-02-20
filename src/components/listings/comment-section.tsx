"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { MessageSquare, Reply, Send, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

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
        isSeller
          ? "border-l-4 border-brand-500 bg-brand-50/30 pl-4"
          : isReply
            ? "pl-4"
            : ""
      }`}
    >
      <div className="py-3">
        {/* Header */}
        <div className="mb-1.5 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-gray-600">
            <UserIcon className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-gray-900">
            {comment.user.name || "Anonymous"}
          </span>
          {isSeller && (
            <Badge variant="brand" className="text-[10px]">
              Seller
            </Badge>
          )}
          {comment.isPinned && (
            <Badge variant="navy" className="text-[10px]">
              Pinned
            </Badge>
          )}
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
        <p className="whitespace-pre-wrap text-sm text-gray-700">
          {comment.body}
        </p>

        {/* Reply button (only for top-level comments) */}
        {!isReply && session?.user && (
          <button
            type="button"
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-brand-600"
          >
            <Reply className="h-3.5 w-3.5" />
            Reply
          </button>
        )}

        {/* Reply form */}
        {showReplyForm && (
          <div className="mt-3 space-y-2 pl-9">
            <Textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Write a reply..."
              className="min-h-[60px]"
            />
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSubmitReply}
                disabled={isSubmitting || !replyBody.trim()}
                size="sm"
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                {isSubmitting ? "Posting..." : "Reply"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyBody("");
                }}
              >
                Cancel
              </Button>
            </div>
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </div>
        )}
      </div>

      {/* Nested replies (one level deep) */}
      {replies.length > 0 && (
        <div className="ml-9 space-y-0 border-l border-gray-200">
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
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
        <MessageSquare className="h-5 w-5 text-brand-600" />
        Comments
        <span className="text-sm font-normal text-gray-500">
          ({topLevel.length})
        </span>
      </h3>

      {/* Comment form */}
      {session?.user ? (
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <Textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="Ask the seller a question or leave a comment..."
            className="min-h-[80px]"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Be respectful. Questions about the truck are encouraged.
            </p>
            <Button
              onClick={handleSubmitComment}
              disabled={isSubmitting || !newBody.trim()}
              size="sm"
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {isSubmitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
          <p className="mb-2 text-sm text-gray-600">
            Sign in to leave a comment or ask a question
          </p>
          <Link href="/auth/signin">
            <Button variant="default" size="sm">Sign In</Button>
          </Link>
        </div>
      )}

      {/* Comment list */}
      {topLevel.length > 0 ? (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {topLevel.map((comment) => (
            <div key={comment.id} className="px-4">
              <CommentItem
                comment={comment}
                sellerId={sellerId}
                listingId={listingId}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">
            No comments yet. Be the first to ask a question!
          </p>
        </div>
      )}
    </div>
  );
}
