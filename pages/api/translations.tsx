import { NextApiRequest, NextApiResponse } from "next";

export function readCSV(path: string) {
  return new Promise((resolve, reject) => {
    const fs = require("fs");
    const csv = require("csv-parser");
    var results: any[] = [];
    fs.createReadStream(path)
      .pipe(csv())
      .on("data", (data: any) => results.push(data))
      .on("end", () => {
        fs.writeFile(`./translations.json`, JSON.stringify(results), (err: any) => {
          if (err) console.log('Error writing file:', err);
        })
        resolve(results)
      });
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  res.status(200).json({
    data: await readCSV("./translations.csv")
  })

}

