function weightedRandom(): number {
  const rand = Math.random();
  if (rand < 0.8) return 1;
  else if (rand < 0.9) return 2;
  else return 3;
}

// if I want these three has the same probability
function weightedRandomEqual(): number {
  const rand = Math.random();
  if (rand < 1 / 3) return 1;
  else if (rand < 2 / 3) return 2;
  else return 3;
}

// Run multiple times to test distribution
