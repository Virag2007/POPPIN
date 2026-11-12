"use client";

import React from "react";
import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";

interface ReadReceiptProps {
  status?: "pending" | "sent" | "delivered" | "read" | "failed";
  className?: string;
}

export function ReadReceipt({ status = "sent", className = "" }: ReadReceiptProps) {
  switch (status) {
    case "pending":
      return (
        <span title="Sending..." className="inline-flex items-center">
          <Clock className={`w-3 h-3 text-slate-400 animate-spin ${className}`} />
        </span>
      );
    case "failed":
      return (
        <span title="Failed to send" className="inline-flex items-center">
          <AlertCircle className={`w-3 h-3 text-rose-500 ${className}`} />
        </span>
      );
    case "read":
      return (
        <span title="Read" className="inline-flex items-center">
          <CheckCheck className={`w-3.5 h-3.5 text-poppin-lilac ${className}`} />
        </span>
      );
    case "delivered":
      return (
        <span title="Delivered" className="inline-flex items-center">
          <CheckCheck className={`w-3.5 h-3.5 text-slate-400 ${className}`} />
        </span>
      );
    case "sent":
    default:
      return (
        <span title="Sent" className="inline-flex items-center">
          <Check className={`w-3.5 h-3.5 text-slate-400 ${className}`} />
        </span>
      );
  }
}
