import type { Request, Response } from "express";
import { sendItem } from "@/shared/http/respond";
import type { SettingService } from "./setting.service";
import { toSettingsDto } from "./setting.serializer";
import type { SettingsPatchInput } from "./setting.schema";

/**
 * Traduction HTTP des réglages institutionnels.
 *
 * `GET /settings` est public (le frontend en a besoin pour afficher le nom, le
 * slogan, l'adresse et le numéro WhatsApp) ; l'écriture est réservée à
 * l'administration.
 */
export function createSettingController(service: SettingService) {
  return {
    async get(_req: Request, res: Response): Promise<void> {
      const overview = await service.getOverview();
      sendItem(res, toSettingsDto(overview));
    },

    async update(req: Request, res: Response): Promise<void> {
      const body = req.body as SettingsPatchInput;
      const overview = await service.update(body.settings);
      sendItem(res, toSettingsDto(overview));
    },
  };
}

export type SettingController = ReturnType<typeof createSettingController>;
