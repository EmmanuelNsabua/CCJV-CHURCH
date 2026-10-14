"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TeachingForm } from "@/components/admin/forms/TeachingForm";
import { getEnseignement } from "@/lib/api/endpoints";
import type { EnseignementRecord } from "@/lib/api/types";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function EditTeachingPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const [teaching, setTeaching] = useState<EnseignementRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getEnseignement(id)
      .then((data) => {
        if (!data) {
          setError("Enseignement introuvable.");
        } else {
          setTeaching(data);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-ccjv-surface animate-pulse" />
        <div className="h-96 w-full bg-ccjv-surface animate-pulse" />
      </div>
    );
  }

  if (error || !teaching) {
    return (
      <div className="bg-white p-8 border border-ccjv-border text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
        <h2 className="text-base font-bold font-serif text-ccjv-ink">
          {error || "Enseignement introuvable"}
        </h2>
        <p className="text-xs text-ccjv-ink-secondary">
          L'enseignement demandé n'existe pas ou a été supprimé.
        </p>
        <Link href="/admin/enseignements">
          <Button size="sm" variant="outline">
            Retour à la liste
          </Button>
        </Link>
      </div>
    );
  }

  return <TeachingForm initialData={teaching} isEditing={true} />;
}
