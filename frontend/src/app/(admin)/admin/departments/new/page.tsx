"use client";

import React from "react";
import { DepartmentForm } from "@/components/admin/forms/DepartmentForm";
import { createDepartment, saveDepartmentActivities } from "@/lib/api";

export default function NewDepartmentPage() {
  const handleCreate = async ({
    department,
    activities,
  }: {
    department: Record<string, unknown>;
    activities: { title: string; description?: string | null; imageMediaId?: string | null; position?: number }[];
  }) => {
    const created = await createDepartment(
      department as unknown as Parameters<typeof createDepartment>[0],
    );
    if (activities.length > 0 && created.id) {
      await saveDepartmentActivities(created.id, activities);
    }
  };

  return (
    <div className="space-y-6">
      <DepartmentForm onSubmit={handleCreate} isEditing={false} />
    </div>
  );
}
