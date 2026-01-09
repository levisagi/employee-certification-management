/**
 * דחיסת תמונות אוטומטית
 * מקטין תמונות גדולות לגודל מינימלי ללא פגיעה באיכות
 */

export interface CompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    maxSizeMB?: number;
}

/**
 * דוחס תמונה לפני העלאה
 * @param file - קובץ התמונה
 * @param options - אפשרויות דחיסה
 * @returns Promise עם התמונה הדחוסה כ-Base64
 */
export const compressImage = async (
    file: File,
    options: CompressionOptions = {}
): Promise<string> => {
    const {
        maxWidth = 1200,
        maxHeight = 1200,
        quality = 0.8,
        maxSizeMB = 0.5
    } = options;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            
            img.onload = () => {
                // יצירת canvas לדחיסה
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // חישוב גודל חדש תוך שמירה על יחס גובה-רוחב
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

                // ציור התמונה בגודל החדש
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // המרה ל-Base64 עם דחיסה
                let compressedBase64 = canvas.toDataURL('image/jpeg', quality);

                // אם עדיין גדול מדי, נדחוס יותר
                const sizeInMB = (compressedBase64.length * 3) / 4 / (1024 * 1024);
                if (sizeInMB > maxSizeMB && quality > 0.5) {
                    // דחיסה נוספת
                    compressedBase64 = canvas.toDataURL('image/jpeg', quality - 0.2);
                }

                console.log(`Image compressed: ${(file.size / 1024).toFixed(2)}KB → ${((compressedBase64.length * 3) / 4 / 1024).toFixed(2)}KB`);
                
                resolve(compressedBase64);
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = e.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
};

/**
 * דוחס תמונה Base64 קיימת
 * @param base64String - תמונה ב-Base64
 * @param options - אפשרויות דחיסה
 * @returns Promise עם התמונה הדחוסה
 */
export const compressBase64Image = async (
    base64String: string,
    options: CompressionOptions = {}
): Promise<string> => {
    const {
        maxWidth = 1200,
        maxHeight = 1200,
        quality = 0.8
    } = options;

    return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // חישוב גודל חדש
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

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            
            console.log(`Base64 compressed: ${(base64String.length / 1024).toFixed(2)}KB → ${(compressedBase64.length / 1024).toFixed(2)}KB`);
            
            resolve(compressedBase64);
        };

        img.onerror = () => {
            reject(new Error('Failed to load base64 image'));
        };

        img.src = base64String;
    });
};

/**
 * בדיקה אם קובץ הוא תמונה
 */
export const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
};

/**
 * המרת גודל קובץ לפורמט קריא
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

