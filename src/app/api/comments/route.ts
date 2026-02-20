import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── Validation schema ──────────────────────────────────────────────────────

const commentSchema = z.object({
  listingId: z.string().min(1, "Listing ID is required"),
  body: z.string().min(1, "Comment body is required").max(2000, "Comment is too long"),
  parentId: z.string().optional(),
});

// ─── POST /api/comments ─────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to post a comment" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = commentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { listingId, body: commentBody, parentId } = parsed.data;

    // Verify the listing exists
    const listing = await db.listing.findUnique({
      where: { id: listingId },
      select: { id: true, sellerId: true },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    // If replying to a comment, verify the parent exists and belongs to the same listing
    if (parentId) {
      const parentComment = await db.comment.findUnique({
        where: { id: parentId },
        select: { id: true, listingId: true, parentId: true },
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }

      if (parentComment.listingId !== listingId) {
        return NextResponse.json(
          { error: "Parent comment does not belong to this listing" },
          { status: 400 }
        );
      }

      // Only allow one level of nesting
      if (parentComment.parentId) {
        return NextResponse.json(
          { error: "Cannot reply to a reply. Please reply to the original comment." },
          { status: 400 }
        );
      }
    }

    // Automatically mark as seller response if user is the listing seller
    const isSellerResponse = listing.sellerId === session.user.id;

    const comment = await db.comment.create({
      data: {
        listingId,
        userId: session.user.id,
        body: commentBody,
        parentId: parentId ?? null,
        isSellerResponse,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      comment: {
        id: comment.id,
        listingId: comment.listingId,
        body: comment.body,
        parentId: comment.parentId,
        isSellerResponse: comment.isSellerResponse,
        isPinned: comment.isPinned,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        user: {
          id: comment.user.id,
          name: comment.user.name,
          profileImageUrl: comment.user.profileImageUrl,
          role: comment.user.role,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("[POST /api/comments] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong while posting your comment" },
      { status: 500 }
    );
  }
}
