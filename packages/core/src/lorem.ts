const LOREM_WORDS = (
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod " +
  "tempor incididunt ut labore et dolore magna aliqua ut enim ad minim " +
  "veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea " +
  "commodo consequat duis aute irure dolor in reprehenderit in voluptate " +
  "velit esse cillum dolore eu fugiat nulla pariatur excepteur sint " +
  "occaecat cupidatat non proident sunt in culpa qui officia deserunt " +
  "mollit anim id est laborum"
).split(" ")

function pick(rng: () => number, count: number): string[] {
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    out.push(LOREM_WORDS[Math.floor(rng() * LOREM_WORDS.length)])
  }
  return out
}

/** Small deterministic PRNG so replies vary but are reproducible per seed. */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedFromString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return hash
}

function capitalize(sentence: string): string {
  return sentence.charAt(0).toUpperCase() + sentence.slice(1)
}

function buildSentence(rng: () => number): string {
  const words = pick(rng, 6 + Math.floor(rng() * 10))
  return capitalize(words.join(" ")) + "."
}

/** Generates a fake assistant reply. Deterministic per `seed` so the same prompt reads consistently. */
export function generateLoremReply(seed: string): string {
  const rng = mulberry32(seedFromString(seed))
  const paragraphCount = 1 + Math.floor(rng() * 2)
  const paragraphs: string[] = []
  for (let p = 0; p < paragraphCount; p++) {
    const sentenceCount = 2 + Math.floor(rng() * 3)
    const sentences: string[] = []
    for (let s = 0; s < sentenceCount; s++) {
      sentences.push(buildSentence(rng))
    }
    paragraphs.push(sentences.join(" "))
  }
  return paragraphs.join("\n\n")
}
