import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// ─── GET /api/comments/[listingId] ──────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params;

    // Verify the listing exists
    const listing = await db.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    // Fetch top-level comments with one level of replies
    const comments = await db.comment.findMany({
      where: {
        listingId,
        parentId: null, // Only top-level comments
      },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
            role: true,
          },
        },
        replies: {
          orderBy: { createdAt: "asc" },
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
        },
      },
    });

    // Format the response
    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
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
      replies: comment.replies.map((reply) => ({
        id: reply.id,
        body: reply.body,
        isSellerResponse: reply.isSellerResponse,
        isPinned: reply.isPinned,
        createdAt: reply.createdAt.toISOString(),
        updatedAt: reply.updatedAt.toISOString(),
        user: {
          id: reply.user.id,
          name: reply.user.name,
          profileImageUrl: reply.user.profileImageUrl,
          role: reply.user.role,
        },
      })),
    }));

    return NextResponse.json({ comments: formattedComments });
  } catch (error) {
    console.error("[GET /api/comments/[listingId]] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}
