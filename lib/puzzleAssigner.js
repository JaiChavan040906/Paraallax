export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function teamSpecificShuffle(arr, teamSeed) {
  const a = [...arr];
  let seedOffset = 0;
  for (let k = 0; k < teamSeed.length; k++) {
    seedOffset = (seedOffset * 31 + teamSeed.charCodeAt(k)) >>> 0;
  }
  for (let i = a.length - 1; i > 0; i--) {
    const raw = Math.random() + (seedOffset % (i + 1)) / (i + 2);
    const j = Math.floor(raw * (i + 1)) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Deals puzzles so that every team receives exactly one puzzle from each domain.
 * Variants from each domain are dealt in a strict round-robin (alternating) order.
 * E.g., if a domain has 2 variants (A, B) it will distribute A, B, A, B...
 * 
 * @param {Array<Object>} allPuzzles - Array of puzzle documents/objects containing puzzleId and type
 * @param {Array<String>} teamNames - Array of team names
 * @returns {Object} assignments - { "teamA": ["game2set1", "game1set3", ...], ... }
 */
export function dealDomainPuzzles(allPuzzles, teamNames) {
  const assignments = {};

  // 1. Group puzzles by domain
  const domains = {};
  for (const p of allPuzzles) {
    const typeStr = String(p.type || p.puzzleId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const match = typeStr.match(/^(game\d+)/);
    const domain = match ? match[1] : typeStr; // Fallback to full string if no match
    
    if (!domains[domain]) domains[domain] = [];
    domains[domain].push(p.puzzleId);
  }

  const domainKeys = Object.keys(domains);

  // 2. Shuffle each domain's pool once initially to randomize the starting sequence
  for (const domain of domainKeys) {
    domains[domain] = shuffle(domains[domain]);
  }

  // Track the current index for round-robin assignment for each domain
  const domainIndices = {};
  for (const domain of domainKeys) {
    domainIndices[domain] = 0;
  }

  // 3. Assign exactly one from every domain to each team sequentially
  for (const teamName of teamNames) {
    const teamPuzzles = [];
    
    for (const domain of domainKeys) {
      const pool = domains[domain];
      
      // Select the current variant index for this domain
      const currentIndex = domainIndices[domain];
      const selected = pool[currentIndex];
      teamPuzzles.push(selected);
      
      // Increment the index and wrap around via modulo for strict alternation
      domainIndices[domain] = (currentIndex + 1) % pool.length;
    }
    
    // 4. Shuffle the selected puzzles so every team gets a unique playing order sequence
    assignments[teamName] = shuffle(teamPuzzles);
  }

  return assignments;
}
