import { z } from "zod";

/**
 * Entrées des routes `/social-links`.
 *
 * `href` doit être une URL `http`/`https` **valide** : ces liens sont affichés
 * tels quels dans le pied de page et sur la page « nous trouver », un `href`
 * arbitraire (`javascript:`, `data:`) n'a rien à y faire.
 */

export const socialLinkParamsSchema = z.object({ id: z.uuid() });

export const socialLinkCreateSchema = z.object({
  platform: z.string().trim().min(1).max(40).optional(),
  label: z.string().trim().min(1).max(60),
  // `z.regexes.httpProtocol` = `http` ou `https` : Zod compare le protocole sans
  // son « : », et `z.url()` valide en plus la forme générale de l'URL.
  href: z.url({ protocol: z.regexes.httpProtocol }),
  isActive: z.boolean().default(true),
  position: z.coerce.number().int().min(0).max(9999).default(0),
});

export const socialLinkUpdateSchema = z
  .object({
    platform: z.string().trim().min(1).max(40).nullish(),
    label: z.string().trim().min(1).max(60).optional(),
    href: z.url({ protocol: z.regexes.httpProtocol }).optional(),
    isActive: z.boolean().optional(),
    position: z.coerce.number().int().min(0).max(9999).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Aucun champ à mettre à jour",
  });

export type SocialLinkCreateInput = z.infer<typeof socialLinkCreateSchema>;
export type SocialLinkUpdateInput = z.infer<typeof socialLinkUpdateSchema>;
