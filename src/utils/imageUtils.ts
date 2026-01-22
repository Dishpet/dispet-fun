/**
 * Processes an image to remove its black background.
 * Simulates "Nano Banana" advanced background removal by leveraging the strict
 * black background constraint enforced in generation prompts.
 */
export const removeBlackBackground = (base64Image: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }

            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Iterate over pixels
            // R, G, B, A order
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // If purely black (allow tiny threshold for compression artifacts)
                if (r < 15 && g < 15 && b < 15) {
                    data[i + 3] = 0; // Set alpha to 0 (transparent)
                }
            }

            // Put modified data back
            ctx.putImageData(imageData, 0, 0);

            // Return new base64
            resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = (err) => reject(err);
        img.src = base64Image;
    });
};
