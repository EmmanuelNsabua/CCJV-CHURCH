import { describe, expect, it } from "vitest";
import {
  ACCEPTED_IMAGE_MIME_TYPES,
  detectImageMimeType,
  extensionForMimeType,
  readImageDimensions,
} from "@/shared/utils/file-signature";
import type { AcceptedImageMimeType } from "@/shared/utils/file-signature";

/**
 * Le contrôle du type de fichier est un contrôle de **sécurité** : l'extension
 * et le `Content-Type` viennent du client et sont falsifiables. Ces tests
 * vérifient donc autant les détections positives que le refus d'un fichier qui
 * se présente comme une image sans en être une.
 */

/* -------------------------------------------------------------------------- */
/*  Fabriques de fichiers minimaux (aucune dépendance externe)                */
/* -------------------------------------------------------------------------- */

/** PNG minimal : signature + en-tête IHDR (largeur et hauteur). */
function pngBuffer(width = 800, height = 600): Buffer {
  const buffer = Buffer.alloc(33);
  buffer.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0); // signature
  buffer.writeUInt32BE(13, 8); // longueur du bloc IHDR
  buffer.set([0x49, 0x48, 0x44, 0x52], 12); // "IHDR"
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

/** WEBP étendu : RIFF + taille + WEBP + bloc VP8X (largeur/hauteur sur 3 octets). */
function webpExtendedBuffer(width = 800, height = 600): Buffer {
  const buffer = Buffer.alloc(32);
  buffer.write("RIFF", 0, "latin1");
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write("WEBP", 8, "latin1");
  buffer.write("VP8X", 12, "latin1");
  buffer.writeUInt32LE(10, 16);
  buffer.writeUIntLE(width - 1, 24, 3);
  buffer.writeUIntLE(height - 1, 27, 3);
  return buffer;
}

/** JPEG minimal : SOI, segment APP0, puis SOF0 portant les dimensions. */
function jpegBuffer(width = 1920, height = 1080): Buffer {
  const buffer = Buffer.alloc(20);
  buffer.set([0xff, 0xd8], 0); // SOI
  buffer.set([0xff, 0xe0, 0x00, 0x04, 0x00, 0x00], 2); // APP0 (segment de 4 octets)
  buffer.set([0xff, 0xc0, 0x00, 0x11, 0x08], 8); // SOF0
  buffer.writeUInt16BE(height, 13);
  buffer.writeUInt16BE(width, 15);
  return buffer;
}

/* -------------------------------------------------------------------------- */
/*  Détections positives                                                      */
/* -------------------------------------------------------------------------- */

describe("detectImageMimeType — formats acceptés", () => {
  it("reconnaît un JPEG à ses octets FF D8 FF", () => {
    expect(detectImageMimeType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]))).toBe(
      "image/jpeg",
    );
    expect(detectImageMimeType(jpegBuffer())).toBe("image/jpeg");
  });

  it("reconnaît un PNG à sa signature complète", () => {
    expect(
      detectImageMimeType(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]),
      ),
    ).toBe("image/png");
    expect(detectImageMimeType(pngBuffer())).toBe("image/png");
  });

  it("reconnaît un WEBP à l'en-tête RIFF…WEBP", () => {
    const webp = Buffer.alloc(16);
    webp.write("RIFF", 0, "latin1");
    webp.writeUInt32LE(8, 4);
    webp.write("WEBP", 8, "latin1");

    expect(detectImageMimeType(webp)).toBe("image/webp");
    expect(detectImageMimeType(webpExtendedBuffer())).toBe("image/webp");
  });

  it("reconnaît un AVIF au type de marque `avif` ou `avis`", () => {
    const avif = Buffer.alloc(16);
    avif.write("ftyp", 4, "latin1");
    avif.write("avif", 8, "latin1");

    const avis = Buffer.from(avif);
    avis.write("avis", 8, "latin1");

    expect(detectImageMimeType(avif)).toBe("image/avif");
    expect(detectImageMimeType(avis)).toBe("image/avif");
  });

  it("accepte tous les types annoncés par la constante publique", () => {
    for (const mimeType of ACCEPTED_IMAGE_MIME_TYPES) {
      expect(typeof mimeType).toBe("string");
      expect(mimeType.startsWith("image/")).toBe(true);
    }
  });
});

/* -------------------------------------------------------------------------- */
/*  Refus — le cœur du contrôle de sécurité                                   */
/* -------------------------------------------------------------------------- */

describe("detectImageMimeType — refus", () => {
  it("refuse un fichier vide", () => {
    expect(detectImageMimeType(Buffer.alloc(0))).toBeNull();
  });

  it("refuse un fichier texte brut", () => {
    expect(detectImageMimeType(Buffer.from("ceci est un simple fichier texte"))).toBeNull();
  });

  it("refuse un PDF malgré son en-tête reconnaissable", () => {
    expect(
      detectImageMimeType(Buffer.from("%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>")),
    ).toBeNull();
  });

  it("refuse un GIF, un BMP et un SVG", () => {
    expect(detectImageMimeType(Buffer.from("GIF89a...."))).toBeNull();
    expect(detectImageMimeType(Buffer.from([0x42, 0x4d, 0x36, 0x00]))).toBeNull();
    expect(detectImageMimeType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeNull();
  });

  it("refuse un en-tête tronqué", () => {
    expect(detectImageMimeType(Buffer.from([0xff]))).toBeNull();
    expect(detectImageMimeType(Buffer.from([0xff, 0xd8]))).toBeNull();
    // PNG amputé de son dernier octet de signature.
    expect(
      detectImageMimeType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a])),
    ).toBeNull();
    // RIFF sans WEBP : conteneur reconnu, format non.
    expect(detectImageMimeType(Buffer.from("RIFF", "latin1"))).toBeNull();
  });

  it("refuse un conteneur RIFF d'un autre type (audio/vidéo)", () => {
    const wav = Buffer.alloc(16);
    wav.write("RIFF", 0, "latin1");
    wav.writeUInt32LE(8, 4);
    wav.write("WAVE", 8, "latin1");

    expect(detectImageMimeType(wav)).toBeNull();
  });

  it("refuse un fichier ISO-BMFF d'un autre type (MP4)", () => {
    const mp4 = Buffer.alloc(16);
    mp4.write("ftyp", 4, "latin1");
    mp4.write("mp42", 8, "latin1");

    expect(detectImageMimeType(mp4)).toBeNull();
  });

  it("refuse un fichier dont l'extension prétend « .jpg » mais dont le contenu est du texte", () => {
    // Le contenu est la seule source de vérité : renommer un fichier ne le
    // transforme pas en image (`docs/004`, cahier §14).
    const fauxJpeg = Buffer.from("#!/bin/sh\nrm -rf /\n", "utf8");

    expect(detectImageMimeType(fauxJpeg)).toBeNull();
    expect(detectImageMimeType(Buffer.from("<script>alert(1)</script>", "utf8"))).toBeNull();
  });

  it("accepte un JPEG dont la fin du fichier n'est pas une image valide", () => {
    // Nuance assumée : la détection porte sur les octets d'en-tête. Un contenu
    // malformé qui *commence* comme un JPEG est reconnu comme JPEG ; le
    // nettoyage définitif appartient au service de stockage.
    const tronque = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(100)]);

    expect(detectImageMimeType(tronque)).toBe("image/jpeg");
  });
});

/* -------------------------------------------------------------------------- */
/*  Extensions                                                                */
/* -------------------------------------------------------------------------- */

describe("extensionForMimeType", () => {
  it("associe une extension canonique à chaque type accepté", () => {
    expect(extensionForMimeType("image/jpeg")).toBe("jpg");
    expect(extensionForMimeType("image/png")).toBe("png");
    expect(extensionForMimeType("image/webp")).toBe("webp");
    expect(extensionForMimeType("image/avif")).toBe("avif");
  });

  it("ne produit jamais d'extension vide", () => {
    for (const mimeType of ACCEPTED_IMAGE_MIME_TYPES) {
      expect(extensionForMimeType(mimeType).length).toBeGreaterThan(0);
    }
  });
});

/* -------------------------------------------------------------------------- */
/*  Dimensions                                                                */
/* -------------------------------------------------------------------------- */

describe("readImageDimensions", () => {
  it("lit les dimensions d'un PNG depuis IHDR", () => {
    expect(readImageDimensions(pngBuffer(800, 600), "image/png")).toEqual({
      width: 800,
      height: 600,
    });
    expect(readImageDimensions(pngBuffer(1, 1), "image/png")).toEqual({
      width: 1,
      height: 1,
    });
  });

  it("retourne null pour un PNG trop court pour contenir IHDR", () => {
    expect(readImageDimensions(Buffer.alloc(23), "image/png")).toBeNull();
    expect(readImageDimensions(Buffer.alloc(0), "image/png")).toBeNull();
  });

  it("lit les dimensions d'un JPEG depuis le marqueur SOF0", () => {
    expect(readImageDimensions(jpegBuffer(1920, 1080), "image/jpeg")).toEqual({
      width: 1920,
      height: 1080,
    });
    expect(readImageDimensions(jpegBuffer(640, 480), "image/jpeg")).toEqual({
      width: 640,
      height: 480,
    });
  });

  it("retourne null pour un JPEG sans marqueur SOF", () => {
    const sansSof = Buffer.alloc(20);
    sansSof.set([0xff, 0xd8], 0);
    sansSof.set([0xff, 0xe0, 0x00, 0x04, 0x00, 0x00], 2);

    expect(readImageDimensions(sansSof, "image/jpeg")).toBeNull();
    expect(readImageDimensions(Buffer.from([0xff, 0xd8, 0xff]), "image/jpeg")).toBeNull();
  });

  it("lit les dimensions d'un WEBP étendu (VP8X)", () => {
    expect(readImageDimensions(webpExtendedBuffer(800, 600), "image/webp")).toEqual({
      width: 800,
      height: 600,
    });
  });

  it("retourne null pour un WEBP trop court", () => {
    const court = Buffer.alloc(20);
    court.write("RIFF", 0, "latin1");
    court.write("WEBP", 8, "latin1");

    expect(readImageDimensions(court, "image/webp")).toBeNull();
  });

  it("n'annonce jamais de dimensions pour un AVIF plutôt que d'en inventer", () => {
    const avif = Buffer.alloc(32);
    avif.write("ftyp", 4, "latin1");
    avif.write("avif", 8, "latin1");

    expect(readImageDimensions(avif, "image/avif")).toBeNull();
  });

  it("couvre les quatre types acceptés sans lever d'exception", () => {
    const buffers: Record<AcceptedImageMimeType, Buffer> = {
      "image/jpeg": jpegBuffer(),
      "image/png": pngBuffer(),
      "image/webp": webpExtendedBuffer(),
      "image/avif": Buffer.alloc(32),
    };

    for (const mimeType of ACCEPTED_IMAGE_MIME_TYPES) {
      expect(() => readImageDimensions(buffers[mimeType], mimeType)).not.toThrow();
    }
  });
});
