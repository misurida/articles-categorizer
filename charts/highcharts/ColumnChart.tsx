import { useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting'
import { uuidv4 } from '../../utils/helpers';

if (typeof Highcharts === 'object') {
  HighchartsExporting(Highcharts)
}

export interface HighchartsProps {
  categories: string[]
  series?: Highcharts.SeriesOptionsType[]
  title?: string
}



export default function ColumnChart(props: HighchartsProps) {

  const id = uuidv4()

  useEffect(() => {
    Highcharts.chart(id, {
      chart: {
        type: 'column',
        zoomType: 'x'
      },
      title: {
        text: props.title
      },
      subtitle: {
        text: ""
      },
      xAxis: {
        categories: props.categories,
        crosshair: true,
        title: {
          text: "Score"
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: "Count"
        }
      },
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0
        }
      },
      series: props.series
    } as any);
  }, [props.categories, props.series, props.title])


  return (
    <div>
      <div id={id}></div>
    </div>
  )
}