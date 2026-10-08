-- Lot 2 — capacités de département (docs/028 D-25, docs/032 §3.5).
--
-- Migration **purement additive** : une seule table créée, aucune colonne
-- modifiée, aucune donnée touchée. Elle ne figure donc PAS dans la catégorie des
-- opérations destructrices de docs/033 (archivage de publications, suppression de
-- prayer_requests, reconstruction d'énumérations) — mais elle n'est **pas
-- appliquée** pour autant : comme 0001, elle est préparée et attend le feu vert
-- du commanditaire.
--
-- Conformité à docs/032 §3.5, point par point :
--   · clé primaire composée (department_id, capability) — une capacité est un
--     attribut du département, pas une entité autonome ;
--   · CHECK sur `capability` : vocabulaire FERMÉ, une seule valeur
--     ('EVENT_SCOPE_GLOBAL'). Aucune capacité n'est inventée ; le CHECK s'élargit
--     par décision explicite, jamais par commodité ;
--   · FK department_id ON DELETE CASCADE — une capacité sans département n'a
--     aucun sens ;
--   · FK granted_by ON DELETE RESTRICT — l'auteur d'un grant est conservé, sinon
--     l'autorisation deviendrait inattribuable ;
--   · granted_by NULLABLE : docs/032 §3.5 le prévoit, et c'est cohérent avec
--     l'absence d'arbitrage de Q-06 (une capacité peut avoir été posée par une
--     migration, sans auteur applicatif) ;
--   · index par `capability` : c'est le SENS DE LECTURE RÉEL — « quels
--     départements peuvent publier globalement ? » — celui du trigger de portée
--     (docs/032 §3.6) et de la résolution des capacités d'un acteur.
--
-- Ce fichier est GÉNÉRÉ par `npm run db:generate` ; aucune correction manuelle
-- n'a été nécessaire (contrairement à 0001, dont trois points devaient être
-- repris à la main).

CREATE TABLE "department_capabilities" (
	"department_id" uuid NOT NULL,
	"capability" varchar(60) NOT NULL,
	"granted_by" uuid,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "department_capabilities_department_id_capability_pk" PRIMARY KEY("department_id","capability"),
	CONSTRAINT "department_capabilities_known_capability" CHECK ("department_capabilities"."capability" IN ('EVENT_SCOPE_GLOBAL'))
);
--> statement-breakpoint
ALTER TABLE "department_capabilities" ADD CONSTRAINT "department_capabilities_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_capabilities" ADD CONSTRAINT "department_capabilities_granted_by_admin_profiles_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."admin_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "department_capabilities_capability_idx" ON "department_capabilities" USING btree ("capability");