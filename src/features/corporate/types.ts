export interface CorporateBenefit {
  id: string;
  /** Icon key resolved client-side via the local icon map. */
  iconKey: CorporateBenefitIcon;
  title: string;
  description: string;
}

export type CorporateBenefitIcon =
  | "users-round"
  | "target"
  | "trending-up"
  | "building"
  | "bar-chart"
  | "award";
