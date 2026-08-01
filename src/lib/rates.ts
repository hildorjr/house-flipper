export function percentToBps(percent: number) {
  return Math.round(percent * 100);
}

export function bpsToPercent(bps: number) {
  return bps / 100;
}
