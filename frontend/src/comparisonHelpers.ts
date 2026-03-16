function hasSetDifference<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return true;

  const setB = new Set(b);

  for (const item of a) {
    if (!setB.has(item)) return true;
  }

  return false;
}

export{hasSetDifference};