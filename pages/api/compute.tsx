import { NextApiRequest, NextApiResponse } from "next";
import { computeScores } from "../../utils/keywords_handler";
import { Article, Category } from "../../utils/types";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  if (req.method === "POST") {

    const data = req.body || {}
    const articles: Article[] = data.articles || []
    const categories: Category[] = data.categories || []

    const results = articles.map(a => computeScores(a, categories, false))

    res.status(200).json({
      articles,
      categories,
      results
    })

  }

  else {
    res.status(400)
  }

}

