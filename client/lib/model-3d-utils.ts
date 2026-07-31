/** Max .glb / .gltf upload size for mock storage (data URL in zustand). */
export const MAX_MODEL_3D_BYTES = 5 * 1024 * 1024;

export const MODEL_3D_ACCEPT = ".glb,.gltf";

export function isModel3dFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".glb") ||
    name.endsWith(".gltf") ||
    file.type === "model/gltf-binary" ||
    file.type === "model/gltf+json" ||
    (file.type === "application/octet-stream" && name.endsWith(".glb"))
  );
}

export function isModel3dUrl(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  const v = value.trim().toLowerCase();
  return (
    v.startsWith("data:") ||
    v.endsWith(".glb") ||
    v.endsWith(".gltf") ||
    v.includes(".glb?") ||
    v.includes(".gltf?")
  );
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read file"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}
