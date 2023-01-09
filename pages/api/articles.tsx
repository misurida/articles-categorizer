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
  const limit = req.query.limit
  const offset = req.query.offset
  const mode = req.query.mode

  console.log(limit, offset, mode)
  let query = "SELECT * FROM c"
  // mode
  if (mode === "last_to_first") {
    query += ` ORDER BY c.id DESC`
  }

  // limit / offset
  if (req.query.offset !== undefined && limit !== undefined && Number(limit) > 0) {
    query += ` OFFSET ${offset} LIMIT ${limit}`
  }
  else if (limit !== undefined && Number(limit) > 0) {
    query += ` OFFSET 0 LIMIT ${limit}`
  }

  const querySpec = {
    query,
  };

  // db call
  const response = await containerID.items.query(querySpec).fetchAll()

  // response
  res.status(200).json({ data: response })
}