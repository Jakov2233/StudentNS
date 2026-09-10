export const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
export const MAX_AVATAR_SIZE = 8 * 1024 * 1024;

export function isHeicLike(type: string): boolean {
  return /heic|heif/i.test(type);
}

export function isImageType(type: string): boolean {
  return type.startsWith("image/");
}

const MAX_DIM = 1600;

async function decodeImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Ne mogu da procitam ovu sliku."));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function prepareImage(
  file: File,
  opts?: { maxDim?: number; square?: boolean }
): Promise<File> {
  const maxDim = opts?.maxDim ?? MAX_DIM;
  const img = await decodeImage(file);

  let width = img.naturalWidth;
  let height = img.naturalHeight;
  if (width === 0 || height === 0) {
    throw new Error("Slika nije podrzana u ovom pregledacu.");
  }

  if (opts?.square) {
    const size = Math.min(width, height);
    width = size;
    height = size;
  } else {
    const scale = Math.min(1, maxDim / Math.max(width, height));
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Slika nije podrzana u ovom pregledacu.");

  if (opts?.square) {
    const sx = (img.naturalWidth - width) / 2;
    const sy = (img.naturalHeight - height) / 2;
    ctx.drawImage(img, sx, sy, width, height, 0, 0, width, height);
  } else {
    ctx.drawImage(img, 0, 0, width, height);
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85)
  );
  if (!blob) throw new Error("Ne mogu da obradim ovu sliku.");
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}