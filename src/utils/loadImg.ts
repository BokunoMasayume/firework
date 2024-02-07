export async function loadImageBitmap(url: string) {
    const res = await fetch(url, {

    });
    const blob = await res.blob();
    return await createImageBitmap(blob, {
        colorSpaceConversion: 'none',
        premultiplyAlpha: 'none',
    });
}

export async function loadImage(url: string) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    return new Promise((res, rej) => {
        img.addEventListener('load', () => {
            res(img);
        });
        img.addEventListener('error', (e) => {
            rej(e);
        });
    }).then(() => img);
}