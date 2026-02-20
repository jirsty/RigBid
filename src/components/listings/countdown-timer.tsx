"use client";

import { useState, useEffect } from "react";
import { getTimeRemaining } from "@/lib/utils";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  endTime: Date;
  compact?: boolean;
  onEnd?: () => void;
}

export function CountdownTimer({ endTime, compact, onEnd }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(endTime));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getTimeRemaining(endTime);
      setTimeLeft(remaining);
      if (remaining.total <= 0) {
        clearInterval(interval);
        onEnd?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, onEnd]);

  if (timeLeft.total <= 0) {
    return (
      <span className="text-sm font-medium text-red-600">Auction ended</span>
    );
  }

  const isUrgent = timeLeft.total < 60 * 60 * 1000; // < 1 hour

  if (compact) {
    if (timeLeft.days > 0) {
      return (
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="h-3.5 w-3.5" />
          {timeLeft.days}d {timeLeft.hours}h
        </span>
      );
    }
    return (
      <span
        className={`flex items-center gap-1 text-xs font-medium ${
          isUrgent ? "text-red-600" : "text-gray-500"
        }`}
      >
        <Clock className="h-3.5 w-3.5" />
        {String(timeLeft.hours).padStart(2, "0")}:
        {String(timeLeft.minutes).padStart(2, "0")}:
        {String(timeLeft.seconds).padStart(2, "0")}
      </span>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 ${isUrgent ? "text-red-600" : "text-gray-700"}`}
    >
      <Clock className="h-5 w-5" />
      <div className="flex gap-2">
        {timeLeft.days > 0 && (
          <div className="text-center">
            <div className="text-xl font-bold">{timeLeft.days}</div>
            <div className="text-xs uppercase text-gray-500">Days</div>
          </div>
        )}
        <div className="text-center">
          <div className="text-xl font-bold">
            {String(timeLeft.hours).padStart(2, "0")}
          </div>
          <div className="text-xs uppercase text-gray-500">Hrs</div>
        </div>
        <div className="text-xl font-bold">:</div>
        <div className="text-center">
          <div className="text-xl font-bold">
            {String(timeLeft.minutes).padStart(2, "0")}
          </div>
          <div className="text-xs uppercase text-gray-500">Min</div>
        </div>
        <div className="text-xl font-bold">:</div>
        <div className="text-center">
          <div className="text-xl font-bold">
            {String(timeLeft.seconds).padStart(2, "0")}
          </div>
          <div className="text-xs uppercase text-gray-500">Sec</div>
        </div>
      </div>
    </div>
  );
}
