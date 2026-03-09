import { chartsConfig } from "@/configs";

const websiteViewsChart = {
  type: "bar",
  height: 220,
  series: [
    {
      name: "Views",
      data: [50, 20, 10, 22, 50, 10, 40],
    },
  ],
  options: {
    ...chartsConfig,
    colors: "#388e3c",
    plotOptions: {
      bar: {
        columnWidth: "16%",
        borderRadius: 5,
      },
    },
    xaxis: {
      ...chartsConfig.xaxis,
      categories: ["M", "T", "W", "T", "F", "S", "S"],
    },
  },
};

const jajaIdAutoChart = {
  type: "bar",
  height: 400,
  series: [
    {
      name: "JAJA ID",
      data: [1200000, 1500000, 1800000, 2200000, 1900000, 2100000, 2400000, 2600000, 2300000, 2800000, 2500000, 3000000],
    },
    {
      name: "JAJA AUTO", 
      data: [800000, 950000, 1100000, 1300000, 1200000, 1400000, 1600000, 1800000, 1500000, 2000000, 1700000, 2200000],
    },
  ],
  options: {
    ...chartsConfig,
    colors: ["#8B5CF6", "#F59E0B"],
    plotOptions: {
      bar: {
        columnWidth: "60%",
        borderRadius: 8,
      },
    },
    stroke: {
      lineCap: "round",
    },
    markers: {
      size: 5,
    },
    xaxis: {
      ...chartsConfig.xaxis,
      categories: [
       "Jan",
       "Feb", 
       "Mar",
       "Apr",
       "Mei",
       "Jun",
       "Jul",
       "Agus",
       "Sept",
       "Okt",
       "Nov",
       "Des",
      ],
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
    },
  },
};

const completedTaskChart = {
  type: "line",
  height: 220,
  series: [
    {
      name: "Sales",
      data: [50, 40, 300, 320, 500, 350, 200, 230, 500],
    },
  ],
  options: {
    ...chartsConfig,
    colors: ["#388e3c"],
    stroke: {
      lineCap: "round",
    },
    markers: {
      size: 5,
    },
    xaxis: {
      ...chartsConfig.xaxis,
      categories: [
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
    },
  },
};
const completedTasksChart = {
  ...completedTaskChart,
  series: [
    {
      name: "Tasks",
      data: [50, 40, 300, 220, 500, 250, 400, 230, 500],
    },
  ],
};

export const statisticsChartsData = [
  {
    color: "white",
    title: "KURVA PENDAPATAN JAJA ID & JAJA AUTO",
    description: "Perbandingan penjualan JAJA ID dan JAJA AUTO per bulan",
    footer: "Data terupdate real-time",
    chart: jajaIdAutoChart,
  },
];

export default statisticsChartsData;
