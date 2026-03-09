import React from "react";
import {
  HomeIcon,
  UserCircleIcon,
  TableCellsIcon,
  InformationCircleIcon,
  ServerStackIcon,
  RectangleStackIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  TagIcon,
  Cog6ToothIcon,
  WalletIcon,
  TruckIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  ArchiveBoxIcon,
  CubeIcon,
  PhotoIcon,
} from "@heroicons/react/24/solid";
import { Home, Profile, Tables, Notifications } from "@/pages/dashboard";
import { SignIn, SignUp } from "@/pages/auth";
import DaftarProduk from "./pages/produk/daftar-produk/DaftarProduk";
import PrivateRoute from "./PrivateRoute";
import Order from "./pages/order/order";
import Invoice from "./pages/dashboard/invoice/invoice";
import PengajuanList from "./pages/dashboard/pengajuan/pengajuanList";
import PurchaseList from "./pages/dashboard/purchase/purchaseList";
import VendorList from "./pages/vendor/vendorList";
import CompanyList from "./pages/company/companyList";
import DeliveryOrder from "./pages/DeliveryOrder/listDO";
import ReceiveNotes from "./pages/notes/receiveNotes";
import WarehouseList from "./pages/warehouse/warehouseList";
import InventoryList from "./pages/inventory/inventoryList";
import PurchaseInvoiceList from "./pages/dashboard/purchaseInvoice/listpurchaseInvoice";
import BannerList from "./pages/banner/bannerList";
import SjInvoiceList from "./pages/sjInvoice/listSjInvoice";
import SjInvoiceDetail from "./pages/sjInvoice/detailSjInvoice";
import DetailKategori from "./pages/produk/daftar-produk/DetailKategori";

const icon = {
  className: "w-5 h-5 text-inherit",
};

export const routes = [
  {
    layout: "dashboard",
    pages: [
      {
        icon: <HomeIcon {...icon} />,
        name: "Beranda",
        path: "/home",
        element: <PrivateRoute element={<Home />} />,
      }
    ]
  },
  {
    title: 'Katalog',
    layout: "dashboard",
    pages: [
      {
        icon: <ShoppingBagIcon {...icon} />,
        name: "Order",
        path: "/order",
        element: <Order />,
      },
      {
        icon: <DocumentTextIcon {...icon} />,
        name: "Pengajuan",
        path: "/pengajuan",
        element: <PengajuanList />,
      },
      {
        icon: <CurrencyDollarIcon {...icon} />,
        name: "Purchase",
        path: "/purchase",
        element: <PurchaseList />,
      },
      {
        icon: <RectangleStackIcon {...icon} />,
        name: "Receive Notes",
        path: "/notes",
        element: <ReceiveNotes />,
      },
      {
        icon: <TruckIcon {...icon} />,
        name: "Delivery Order",
        path: "/delivery-order",
        element: <DeliveryOrder />,
      },
      {
        icon: <TagIcon {...icon} />,
        name: "Invoice",
        path: "/invoice",
        element: <Invoice />,
      },
      {
        icon: <WalletIcon {...icon} />,
        name: "Purchase Invoice",
        path: "/purchaseInvoice",
        element: <PurchaseInvoiceList />,
      },
    ],
  },
  {
    title: 'Pendukung',
    layout: "dashboard",
    pages: [
      {
        icon: <DocumentTextIcon {...icon} />,
        name: "SJ Invoice",
        path: "/sj-invoice",
        element: <PrivateRoute element={<SjInvoiceList />} />,
      },
      {
        icon: <DocumentTextIcon {...icon} />,
        name: "SJ Invoice Detail",
        path: "/sj-invoice/detail/:id",
        element: <PrivateRoute element={<SjInvoiceDetail />} />,
        hidden: true,
      },
    ],
  },
  {
    title: 'Manajemen Konten',
    layout: "dashboard",
    pages: [
      {
        icon: <PhotoIcon {...icon} />,
        name: "Banner",
        path: "/banner",
        element: <BannerList />,
      },
    ],
  },
  {
    title: 'Dan Lain-Lain',
    layout: "dashboard",
    pages: [
      {
        icon: <UserCircleIcon {...icon} />,
        name: "Vendor",
        path: "/vendor",
        element: <VendorList />,
      },
      {
        icon: <BuildingOfficeIcon {...icon} />,
        name: "Customers",
        path: "/company",
        element: <CompanyList />,
      },
      {
        icon: <ArchiveBoxIcon {...icon} />,
        name: "Warehouse",
        path: "/warehouse",
        element: <WarehouseList />,
      },
      {
        icon: <CubeIcon {...icon} />,
        name: "Inventory",
        path: "/inventory",
        element: <InventoryList />,
      },
      {
        icon: <TableCellsIcon {...icon} />,
        name: "Master",
        path: "/produk",
        element: <PrivateRoute element={<DaftarProduk />} />,
      },
    ],
  },
];

export default routes;