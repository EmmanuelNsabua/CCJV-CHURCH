import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import {
  StorageService,
  IMAGE_MAX_BYTES,
  AUDIO_MAX_BYTES,
  VIDEO_MAX_BYTES,
  acceptedMimeTypesFor,
} from "@/infrastructure/supabase/storage";
import {
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
} from "@/shared/errors/app-error";
import { supabaseAdmin } from "@/infrastructure/supabase/client";

describe("StorageService — gestion multimédia, sécurité et plafonds volumétriques", () => {
  let storage: StorageService;
  const mockUpload = jest.fn<() => Promise<any>>();
  const mockGetPublicUrl = jest.fn<() => any>();
  const mockRemove = jest.fn<() => Promise<any>>();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpload.mockResolvedValue({ data: { path: "fake-path" }, error: null });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: "https://storage.ccjv.org/fake-path" },
    });
    mockRemove.mockResolvedValue({ data: [], error: null });

    jest.spyOn(supabaseAdmin.storage, "from").mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
      remove: mockRemove,
    } as any);

    storage = new StorageService("ccjv-media");
  });

  function jpegBuffer(): Buffer {
    return Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    ]);
  }

  function mp4Buffer(): Buffer {
    const b = Buffer.alloc(32);
    b.writeUInt32BE(32, 0);
    b.write("ftyp", 4, "latin1");
    b.write("mp42", 8, "latin1");
    return b;
  }

  function mp3Buffer(): Buffer {
    const b = Buffer.alloc(24);
    b.write("ID3", 0, "latin1");
    return b;
  }

  function pdfBuffer(): Buffer {
    return Buffer.from("%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>");
  }

  /* -------------------------------------------------------------------------- */
  /*  Règles par dossier et types acceptés                                      */
  /* -------------------------------------------------------------------------- */
  describe("Règles par dossier (StorageFolder)", () => {
    it("autorise photos, vidéos et audios dans le dossier 'pages' (Médiathèque)", () => {
      const accepted = acceptedMimeTypesFor("pages");
      expect(accepted).toContain("image/jpeg");
      expect(accepted).toContain("video/mp4");
      expect(accepted).toContain("audio/mpeg");
      expect(accepted).not.toContain("application/pdf");
    });

    it("autorise photos, vidéos et audios dans 'publications' (Enseignements)", () => {
      const accepted = acceptedMimeTypesFor("publications");
      expect(accepted).toContain("image/jpeg");
      expect(accepted).toContain("video/mp4");
      expect(accepted).toContain("audio/mpeg");
      expect(accepted).not.toContain("application/pdf");
    });

    it("réserve le dossier 'resources' exclusivement aux documents PDF", () => {
      const accepted = acceptedMimeTypesFor("resources");
      expect(accepted).toEqual(["application/pdf"]);
    });

    it("réserve le dossier 'events' exclusivement aux photos", () => {
      const accepted = acceptedMimeTypesFor("events");
      expect(accepted).toContain("image/jpeg");
      expect(accepted).not.toContain("video/mp4");
      expect(accepted).not.toContain("audio/mpeg");
    });
  });

  /* -------------------------------------------------------------------------- */
  /*  Téléversement et vérification des plafonds volumétriques                   */
  /* -------------------------------------------------------------------------- */
  describe("Plafonds volumétriques par catégorie de fichier", () => {
    it("accepte une photo sous le plafond de 5 Mo", async () => {
      const result = await storage.upload("pages", {
        buffer: jpegBuffer(),
        size: 3 * 1024 * 1024,
      });

      expect(result.mimeType).toBe("image/jpeg");
      expect(mockUpload).toHaveBeenCalledTimes(1);
    });

    it("refuse une photo qui dépasse 5 Mo même si le serveur tolère plus (PayloadTooLargeError)", async () => {
      await expect(
        storage.upload("pages", {
          buffer: jpegBuffer(),
          size: IMAGE_MAX_BYTES + 1,
        }),
      ).rejects.toThrow(PayloadTooLargeError);

      expect(mockUpload).not.toHaveBeenCalled();
    });

    it("accepte un fichier audio de 50 Mo (sous le plafond audio de 100 Mo)", async () => {
      const result = await storage.upload("pages", {
        buffer: mp3Buffer(),
        size: 50 * 1024 * 1024,
      });

      expect(result.mimeType).toBe("audio/mpeg");
      expect(mockUpload).toHaveBeenCalledTimes(1);
    });

    it("refuse un fichier audio qui dépasse 100 Mo (PayloadTooLargeError)", async () => {
      await expect(
        storage.upload("pages", {
          buffer: mp3Buffer(),
          size: AUDIO_MAX_BYTES + 1024,
        }),
      ).rejects.toThrow(PayloadTooLargeError);

      expect(mockUpload).not.toHaveBeenCalled();
    });

    it("accepte une vidéo longue et lourde de 150 Mo (> 100 Mo)", async () => {
      const result = await storage.upload("pages", {
        buffer: mp4Buffer(),
        size: 150 * 1024 * 1024,
      });

      expect(result.mimeType).toBe("video/mp4");
      expect(mockUpload).toHaveBeenCalledTimes(1);
    });

    it("refuse une vidéo qui dépasse la limite vidéo absolue (300 Mo)", async () => {
      await expect(
        storage.upload("pages", {
          buffer: mp4Buffer(),
          size: VIDEO_MAX_BYTES + 1,
        }),
      ).rejects.toThrow(PayloadTooLargeError);

      expect(mockUpload).not.toHaveBeenCalled();
    });
  });

  /* -------------------------------------------------------------------------- */
  /*  Sécurité, étanchéité et rejet des scripts malveillants                    */
  /* -------------------------------------------------------------------------- */
  describe("Sécurité contre les attaques et injections de code", () => {
    it("rejette un faux fichier vidéo contenant du JavaScript (XSS)", async () => {
      const maliciousBuffer = Buffer.from(
        "<script>window.location='http://attacker.com'</script>",
        "utf8",
      );

      await expect(
        storage.upload("pages", {
          buffer: maliciousBuffer,
          size: maliciousBuffer.length,
        }),
      ).rejects.toThrow(UnsupportedMediaTypeError);

      expect(mockUpload).not.toHaveBeenCalled();
    });

    it("rejette un faux fichier vidéo contenant un script Node/Shell déguisé", async () => {
      const fakeScript = Buffer.from("#!/usr/bin/env node\nconsole.log(1);", "utf8");

      await expect(
        storage.upload("pages", {
          buffer: fakeScript,
          size: fakeScript.length,
        }),
      ).rejects.toThrow(UnsupportedMediaTypeError);

      expect(mockUpload).not.toHaveBeenCalled();
    });

    it("refuse un fichier vide de 0 octet", async () => {
      await expect(
        storage.upload("pages", {
          buffer: Buffer.alloc(0),
          size: 0,
        }),
      ).rejects.toThrow(UnsupportedMediaTypeError);

      expect(mockUpload).not.toHaveBeenCalled();
    });

    it("refuse un PDF dans le dossier de médiathèque 'pages'", async () => {
      await expect(
        storage.upload("pages", {
          buffer: pdfBuffer(),
          size: pdfBuffer().length,
        }),
      ).rejects.toThrow(UnsupportedMediaTypeError);

      expect(mockUpload).not.toHaveBeenCalled();
    });

    it("accepte un PDF dans le dossier 'resources'", async () => {
      const result = await storage.upload("resources", {
        buffer: pdfBuffer(),
        size: pdfBuffer().length,
      });

      expect(result.mimeType).toBe("application/pdf");
      expect(mockUpload).toHaveBeenCalledTimes(1);
    });
  });
});

