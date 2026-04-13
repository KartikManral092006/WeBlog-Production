export const EXPLORE_TOPICS = [
  "Education",
  "Technology",
  "Artificial Intelligence",
  "Cloud Technologies",
  "Web Development",
  "Self Improvement",
  "Society",
  "World",
];

const TOPIC_KEYWORDS = {
  Education: [
    "education",
    "learning",
    "course",
    "study",
    "school",
    "teacher",
    "student",
    "tutorial",
  ],
  Technology: [
    "technology",
    "tech",
    "software",
    "hardware",
    "startup",
    "innovation",
    "programming",
  ],
  "Artificial Intelligence": [
    "artificial intelligence",
    "ai",
    "machine learning",
    "deep learning",
    "llm",
    "neural",
    "model",
    "nlp",
  ],
  "Cloud Technologies": [
    "cloud",
    "aws",
    "azure",
    "gcp",
    "kubernetes",
    "docker",
    "serverless",
    "devops",
  ],
  "Web Development": [
    "web",
    "frontend",
    "backend",
    "react",
    "nextjs",
    "javascript",
    "css",
    "html",
    "api",
  ],
  "Self Improvement": [
    "productivity",
    "habit",
    "mindset",
    "growth",
    "discipline",
    "motivation",
    "wellbeing",
  ],
  Society: [
    "society",
    "culture",
    "community",
    "ethics",
    "social",
    "behavior",
    "people",
  ],
  World: [
    "world",
    "global",
    "international",
    "economy",
    "politics",
    "environment",
    "climate",
  ],
};

export function detectBlogCategory(title = "", content = "") {
  const text = `${title} ${content}`.toLowerCase();
  const scoreMap = {};

  for (const topic of EXPLORE_TOPICS) {
    scoreMap[topic] = 0;
    const words = TOPIC_KEYWORDS[topic] || [];

    for (const word of words) {
      if (text.includes(word)) {
        scoreMap[topic] += word.length > 4 ? 2 : 1;
      }
    }
  }

  let bestTopic = "World";
  let bestScore = 0;

  for (const topic of EXPLORE_TOPICS) {
    if (scoreMap[topic] > bestScore) {
      bestScore = scoreMap[topic];
      bestTopic = topic;
    }
  }

  return bestScore === 0 ? "World" : bestTopic;
}
