import type { DetailedHTMLProps, HTMLAttributes } from "react";

type ModelViewerAttributes = HTMLAttributes<HTMLElement> & {
  src?: string;
  poster?: string;
  alt?: string;
  loading?: "auto" | "lazy" | "eager";
  reveal?: "auto" | "manual";
  "camera-controls"?: boolean | "";
  "auto-rotate"?: boolean | "";
  "auto-rotate-delay"?: string;
  ar?: boolean | "";
  "ar-modes"?: string;
  "shadow-intensity"?: string;
  "environment-image"?: string;
  exposure?: string;
  "interaction-prompt"?: "auto" | "when-focused" | "none";
  "touch-action"?: string;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<ModelViewerAttributes, HTMLElement>;
    }
  }
}
