import { processFile } from '../utils/helpers'

self.addEventListener('message', async (event) => {
  const datasetFile = event.data
  const data = await processFile(datasetFile)
  postMessage(data);
});
