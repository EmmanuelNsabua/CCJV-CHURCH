/**
 * Détection du type réel d'un fichier par ses octets d'en-tête (*magic bytes*).
 *
 * **Pourquoi ne pas se fier à l'extension ou au `Content-Type` ?**
 * Parce qu'ils viennent du client et sont donc falsifiables : renommer un
 * exécutable en `.jpg` suffit à tromper une vérification naïve. Le cahier §14
 * l'interdit explicitement — « Ne jamais faire confiance au nom ou au MIME type
 * fourni uniquement par le client ».
 *
 * On ne reconnaît que les formats réellement acceptés pour les photos CCJV.
 */

export const ACCEPTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export type AcceptedImageMimeType = (typeof ACCEPTED_IMAGE_MIME_TYPES)[number];

function startsWith(buffer: Buffer, bytes: readonly number[], offset = 0): boolean {
  if (buffer.length < offset + bytes.length) return false;
  return bytes.every((byte, index) => buffer[offset + index] === byte);
}

function asciiAt(buffer: Buffer, offset: number, text: string): boolean {
  if (buffer.length < offset + text.length) return false;
  return buffer.toString("latin1", offset, offset + text.length) === text;
}

/**
 * Retourne le type MIME déduit du contenu, ou `null` si le format n'est pas
 * reconnu comme une image autorisée.
 */
export function detectImageMimeType(buffer: Buffer): AcceptedImageMimeType | null {
  // JPEG : FF D8 FF
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return "image/jpeg";

  // PNG : 89 50 4E 47 0D 0A 1A 0A
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }

  // WEBP : "RIFF" .... "WEBP"
  if (asciiAt(buffer, 0, "RIFF") && asciiAt(buffer, 8, "WEBP")) {
    return "image/webp";
  }

  // AVIF : boîte ISO-BMFF dont le type de marque est "avif" ou "avis".
  if (asciiAt(buffer, 4, "ftyp") && (asciiAt(buffer, 8, "avif") || asciiAt(buffer, 8, "avis"))) {
    return "image/avif";
  }

  return null;
}

/** Extension canonique associée à un type MIME détecté. */
export function extensionForMimeType(mimeType: AcceptedImageMimeType): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
  }
}

/** Dimensions d'une image, lues depuis son en-tête — sans dépendance externe. */
export interface ImageDimensions {
  width: number;
  height: number;
}

export function readImageDimensions(
  buffer: Buffer,
  mimeType: AcceptedImageMimeType,
): ImageDimensions | null {
  if (mimeType === "image/png") {
    // IHDR : largeur et hauteur en big-endian aux octets 16 et 20.
    if (buffer.length < 24) return null;
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  if (mimeType === "image/jpeg") {
    // Parcours des segments jusqu'au marqueur SOF (Start Of Frame).
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      if (marker === undefined) return null;

      // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15
      const isStartOfFrame =
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf);

      if (isStartOfFrame) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }

      const segmentLength = buffer.readUInt16BE(offset + 2);
      if (segmentLength <= 0) return null;
      offset += 2 + segmentLength;
    }
    return null;
  }

  if (mimeType === "image/webp") {
    if (buffer.length < 30) return null;
    // VP8X (étendu), VP8 (lossy) ou VP8L (lossless).
    if (asciiAt(buffer, 12, "VP8X")) {
      const width = 1 + (buffer.readUIntLE(24, 3) & 0xffffff);
      const height = 1 + (buffer.readUIntLE(27, 3) & 0xffffff);
      return { width, height };
    }
    if (asciiAt(buffer, 12, "VP8 ")) {
      return {
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff,
      };
    }
    if (asciiAt(buffer, 12, "VP8L")) {
      const bits = buffer.readUInt32LE(21);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }
    return null;
  }

  // AVIF : dimensions dans la boîte ispe — non trivial à extraire sans parseur
  // complet. On préfère ne rien annoncer plutôt qu'annoncer un chiffre faux.
  return null;
}
