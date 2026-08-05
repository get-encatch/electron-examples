const LOREM_WORDS: &[&str] = &[
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do",
    "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua", "ut",
    "enim", "ad", "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco", "laboris",
    "nisi", "ut", "aliquip", "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "dolor",
    "in", "reprehenderit", "in", "voluptate", "velit", "esse", "cillum", "dolore", "eu", "fugiat",
    "nulla", "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident", "sunt",
    "in", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id", "est", "laborum",
];

/// Small deterministic PRNG so replies vary but are reproducible per seed.
/// A bit-for-bit port of packages/core/src/lorem.ts's mulberry32 (32-bit wrapping
/// arithmetic, matching JS's `|0` / `>>> 0` / Math.imul semantics exactly).
struct Mulberry32 {
    state: i32,
}

impl Mulberry32 {
    fn new(seed: i32) -> Self {
        Self { state: seed }
    }

    fn next(&mut self) -> f64 {
        self.state = self.state.wrapping_add(0x6d2b79f5u32 as i32);
        let a = self.state;
        let step1 = a ^ (((a as u32) >> 15) as i32);
        let mut t = step1.wrapping_mul(1 | a);
        let inner = t ^ (((t as u32) >> 7) as i32);
        let mul = inner.wrapping_mul(61 | t);
        t = t.wrapping_add(mul) ^ t;
        let result = t ^ (((t as u32) >> 14) as i32);
        (result as u32) as f64 / 4294967296.0
    }
}

fn seed_from_string(input: &str) -> i32 {
    let mut hash: i64 = 0;
    for c in input.chars() {
        let next = (hash << 5) - hash + (c as i64);
        hash = (next as i32) as i64;
    }
    hash as i32
}

fn pick(rng: &mut Mulberry32, count: usize) -> Vec<&'static str> {
    (0..count)
        .map(|_| LOREM_WORDS[(rng.next() * LOREM_WORDS.len() as f64).floor() as usize])
        .collect()
}

fn capitalize(sentence: &str) -> String {
    let mut chars = sentence.chars();
    match chars.next() {
        Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
        None => String::new(),
    }
}

fn build_sentence(rng: &mut Mulberry32) -> String {
    let word_count = 6 + (rng.next() * 10.0).floor() as usize;
    let words = pick(rng, word_count);
    capitalize(&words.join(" ")) + "."
}

/// Generates a fake assistant reply. Deterministic per `seed` so the same prompt reads consistently.
pub fn generate_lorem_reply(seed: &str) -> String {
    let mut rng = Mulberry32::new(seed_from_string(seed));
    let paragraph_count = 1 + (rng.next() * 2.0).floor() as usize;
    let mut paragraphs = Vec::with_capacity(paragraph_count);
    for _ in 0..paragraph_count {
        let sentence_count = 2 + (rng.next() * 3.0).floor() as usize;
        let sentences: Vec<String> = (0..sentence_count).map(|_| build_sentence(&mut rng)).collect();
        paragraphs.push(sentences.join(" "));
    }
    paragraphs.join("\n\n")
}
