import { useEffect, useState } from 'react';
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

  const [state, setState] = useState<Highcharts.Options>({
    chart: {
      type: 'column'
    },
    title: {
      text: props.title
    },
    xAxis: {
      categories: props.categories || ['A', 'B', 'C'],
    },
    series: props.series,
    /* plotOptions: {
      series: {
        point: {
          events: {
            //mouseOver: this.setHoverData.bind(this)
          }
        }
      }
    } */
  })

  const id = uuidv4()

  useEffect(() => {
    Highcharts.chart(id, {
      chart: {
        type: 'column'
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
    });
  }, [props.categories, props.series, props.title])



  return (
    <div>
      <div id={id}></div>
    </div>
  )
}