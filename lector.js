/* Hilvanta · lector rápido del timbre del SII (pedido de Miguel, 17-11-2026: «que la lectura sea mucho más rápida»).
   Trabaja aparte de la pantalla (Web Worker) con zxing-wasm (zxing-cpp compilado a WebAssembly), de 3 a 4 veces más
   rápido que ZXing en JavaScript. La app le manda cada cuadro (ImageData) y recibe el texto leído o null.
   Los archivos van en la página publicada (correr.mjs web): lector-zxing.js y lector-zxing.wasm, sin sitios ajenos. */
importScripts('lector-zxing.js');
const listo = ZXingWASM.prepareZXingModule({ overrides: { locateFile: (p, base) => p.endsWith('.wasm') ? 'lector-zxing.wasm' : base + p }, fireImmediately: true });
onmessage = async e => {
  const { id, img, dura } = e.data;
  try {
    await listo;
    const r = await ZXingWASM.readBarcodes(img, { formats: ['PDF417', 'QRCode'], tryHarder: !!dura, tryRotate: false, tryInvert: false, maxNumberOfSymbols: 1 });
    const b = r.find(x => x.isValid && x.text);
    postMessage({ id, texto: b ? b.text : null });
  } catch (err) { postMessage({ id, error: String(err && err.message || err) }); }
};
