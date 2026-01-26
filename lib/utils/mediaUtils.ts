/**
 * Verifica se uma string é uma URL de imagem (por extensão ou data URL)
 */
export function isImageFile(filename: string): boolean {
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i;
  return imageExtensions.test(filename) || filename.startsWith("data:image/");
}

/**
 * Verifica se uma string é uma URL de vídeo (por extensão)
 */
export function isVideoFile(filename: string): boolean {
  const videoExtensions = /\.(mp4|webm|ogg|ogv|mov|avi|wmv|flv|mkv)(\?.*)?$/i;
  return videoExtensions.test(filename);
}

/**
 * Verifica se é uma URL válida (http/https ou caminho absoluto)
 */
export function isUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return str.startsWith("/") || str.startsWith("./") || str.startsWith("../");
  }
}

