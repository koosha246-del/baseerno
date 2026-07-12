import { siteConfig } from "@/config/site";

/**
 * External URL constants — the single place to change outbound links.
 */
export const externalUrls = {
  instagram: siteConfig.social.instagram,
  telegram: siteConfig.social.telegram,
  youtube: siteConfig.social.youtube,
  linkedin: siteConfig.social.linkedin,
  aparat: siteConfig.social.aparat,
} as const;
