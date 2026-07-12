export interface CampusFeature {
  id: string;
  title: string;
  description: string;
  /** Gradient accent color key. */
  accent: "violet" | "pink" | "orchid" | "amber" | "blue";
  /** Decorative SVG glyph. */
  glyph: string;
}

export interface CampusGalleryItem {
  id: string;
  label: string;
  /** Portrait or landscape. */
  aspect: "square" | "tall" | "wide";
  /** Gradient accent. */
  accent: "violet" | "pink" | "orchid" | "amber" | "blue";
}
