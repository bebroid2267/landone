export const calculateTokenCost = (cost: number): number => {
  return Math.max(1, Math.ceil(cost * 1000))
}
