"use client";

import React from "react";
import { EventForm } from "@/components/admin/forms/EventForm";
import { createAdminEvent } from "@/lib/api/endpoints";

export default function NewEventPage() {
  const handleSubmit = async (payload: Record<string, unknown>) => {
    await createAdminEvent(payload);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <EventForm onSubmit={handleSubmit} isEditing={false} />
    </div>
  );
}
