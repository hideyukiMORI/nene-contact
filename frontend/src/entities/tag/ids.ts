export type TagId = number & { readonly __brand: 'TagId' };

export function toTagId(value: number): TagId {
  return value as TagId;
}
