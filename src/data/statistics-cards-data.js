import {
  BanknotesIcon,
  UserPlusIcon,
  UsersIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  CursorArrowRaysIcon
} from "@heroicons/react/24/solid";

export const statisticsCardsData = [
  {
    color: "blue",
    icon: ShoppingCartIcon,
    title: "TOTAL ORDER",
    value: "6.158",
    subtitle: "Rp41.738.646.516",
    footer: {
      color: "text-green-500",
      value: "+12.5%",
      label: "than last month",
    },
  },
  {
    color: "green",
    icon: CurrencyDollarIcon,
    title: "TOTAL INVOICE",
    value: "6.187",
    subtitle: "Rp39.722.308.821",
    footer: {
      color: "text-green-500",
      value: "+8.3%",
      label: "than last month",
    },
  },
  {
    color: "purple",
    icon: UsersIcon,
    title: "JAJA ID",
    value: "4.568",
    subtitle: "Rp8.376.913.362",
    footer: {
      color: "text-green-500",
      value: "+15.2%",
      label: "than last month",
    },
  },
  {
    color: "orange",
    icon: ChartBarIcon,
    title: "JAJA AUTO",
    value: "1.590",
    subtitle: "Rp33.784.712.323",
    footer: {
      color: "text-green-500",
      value: "+5.7%",
      label: "than last month",
    },
  },
  // {
  //   color: "pink",
  //   icon: CursorArrowRaysIcon,
  //   title: "PRODUK DILIHAT",
  //   value: "245",
  //   footer: {
  //     color: "text-green-500",
  //     value: "+5%",
  //     label: "than yesterday",
  //   },
  // },
];

export default statisticsCardsData;
