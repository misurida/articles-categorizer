import { computeScores } from '../utils/keywords_handler'

self.addEventListener('message', async (event) => {
  const articles = event.data.articles || []
  const categories = event.data.categories || []
  const data = articles.map(a => ({
    ...a,
    classification: computeScores(a, categories, true)
  }))
  postMessage(data);
});
