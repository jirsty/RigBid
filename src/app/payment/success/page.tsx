"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Payment Successful
          </h1>
          <p className="mb-6 text-gray-500">
            Your payment has been processed successfully. You will receive a
            confirmation email shortly.
          </p>

          {sessionId && (
            <p className="mb-6 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-400">
              Session: {sessionId}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/dashboard">
              <Button variant="default">Go to Dashboard</Button>
            </Link>
            <Link href="/dashboard/listings">
              <Button variant="outline">View My Listings</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
