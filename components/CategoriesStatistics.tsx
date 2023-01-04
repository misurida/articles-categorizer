//import CanvasColumnChart from "../canvasjs/ColumnChart";
//import ReactColumnChart from "../charts/reactcharts/ColumnChart";
import { useEffect, useState } from "react";
import HighchartsColumnChart, { HighchartsProps } from "../charts/highcharts/ColumnChart";
import { getScore, useDatabase } from "../hooks/useDatabase";
import { Article, Category, DisplaySources } from "../utils/types";
import { Group, Input, SegmentedControl, Slider, Stack } from "@mantine/core";


export const getPrecision = (bucketSize: number) => {
  if (Number.isInteger(bucketSize)) {
    return 0;
  }
  const arr = bucketSize.toString().split('.');
  return arr[1].length;
}

export const getScoresHistSerie = (articles: Article[], category: Category, bucketSize = 1, source?: DisplaySources) => {

  let map: Record<string, number> = {}
  for (let i = 0; i < articles.length; i++) {
    const a = articles[i]
    const score = getScore(a, category, source)
    if (score !== null) {
      const s = score.toFixed(getPrecision(bucketSize))
      if (map[s] !== undefined) {
        map[s]++
      }
      else {
        map[s] = 1
      }
    }
  }

  let m: Record<string, any> = {}
  for (let i = bucketSize; i <= 10; i += bucketSize) {
    const index = i.toFixed(getPrecision(bucketSize))
    m[index] = map[index] || 0
  }

  return m
}



export const getScoresHistData = (articles: Article[], categories: Category[], bucketSize = 1, source?: DisplaySources) => {

  const series = categories.map(c => ({
    name: c.name,
    color: c.color,
    type: "column",
    data: Object.values(getScoresHistSerie(articles, c, bucketSize, source))
  }))

  const cats = categories.length > 0 ? Object.keys(getScoresHistSerie(articles, categories[0], bucketSize, source)) : []

  return {
    categories: cats,
    series
  } as HighchartsProps
}


export default function CategoriesStatistics() {

  const { filteredArticles, categories, scoreDisplaySource, selectedCategories } = useDatabase()
  const [bucketSize, setBucketSize] = useState("1")

  const [data, setData] = useState<HighchartsProps>({
    categories: [],
    series: []
  })

  useEffect(() => {
    const cats = selectedCategories.length > 0 ? categories.filter(e => selectedCategories.includes(e.id)) : categories
    const data = getScoresHistData(filteredArticles, cats, Number(bucketSize), scoreDisplaySource)
    setData(data)
  }, [filteredArticles, categories, scoreDisplaySource, bucketSize])

  return (
    <div>
      <Group>
        <Input.Wrapper label="Bucket size">
          <Stack>
            <SegmentedControl
              value={bucketSize}
              onChange={setBucketSize}
              data={[
                { value: "0.1", label: '0.1' },
                { value: "1", label: '1' },
              ]}
            />
          </Stack>
        </Input.Wrapper>
      </Group>
      <HighchartsColumnChart categories={data.categories} series={data.series} title="Scores counts" />
    </div>
  )
}
