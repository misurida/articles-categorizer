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
   
  let query = "SELECT * FROM c"
  if(req.query.offset !== undefined && req.query.limit !== undefined && Number(req.query.limit) > 0) {
    query += ` OFFSET ${req.query.offset} LIMIT ${req.query.limit}`
  }
  else if(req.query.limit !== undefined && Number(req.query.limit) > 0) {
    query += ` OFFSET 0 LIMIT ${req.query.limit}`
  }

  const querySpec = {
    query,
  };

  // db call
  const response = await containerID.items.query(querySpec).fetchAll()

  // response
  res.status(200).json({ data: response })
}