import { CosmosClient } from "@azure/cosmos";
import { NextApiRequest, NextApiResponse } from "next";
import config from "../../cosmos.config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  // setting up the client db
  const { endpoint, key, database, container } = config as Record<string, string>;
  const client = new CosmosClient({ endpoint, key });
  const databaseID = client.database(database);
  const containerID = databaseID.container(container);

  // query
  console.log(`Querying: db=${database}, container=${container}`);
  const querySpec = {
    query: "SELECT * FROM c OFFSET 0 LIMIT 10",
  };

  // db call
  const response = await containerID.items.query(querySpec).fetchAll()

  // response
  res.status(200).json({ data: response })
}