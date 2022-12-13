self.addEventListener('message', async (event) => {
  const data = event.data
  // EDIT HERE... do expensive computations here
  postMessage(data);
});
