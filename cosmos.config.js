const config = {};

config.endpoint = process.env.COSMOS_ENDPOINT;
config.key = process.env.COSMOS_KEY;
config.database = process.env.COSMOS_DATABASE;
config.container = process.env.COSMOS_CONTAINER;

export default config;