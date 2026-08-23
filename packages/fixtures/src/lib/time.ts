export function gm(minutes: number, seconds = 0): number {
  return (minutes * 60 + seconds) * 1000;
}
