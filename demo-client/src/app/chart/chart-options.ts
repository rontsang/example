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
  },
  afterDraw(chart: any) {
    const legend = chart.legend;
    if (legend && chart.scales && chart.scales.x) {
      if (chart.lifespan !== undefined) {
        const lifespan = chart.lifespan;
        if (lifespan > 0) {
          const ctx = chart.ctx;
          ctx.save();
          ctx.font = '13px sans-serif';
          ctx.fillStyle = '#ffffff'; // Matches legend text color
          ctx.textBaseline = 'middle';
          
          const lifespanText = lifespan >= 100 ? '100+' : lifespan.toFixed(1);
          const text = `Portfolio lasts: ${lifespanText} years`;
          
          let x = chart.width - 20;
          let y = legend.top + (legend.height - 25) / 2;
          
          if (chart.width < 480) {
            ctx.textAlign = 'center';
            x = chart.width / 2;
            y = legend.bottom - 10;
          } else {
            ctx.textAlign = 'right';
          }
          
          ctx.fillText(text, x, y);
          ctx.restore();
        }
      }
    }
  }
};


const hoverLinePlugin = {
  id: 'hoverLine',
  beforeDraw(chart: any) {
    const activeElements = chart.getActiveElements();
    if (activeElements && activeElements.length) {
      const activePoint = activeElements[0];
      const datasetIndex = activePoint.datasetIndex;
      const index = activePoint.index;
      const dataset = chart.data.datasets[datasetIndex];
      const dataPoint: any = dataset.data[index];
      if (dataPoint) {
        const xVal = dataPoint.x !== undefined ? dataPoint.x : dataPoint;
        const hoveredX = Number(xVal);
        const scale = chart.scales.x;
        if (scale && scale._labelItems) {
          for (const item of scale._labelItems) {
            const tickVal = item.value;
            if (tickVal !== undefined && Math.abs(tickVal - hoveredX) < 1.5) {
              item.label = ''; // Hide the overlapped label
            }
          }
        }
      }
    }
  },
  afterDraw(chart: any) {
    const activeElements = chart.getActiveElements();
    if (activeElements && activeElements.length) {
      const activePoint = activeElements[0];
      const ctx = chart.ctx;
      const x = activePoint.element.x;
      const topY = chart.scales.y.top;
      const bottomY = chart.scales.y.bottom;

      ctx.save();
      // Draw vertical line
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.stroke();

      // Draw hovered year on X-axis
      const datasetIndex = activePoint.datasetIndex;
      const index = activePoint.index;
      const dataset = chart.data.datasets[datasetIndex];
      const dataPoint: any = dataset.data[index];
      if (dataPoint) {
        const xVal = dataPoint.x !== undefined ? dataPoint.x : dataPoint;
        const yearText = Math.round(Number(xVal)).toString();

        const scale = chart.scales.x;
        let textY = bottomY + 4;
        let fontStr = '12px sans-serif';
        let fontColor = '#ffffff';

        if (scale) {
          const tickLength = scale.options.grid?.tickLength ?? 5;
          const padding = scale.options.ticks?.padding ?? 3;
          textY = bottomY + tickLength + padding;

          const tickFont = scale.options.ticks?.font;
          if (tickFont) {
            const size = tickFont.size || 12;
            const family = tickFont.family || 'sans-serif';
            const weight = tickFont.weight || 'normal';
            const style = tickFont.style || 'normal';
            fontStr = `${style} ${weight} ${size}px ${family}`;
          }
          if (scale.options.ticks?.color) {
            fontColor = scale.options.ticks.color as string;
          }
        }

        ctx.font = fontStr;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = fontColor;
        ctx.fillText(yearText, x, textY);
      }
      ctx.restore();
    }
  }
};

Chart.register(zoomPlugin, legendMarginPlugin, hoverLinePlugin);

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
    clip: false,
    layout: {
      padding: {
        left: 10,
        right: 15,
        top: 10,
        bottom: 0
      }
    },
    elements: {
      point: {
        radius: 0,
        borderWidth: 0,
        hoverRadius: 6,
        hoverBorderWidth: 0
      }
    },
    responsive: true,
    // borderColor: 'black',
    animation: {
      duration: 0, // general animation time
    },
    transitions: {
      active: {
        animation: {
          duration: 0
        }
      }
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
          display: true,
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'white',
          includeBounds: false,
          callback: function(this: any, value, index, values) {
            const numVal = Number(value);
            if (Math.round(numVal) !== numVal) {
              return null;
            }
            
            // If overlapping with hovered year, do not display the tick
            const chart = this.chart;
            const activeElements = chart.getActiveElements();
            if (activeElements && activeElements.length > 0) {
              const activePoint = activeElements[0];
              const dataset = chart.data.datasets[activePoint.datasetIndex];
              const dataPoint: any = dataset.data[activePoint.index];
              if (dataPoint) {
                const hoveredX = Number(dataPoint.x !== undefined ? dataPoint.x : dataPoint);
                if (Math.abs(numVal - hoveredX) < 1.5) {
                  return null;
                }
              }
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
          display: true,
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'white', // Ticks text color
          callback: function(value, index, values) {
            const numVal = Number(value);
            if (numVal >= 1000000) {
              return (numVal / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'M';
            } else {
              return (numVal / 1000).toLocaleString('en-US', { maximumFractionDigits: 0 }) + 'k';
            }
          }
        },
        title: {
          display: true,
          text: 'Balance (Start of Year)',
          color: 'white' // Title text color
        }
      }
    }
  };
};
