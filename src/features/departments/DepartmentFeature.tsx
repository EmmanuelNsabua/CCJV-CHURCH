import Image from "next/image";
import type { Department } from "@/types";

/**
 * Département en composition éditoriale : photographie (motif d'arche), numéro,
 * nom en Lora, description. Remplace la carte uniforme.
 */
export function DepartmentFeature({
  department,
  image,
  index,
}: {
  department: Department;
  image: string;
  index: number;
}) {
  return (
    <article className="flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-full bg-ccjv-line">
        <Image
          src={image}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
      </div>
      <p className="mt-6 font-sans text-xs font-semibold tracking-[0.16em] text-ccjv-green uppercase">
        {String(index + 1).padStart(2, "0")}
      </p>
      <h3 className="mt-3 font-serif text-[1.4rem]">{department.name}</h3>
      {department.description && (
        <p className="mt-3 text-ccjv-ink-secondary">{department.description}</p>
      )}
      {department.responsibleName && (
        <p className="mt-4 font-sans text-xs font-semibold tracking-[0.08em] text-ccjv-ink-secondary uppercase">
          Responsable · {department.responsibleName}
        </p>
      )}
    </article>
  );
}
