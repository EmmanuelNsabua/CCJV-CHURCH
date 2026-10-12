"use client";

import React, { useEffect, useState, use } from "react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { EventForm } from "@/components/admin/forms/EventForm";
import { getEvent, updateAdminEvent } from "@/lib/api/endpoints";
import type { Event } from "@/lib/api/types";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/admin/feedback/ToastContext";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditEventPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const toast = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getEvent(resolvedParams.id);
        if (isMounted) {
          setEvent(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Impossible de charger l'événement.";
          setError(msg);
          toast.error("Erreur de chargement.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [resolvedParams.id, toast]);

  const handleUpdate = async (payload: Record<string, unknown>) => {
    if (!event) return;
    const updated = await updateAdminEvent(event.id, payload);
    setEvent(updated);
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-ccjv-line/40 animate-pulse w-1/3" />
        <div className="h-64 bg-ccjv-line/20 animate-pulse" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="p-8 bg-white border border-ccjv-line text-center space-y-4">
        <p className="text-sm font-medium text-[#b91c1c]">{error || "Événement non trouvé."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <AdminPageHeader
        title={`Modifier : ${event.title}`}
        description="Mettez à jour les horaires, le lieu et les informations de ce rassemblement."
        badge={
          <Badge variant={event.status === "UPCOMING" ? "success" : "neutral"}>
            {event.status === "UPCOMING" ? "À venir" : "Passé"}
          </Badge>
        }
      />
      <EventForm
        initialData={event}
        onSubmit={handleUpdate}
        isEditing={true}
      />
    </div>
  );
}
