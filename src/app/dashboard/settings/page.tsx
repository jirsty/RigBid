"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Save, Loader2 } from "lucide-react";

interface ProfileFormData {
  name: string;
  phone: string;
  bio: string;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    phone: "",
    bio: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch current profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setFormData({
            name: data.name || "",
            phone: data.phone || "",
            bio: data.bio || "",
          });
        }
      } catch {
        // Use session data as fallback
        if (session?.user) {
          setFormData((prev) => ({
            ...prev,
            name: session.user.name || "",
          }));
        }
      } finally {
        setIsFetching(false);
      }
    }

    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, session]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear feedback on change
    if (feedback) setFeedback(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.error || "Failed to update profile"
        );
      }

      setFeedback({
        type: "success",
        message: "Profile updated successfully.",
      });

      // Auto-dismiss after 4 seconds
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (status === "loading" || isFetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update your profile information
        </p>
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4 text-brand-600" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email (read only) */}
            <div>
              <Input
                id="email"
                label="Email"
                type="email"
                value={session?.user?.email || ""}
                disabled
                className="bg-gray-50"
              />
              <p className="mt-1 text-xs text-gray-400">
                Email cannot be changed
              </p>
            </div>

            {/* Name */}
            <Input
              id="name"
              name="name"
              label="Full Name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
            />

            {/* Phone */}
            <Input
              id="phone"
              name="phone"
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(555) 123-4567"
            />

            {/* Bio */}
            <Textarea
              id="bio"
              name="bio"
              label="Bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell other users a bit about yourself or your business..."
              rows={4}
            />

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
