import { Chart, ChartOptions } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

const legendMarginPlugin = {
  id: 'legendMargin',
  beforeUpdate(chart: any) {
    const legend = chart.legend;
    if (legend) {
      if (!legend._fitOverridden) {
        legend._fitOverridden = true;
        const originalFit = legend.fit;
        legend.fit = function(this: any) {
          originalFit.bind(this)();
          this.height += 25; // Reclaim 25px of vertical spacing below the legend items
        };
      }
    }
  }
};

Chart.register(zoomPlugin, legendMarginPlugin);

// If you need to customize options based on parameters
export function getChartOptions(
  getExtraData?: (year: number) => {
    effectiveIncome: number;
    taxesOwed: number;
    totalWithdrawn: number;
    totalAfterTax: number;
  } | null,
  onHoverYear?: (year: number) => void
): ChartOptions<'line'> {
  return {
    elements: {
      point: {
        radius: 3,
        borderWidth: 0,
        hoverRadius: 10,
      }
    },
    responsive: true,
    // borderColor: 'black',
    animation: {
      duration: 0, // general animation time
    },
    plugins: {
      zoom: {
        limits: {
          x: {
            min: 0,
            max: 50,
            minRange: 1
          }
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true
          },
          mode: 'x',
        },
        pan: {
          enabled: true,
          mode: 'x',
        }
      },
      tooltip: {
        enabled: false // Disable default tooltip popover as requested
      },
      legend: {
        labels: {
          color: 'white',
          usePointStyle: true,
          // borderRadius: 0,
          boxWidth: 7,
          boxHeight: 7,
          font: {
            family: 'sans-serif',
            size: 13
          },
          padding: 20
        }
      },
    },
    onHover: (event, activeElements, chart) => {
      if (onHoverYear && activeElements && activeElements.length > 0) {
        const activeElement = activeElements[0];
        const dataset = chart.data.datasets[activeElement.datasetIndex];
        const dataPoint: any = dataset.data[activeElement.index];
        if (dataPoint) {
          const xVal = dataPoint.x !== undefined ? dataPoint.x : dataPoint;
          onHoverYear(Number(xVal));
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    hover: {
      mode: 'index',
      intersect: false
    },
    maintainAspectRatio: false,
    scales: {
      x: {
        border: {
          display: true,
          color: 'white'
        },
        type: 'linear', // Specify the scale type as linear
        position: 'bottom', // Position can be 'left', 'right', 'top', 'bottom'
        grid: {
          display: false, // Hide grid lines for x-axis
          color: 'white', // Grid line color
        },
        ticks: {
          color: 'white',
          includeBounds: false,
          callback: function(value, index, values) {
            const numVal = Number(value);
            if (Math.round(numVal) !== numVal) {
              return null;
            }
            if (index === values.length - 1) {
              return null;
            } else {
              return numVal;
            }
          }
        },
        title: {
          display: true,
          text: 'Year',
          color: 'white' // Title text color
        }
      },
      y: {
        // afterBuildTicks: function(scale) {
        //   if (scale.ticks.length > 0) {
        //     scale.ticks = scale.ticks.filter((tick, index) => index < scale.ticks.length - 1); // Remove the last tick
        //   }
        // },
        border: {
          display: true,
          color: 'white'
        },
        grid: {
          display: false, // Hide grid lines for y-axis
          color: 'white', // Grid line color
        },
        ticks: {
          color: 'white', // Ticks text color
          callback: function(value, index, values) {
            return (Number(value) / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + 'k';
          }
        },
        title: {
          display: true,
          text: 'Balance',
          color: 'white' // Title text color
        }
      }
    }
  };
};
