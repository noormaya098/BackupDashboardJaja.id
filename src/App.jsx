import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { clearExpiredToken } from './utils/auth';
import cacheManager from './utils/cacheManager';

import { Dashboard, Auth } from "@/layouts";
import EditProduk from './pages/produk/daftar-produk/EditProduk';
import { SignIn, SignUp, SSOCallback, ApplicationLogin } from './pages/auth';
import DetailOrder from './pages/order/detailOrder';
import CreateOrder from './pages/order/createOrder';
import DetailInvoice from './pages/dashboard/invoice/detailInvoice';
import InvoicePrint from './pages/dashboard/invoice/printInvoice';
import EditOrder from './pages/order/editOrder';
import PengajuanPembelianBaru from './pages/dashboard/pengajuan/PengajuanBaru';
import TambahPengajuan from './pages/dashboard/pengajuan/TambahPengajuan';
import PengajuanPembelian from './pages/dashboard/pengajuan/PengajuanPembelian';
import EditPengajuan from './pages/dashboard/pengajuan/EditPengajuan';
// import PurchaseAdd from './pages/dashboard/purchase/createPurchase';
import PurchaseOrderDetail from './pages/dashboard/purchase/purchaseDetail';
import PrintPOView from './pages/dashboard/purchase/printview';
import BuatOrderPO from './pages/dashboard/purchase/buatOrderPO';
import DetailDummy from './pages/dashboard/invoice/detaildummy';
import AddProductPage from './pages/produk/daftar-produk/AddProduk';
import VendorDetail from './pages/vendor/detailVendor';
import CompanyDetail from './pages/company/companyDetail';
import SelectProductsPage from './pages/order/selectProducts';
import PurchaseRequestForm from './pages/dashboard/pengajuan/pengajuanAja';
import AddDeliveryOrder from './pages/DeliveryOrder/addDeliveryOrder';
import EditPurchaseOrder from './pages/dashboard/purchase/editPurchase';
import DeliveryOrderPage from './pages/DeliveryOrder/deliveryDetail';
import SelectDeliveryPage from './pages/DeliveryOrder/selectDelivery';
import DetailProduct from './pages/produk/daftar-produk/detailProduct';
import AddVendor from './pages/vendor/addVendor';
import EditVendor from './pages/vendor/editVendor';
import AddCompany from './pages/company/addCompany';
import EditCompany from './pages/company/editCompany';
import CreateReceiveNote from './pages/notes/createNotes';
import EditReceiveNote from './pages/notes/editNotes';
import ReceiveNoteDetail from './pages/notes/detailNotes';
import WarehouseDetail from './pages/warehouse/warehouseDetail';
import EditWarehouse from './pages/warehouse/editWarehouse';
import CreateWarehouse from './pages/warehouse/addWarehouse';
import PurchaseInvoiceDetail from './pages/dashboard/purchaseInvoice/detailpurchaseInvoice';
import AddPurchaseInvoice from './pages/dashboard/purchaseInvoice/addPurchaseInvoice';
import EditPurchaseInvoice from './pages/dashboard/purchaseInvoice/editPurchaseInvoice';
import PrintSjInvoice from './pages/sjInvoice/PrintSjInvoice';


import DetailKategori from './pages/produk/daftar-produk/DetailKategori';
import PrivateRoute from './PrivateRoute';
// import CommandCenterMonitoring from './pages/test';

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize cache management
    cacheManager.init();

    // Fungsi untuk mengecek dan redirect jika token expired
    const checkAndRedirect = () => {
      const isExpired = clearExpiredToken();
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath.startsWith('/auth') || currentPath === '/';
      
      if (isExpired && !isAuthPage) {
        // Clear all localStorage to ensure clean state
        localStorage.clear();
        // Redirect ke SSO login menggunakan replace (tidak bisa back)
        window.location.replace('/auth/sso-callback');
        return true;
      }
      return false;
    };

    // Cek token expired SEGERA saat component mount
    // Ini mencegah blank space saat user buka dashboard setelah 1 hari
    const redirected = checkAndRedirect();
    
    // Hanya set interval jika tidak redirect
    if (!redirected) {
      // Cek token expired setiap 1 menit untuk monitoring berkelanjutan
      const interval = setInterval(() => {
        checkAndRedirect();
      }, 60000); // 60.000 ms = 1 menit
      
      return () => clearInterval(interval);
    }
  }, [navigate]);

  return (
    <Routes>
      {/* Redirect root to SSO callback so opening localhost:5174 triggers SSO login */}
      <Route path="/" element={<Navigate to="/auth/sso-callback" replace />} />
      <Route path="/dashboard/*" element={<Dashboard />}>
        <Route path='produk/daftar-produk/edit-produk/:id' element={<EditProduk />} />
        <Route path='produk/daftar-produk/add' element={<AddProductPage />} />
        <Route path='produk/daftar-produk/detail/:id' element={<DetailProduct />} />
        <Route path='produk/category/detail/:id' element={<DetailKategori />} />
        <Route path="vendor/:id_vendor" element={<VendorDetail />} />
        <Route path="vendor/add" element={<AddVendor />} />
        <Route path="vendor/edit/:id_vendor" element={<EditVendor />} />
        <Route path="company/:id_company" element={<CompanyDetail />} />
        <Route path="company/edit/:id_company" element={<EditCompany />} />
        <Route path="company/add" element={<AddCompany />} />
        <Route path='order/detail-order/:id_data' element={<DetailOrder />} />
        <Route path='order/edit-order/:id_data' element={<EditOrder />} />
        <Route path='order/create-order' element={<CreateOrder />} />
        <Route path='notes/detail-order/:id_notes' element={< ReceiveNoteDetail/>} />
        <Route path='notes/edit-notes/:id_notes' element={<EditReceiveNote />} />
        <Route path='notes/create-notes/:id_purchase_order' element={<CreateReceiveNote />} />
        <Route path='warehouse/detail-warehouse/:id_warehouse' element={< WarehouseDetail/>} />
        <Route path='warehouse/edit-warehouse/:id_warehouse' element={<EditWarehouse />} />
        <Route path='warehouse/create-warehouse' element={<CreateWarehouse />} />
        <Route path='order/select-products/:id_data' element={<SelectProductsPage />} />
        <Route path='invoice/detail-invoice/dummy/:id_data' element={<DetailDummy />} />
        <Route path='invoice/detail-invoice/:id_invoice' element={<DetailInvoice />} />
        <Route path='pengajuan/:id_pengajuan' element={<PengajuanPembelianBaru />} />
        <Route path="pengajuan/add/:id_data" element={<TambahPengajuan />} />
        <Route path="pengajuan/edit/:id_pengajuan" element={<EditPengajuan />} />
        <Route path="pengajuan/aja" element={<PurchaseRequestForm />} />
        <Route path="pengajuan/detail/:id_pengajuan" element={<PengajuanPembelian />} />
        <Route path="pengajuan/detail/print/:id_pengajuan" element={<PengajuanPembelian />} />
        {/* <Route path="purchase/add/:id_pengajuan" element={<PurchaseAdd />} /> */}
        <Route path="purchase/order/delivery-order/:id_purchase_order" element={<AddDeliveryOrder />} />
        <Route path="purchase/detail/:id_pengajuan" element={<BuatOrderPO />} />
        <Route path="purchaseinvoice/add/:id_purchase_order" element={<AddPurchaseInvoice />} />
        <Route path="purchaseinvoice/edit/:id_purchase_invoice" element={<EditPurchaseInvoice />} />
        <Route path="purchase/order/edit/:id_purchase_order" element={<EditPurchaseOrder />} />
        <Route path="purchase/order/detail/:id_purchase_order" element={<PurchaseOrderDetail />} />
        <Route path="purchaseinvoice/order/detail/:id_purchase_invoice" element={<PurchaseInvoiceDetail />} />
        <Route path="delivery-order/detail/:id_delivery_order" element={<DeliveryOrderPage />} />
        <Route path="delivery-order/select/detail/:id_delivery_order" element={<SelectDeliveryPage />} />
        <Route path="purchase/order/detail/printpo_bulat/:id_purchase_order" element={<PrintPOView type="printpo_bulat" />} />
        <Route path="purchase/order/detail/printpo_nobulat/:id_purchase_order" element={<PrintPOView type="printpo_nobulat" />} />
        <Route path="purchase/order/detail/no_ttd/:id_purchase_order" element={<PrintPOView type="no_ttd" />} />
        <Route path="purchase/order/detail/kacab/:id_purchase_order" element={<PrintPOView type="kacab" />} />
        <Route path="purchase/order/detail/BA/:id_purchase_order" element={<PrintPOView type="BA" />} />
        <Route path="purchase/order/detail/ba_noTTD/:id_purchase_order" element={<PrintPOView type="ba_noTTD" />} />
        {/* <Route path="test" element={<CommandCenterMonitoring />} /> */}
        </Route>

      <Route path="/auth/*" element={<Auth />} />
      <Route path="/auth/sign-in" element={<SignIn />} />
  <Route path="/auth/login" element={<ApplicationLogin />} />
      <Route path="/auth/sign-up" element={<SignUp />} />
      <Route path="/auth/sso-callback" element={<SSOCallback />} />
  {/* Handle external SSO provider redirect target */}
  <Route path="/nimda/sso-login" element={<SSOCallback />} />
      <Route path="/application/login" element={<ApplicationLogin />} />
      

      
      {/* Detail Kategori tanpa sidebar */}


      {/* Invoice Print route outside Dashboard */}
      <Route path='/invoice/print-invoice' element={<InvoicePrint />} />

      {/* Print SJ Invoice route outside Dashboard */}
      <Route path="/sj-invoice/print/:id" element={<PrintSjInvoice />} />


      {/* Fallback: keep previous behavior for unknown paths (optional) */}
      <Route path="*" element={<Navigate to="/dashboard/home" replace />} />
    </Routes>
  );
}

export default App;
