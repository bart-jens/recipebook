export function parseSteps(instructions: string): string[] {
  return instructions
    .split(/\n+/)
    .map(s => s.replace(/^(step\s*)?\d+[.):\s]*/i, '').trim())
    .filter(Boolean);
}
