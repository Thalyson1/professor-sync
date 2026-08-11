export function buildReorderMap(idsInOrder: string[]) {
  return idsInOrder.map((id, index) => ({
    id,
    position: index
  }));
}

export function hasDuplicateIds(ids: string[]) {
  return new Set(ids).size !== ids.length;
}
