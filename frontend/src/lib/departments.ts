export type DepartmentBadgeVariant = "ecodim" | "presse" | "ccjv" | "neutral";

export interface DepartmentBadgeInfo {
  label: string;
  variant: DepartmentBadgeVariant;
}

export const ECODIM_DEPARTMENT_ID = "d0000000-0000-4000-8000-000000000004";
export const PRESSE_DEPARTMENT_ID = "d0000000-0000-4000-8000-00000000000a";

/**
 * Détermine le badge et libellé de département pour une entité (publication, enseignement, agenda, ressource).
 */
export function getDepartmentBadge(
  departmentId?: string | null,
  scope?: string | null,
): DepartmentBadgeInfo {
  if (departmentId === ECODIM_DEPARTMENT_ID || scope === "ECODIM") {
    return { label: "Ecodim", variant: "ecodim" };
  }
  if (departmentId === PRESSE_DEPARTMENT_ID) {
    return { label: "Presse", variant: "presse" };
  }
  if (departmentId === "d0000000-0000-4000-8000-000000000001") {
    return { label: "Les Serviteurs", variant: "neutral" };
  }
  if (
    departmentId === "d0000000-0000-4000-8000-000000000002" ||
    departmentId === "d0000000-0000-4000-8000-000000000003"
  ) {
    return { label: "Chorale", variant: "neutral" };
  }
  if (departmentId === "d0000000-0000-4000-8000-000000000005") {
    return { label: "Affaires Sociales", variant: "neutral" };
  }
  if (departmentId === "d0000000-0000-4000-8000-000000000007") {
    return { label: "Protocole", variant: "neutral" };
  }
  if (departmentId === "d0000000-0000-4000-8000-000000000008") {
    return { label: "Évangélisation", variant: "neutral" };
  }
  if (departmentId === "d0000000-0000-4000-8000-000000000009") {
    return { label: "Intercession", variant: "neutral" };
  }
  return { label: "Général CCJV", variant: "ccjv" };
}

/**
 * Classes Tailwind v4 conformes au contrat de design system CCJV (docs/037 : rounded-none, contrastes WCAG AA).
 */
export const departmentBadgeStyles: Record<DepartmentBadgeVariant, string> = {
  ecodim: "bg-amber-100 text-amber-900 border border-amber-300",
  presse: "bg-blue-100 text-blue-900 border border-blue-300",
  ccjv: "bg-[#eaf3ea] text-[#1e7a1e] border border-[#1e7a1e]/30",
  neutral: "bg-[#f3f2ee] text-[#5e5d59] border border-[#e5e2d9]",
};

