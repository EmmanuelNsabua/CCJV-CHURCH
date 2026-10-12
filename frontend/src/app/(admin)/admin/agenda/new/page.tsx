"use client";

import React from "react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { EventForm } from "@/components/admin/forms/EventForm";
import { createAdminEvent } from "@/lib/api/endpoints";

export default function NewEventPage() {
  const handleSubmit = async (payload: Record<string, unknown>) => {
    await createAdminEvent(payload);
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <AdminPageHeader
        title="Programmer un Événement"
        description="Ajoutez un culte, un temps d'intercession, une veillée ou une conférence au calendrier officiel du CCJV."
      />
      <EventForm onSubmit={handleSubmit} isEditing={false} />
    </div>
  );
}
