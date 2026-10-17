"use client";

import React from "react";
import { PublicationForm } from "@/components/admin/forms/PublicationForm";
import { createAdminPublication } from "@/lib/api/endpoints";
import type { CreatePublicationPayload } from "@/lib/api/types";

export default function NewPublicationPage() {
  const handleSubmit = async (payload: CreatePublicationPayload) => {
    await createAdminPublication(payload as unknown as Record<string, unknown>);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PublicationForm onSubmit={handleSubmit} isEditing={false} />
    </div>
  );
}
