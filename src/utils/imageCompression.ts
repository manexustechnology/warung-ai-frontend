// Image compression utility
export const compressImage = (file: File, maxSizeKB: number = 1): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions to maintain aspect ratio
      const maxWidth = 300;
      const maxHeight = 300;
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx?.drawImage(img, 0, 0, width, height);

      // Start with high quality and reduce until size is acceptable
      let quality = 0.9;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);

      const compress = () => {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64Size = dataUrl.length * 0.75; // Approximate size in bytes
        const sizeKB = base64Size / 1024;

        if (sizeKB <= maxSizeKB || quality <= 0.1) {
          resolve(dataUrl);
        } else {
          quality -= 0.1;
          compress();
        }
      };

      compress();
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
};

export const dataURLToFile = (dataUrl: string, filename: string): File => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}; 