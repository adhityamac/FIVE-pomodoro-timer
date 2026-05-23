import themes from "./themes.json";

export type Aura = {
  id: string;
  name: string;
  outer: string;
  mid: string;
  inner: string;
  core: string;
  bgInactive?: string;
  bgActive?: string;
  dialStop1?: string;
  dialStop2?: string;
  dialStop3?: string;
};

export const auras: Aura[] = themes as Aura[];

