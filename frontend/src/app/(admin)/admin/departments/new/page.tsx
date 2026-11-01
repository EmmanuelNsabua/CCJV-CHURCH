"use client";

import { DepartmentForm, type DepartmentFormSubmitPayload } from "@/components/admin/forms/DepartmentForm";
import { createDepartment, saveDepartmentActivities, createLeader, updateLeader } from "@/lib/api";

export default function NewDepartmentPage() {
  const handleCreate = async ({
    department,
    activities,
    leader,
  }: DepartmentFormSubmitPayload) => {
    const created = await createDepartment(
      department as unknown as Parameters<typeof createDepartment>[0],
    );
    if (created.id) {
      if (activities.length > 0) {
        await saveDepartmentActivities(created.id, activities);
      }
      if (leader) {
        if (leader.id) {
          await updateLeader(leader.id, {
            name: leader.name,
            role: leader.role,
            photoMediaId: leader.photoMediaId ?? null,
            departmentId: created.id,
          });
        } else {
          await createLeader({
            name: leader.name,
            role: leader.role,
            photoMediaId: leader.photoMediaId ?? null,
            departmentId: created.id,
            position: 0,
          });
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <DepartmentForm onSubmit={handleCreate} isEditing={false} />
    </div>
  );
}
