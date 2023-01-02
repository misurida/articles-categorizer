//import CanvasColumnChart from "../canvasjs/ColumnChart";
//import ReactColumnChart from "../charts/reactcharts/ColumnChart";
import { useEffect, useState } from "react";
import HighchartsColumnChart, { HighchartsProps } from "../charts/highcharts/ColumnChart";
import { getScore, useDatabase } from "../hooks/useDatabase";
import { Article, Category, DisplaySources } from "../utils/types";


export const getPrecisionFromIncrement = (increment: number) => {
  let precision = 0
  if (increment < 1) precision = 1
  return precision
}

export const getScoresHistSerie = (articles: Article[], category: Category, increment = 1, source?: DisplaySources) => {

  let map: Record<string, number> = {}
  for (let i = 0; i < articles.length; i++) {
    const a = articles[i]
    const score = getScore(a, category, source)
    if (score !== null) {
      const s = score.toFixed(getPrecisionFromIncrement(increment))
      if (map[s] !== undefined) {
        map[s]++
      }
      else {
        map[s] = 1
      }
    }
  }

  let m: Record<string, any> = {}
  for (let i = increment; i <= 10; i += increment) {
    const index = i.toString()
    m[index] = map[index] || 0
  }

  return m
}



export const getScoresHistData = (articles: Article[], categories: Category[], increment = 1, source?: DisplaySources) => {

  const series = categories.map(c => ({
    name: c.name,
    color: c.color,
    type: "column",
    data: Object.values(getScoresHistSerie(articles, c, increment, source))
  }))


  const precision = getPrecisionFromIncrement(increment)
  let cats: string[] = []
  for (let i = increment; i <= 10; i += increment) {
    cats.push(i.toFixed(precision))
  }

  return {
    categories: cats,
    series
  } as HighchartsProps
}


export default function CategoriesStatistics() {

  const { filteredArticles, categories, scoreDisplaySource, selectedCategories } = useDatabase()

  const [data, setData] = useState<HighchartsProps>({
    categories: [],
    series: []
  })

  useEffect(() => {
    const cats = selectedCategories.length > 0 ? categories.filter(e => selectedCategories.includes(e.id)) : categories
    const data = getScoresHistData(filteredArticles, cats, 1, scoreDisplaySource)
    setData(data)
  }, [filteredArticles, categories, scoreDisplaySource])

  return (
    <div>
      <HighchartsColumnChart categories={data.categories} series={data.series} title="Scores counts" />
    </div>
  )
}
