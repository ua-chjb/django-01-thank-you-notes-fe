import { readAndCompress, readAndCompressImage } from "browser-image-resizer";

export const correctImageOrientation = async (file) => {
  const config = {
    quality: 0.9,
    maxWidth: 2000,
    maxHeight: 2000,
    autoRotate: true,
    debug: false,
    mimeType: file.type,
  };

  return readAndCompressImage(file, config).catch((err) => {
    console.error("Error correcting image orientation:", err);
    return file;
  });
};
