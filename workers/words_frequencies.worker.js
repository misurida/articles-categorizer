import { getArticleWordFrequencies } from '../utils/keywords_handler'

self.addEventListener('message', async (event) => {
  const articles = event.data.articles || []
  postMessage(getArticleWordFrequencies(articles));
});
