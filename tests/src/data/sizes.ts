// this is for type safety - no to be able to pass invalid values
export const SIZES = ["XS", "S", "M", "ML", "L", "XL", "XXL"] as const;
export type Size = (typeof SIZES)[number];