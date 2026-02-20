"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-red-100 p-3">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>

          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Payment Cancelled
          </h1>
          <p className="mb-6 text-gray-500">
            Your payment was not completed. No charges have been made. You can
            try again whenever you are ready.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/dashboard">
              <Button variant="default">Back to Dashboard</Button>
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
