import { ChartConfiguration, ChartOptions } from 'chart.js';

// If you need to customize options based on parameters
export function getChartOptions(): ChartOptions<'line'> {
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
      tooltip: {
        animation: false,
        usePointStyle: true,
        borderWidth: 2000,
        boxWidth: 8,
        boxHeight: 8,
        mode: 'index',
        intersect: false,
        callbacks: {
          title: function(tooltipItems) {
            // This will change the title. You can access the tooltipItems or data to customize it.
            return 'Year ' + tooltipItems[0].label;
          },
          label: function(context) {
            let label = context.dataset.label || '';

            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD' ,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(context.parsed.y);
            }
            return label;
          }
        }
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
    hover: {
      mode: 'nearest',
      intersect: false
    },
    aspectRatio:2.5,
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
          callback: function(value, index, values) {
            if (index === values.length - 1) {
              return null;
            } else {
              return value;
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
