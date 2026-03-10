import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Table, Tabs, Input, ConfigProvider, Select, message, Modal, Menu, Dropdown } from 'antd';
import {
  CheckCircleOutlined,
  PrinterOutlined,
  EditOutlined,
  SendOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import LogoJaja from '../../../assets/LogoJaja.png';
import JajaAuto from '../../../assets/JajaAuto.png';
import { baseUrl } from '@/configs';
import { fetchAllProducts } from '@/utils/productUtils';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

const PengajuanPembelian = () => {
  const { id_pengajuan } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('1');
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [pengajuanData, setPengajuanData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [approvals, setApprovals] = useState([]);
  const [approvalStatus, setApprovalStatus] = useState('pending');
  const [approvalNote, setApprovalNote] = useState('');
  const [commentData, setCommentData] = useState([]);
  const [products, setProducts] = useState([]);
  const [isPOModalVisible, setIsPOModalVisible] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [selectedVendorProducts, setSelectedVendorProducts] = useState([]);
  const [userRole, setUserRole] = useState(null);

  const fetchPengajuanData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const currentUserName = tokenData.nama_user || 'Unknown';
      const currentUserId = tokenData.id_user || null;
      const currentUserRole = tokenData.role || null;
      setUserRole(currentUserRole);

      const userMap = {
        47: 'Eviyana',
        28: 'Anggi',
      };

      const roleMap = {
        47: 'Koord Partnership',
        28: 'Accounting',
      };

      const pengajuanResponse = await fetch(`${baseUrl}/nimda/pengajuan/${id_pengajuan}`, {
        method: 'GET',
        headers: {
          'Authorization': `${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!pengajuanResponse.ok) {
        throw new Error('Failed to fetch pengajuan data');
      }

      const pengajuanResult = await pengajuanResponse.json();
      setPengajuanData(pengajuanResult.data);

      const approvalData = pengajuanResult.data.tb_pengajuan_approve;
      const creatorName = approvalData.admin && approvalData.admin.nama_user
        ? approvalData.admin.nama_user
        : (pengajuanResult.data.created_by ? userMap[pengajuanResult.data.created_by] || `User ${pengajuanResult.data.created_by}` : 'Unknown');

      const approvalHistory = pengajuanResult.data.tb_pengajuan_approve_histories.map(history => {
        const userId = history.id_user;
        const userName = userId === pengajuanResult.data.created_by ? creatorName : (userMap[userId] || `User ${userId}`);
        const role = userId === pengajuanResult.data.created_by ? 'Staff Partnership' : (roleMap[userId] || 'Unknown Role');

        let komentar = history.text_description;
        if (komentar.includes('approved pengajuan') || komentar.includes('pending') || komentar.includes('rejected')) {
          const action = komentar.match(/(approved|pending|rejected)/i)?.[0] || 'processed';
          komentar = `${role} ${userName} ${action} pengajuan`;
        }

        return {
          key: history.id_pengajuan_approve_history,
          tanggal: new Date(history.date_history).toLocaleString('id-ID'),
          nama: `${role} ${userName}`,
          komentar: komentar,
        };
      });
      setCommentData(approvalHistory);

      const selectedIndex = pengajuanResult.data.selected;
      const selectedVendor = pengajuanResult.data.tb_pengajuan_vendors[selectedIndex];
      setSelectedSupplierId(selectedVendor ? selectedVendor.id_supplier : null);

      const finalApproverName = approvalData.final_approver_user
        ? (userMap[approvalData.final_approver_user] || `User ${approvalData.final_approver_user}`)
        : (approvalData.accounting_user_name || 'Anggi');
      const accountingName = approvalData.accounting_user
        ? (userMap[approvalData.accounting_user] || `User ${approvalData.accounting_user}`)
        : (approvalData.accounting_user_name || 'Anggi');
      const legalitasName = approvalData.legal_user
        ? (userMap[approvalData.legal_user] || `User ${approvalData.legal_user}`)
        : 'Eviyana';

      const approvalList = [
        {
          role: 'Diajukan oleh',
          name: creatorName,
          position: 'Staff Partnership',
          status: 'approved',
          date: pengajuanResult.data.tgl_pengajuan // Atau date history pembuat
        },
        {
          role: 'Diperiksa oleh',
          name: 'Yazid',
          position: 'Partnership',
          status: approvalData.legal_approval || 'pending',
          date: approvalData.legal_approval_date
        },
        {
          role: 'Diperiksa oleh',
          name: 'Eviyana',
          position: 'Koord Partnership',
          status: approvalData.final_approval || 'pending',
          date: approvalData.final_approval_date
        },
        {
          role: 'Disetujui oleh',
          name: accountingName,
          position: 'Accounting / Final Approver',
          status: approvalData.accounting_approval || 'pending',
          date: approvalData.accounting_approval_date
        },
      ];
      setApprovals(approvalList);

      const allProducts = await fetchAllProducts(token);
      setProducts(allProducts);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id_pengajuan) {
      fetchPengajuanData();
    }
  }, [id_pengajuan]);

  const getProductNameById = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : '-';
  };

  const convertToTerbilang = (angka) => {
    const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh'];
    const belasan = ['', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'];
    const puluhan = ['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'];

    if (angka === 0) return 'nol';
    if (angka < 11) return satuan[angka];
    if (angka < 20) return belasan[angka - 10];
    if (angka < 100) {
      const puluhanDigit = Math.floor(angka / 10);
      const satuanDigit = angka % 10;
      if (satuanDigit === 0) return puluhan[puluhanDigit];
      if (satuanDigit === 1) return puluhan[puluhanDigit] + ' satu';
      return puluhan[puluhanDigit] + ' ' + satuan[satuanDigit];
    }
    if (angka < 1000) {
      const ratusanDigit = Math.floor(angka / 100);
      const sisa = angka % 100;
      if (ratusanDigit === 1) {
        if (sisa === 0) return 'seratus';
        return 'seratus ' + convertToTerbilang(sisa);
      }
      if (sisa === 0) return satuan[ratusanDigit] + ' ratus';
      return satuan[ratusanDigit] + ' ratus ' + convertToTerbilang(sisa);
    }
    if (angka < 1000000) {
      const ribuanDigit = Math.floor(angka / 1000);
      const sisa = angka % 1000;
      if (ribuanDigit === 1) {
        if (sisa === 0) return 'seribu';
        return 'seribu ' + convertToTerbilang(sisa);
      }
      if (sisa === 0) return convertToTerbilang(ribuanDigit) + ' ribu';
      return convertToTerbilang(ribuanDigit) + ' ribu ' + convertToTerbilang(sisa);
    }
    if (angka < 1000000000) {
      const jutaanDigit = Math.floor(angka / 1000000);
      const sisa = angka % 1000000;
      if (sisa === 0) return convertToTerbilang(jutaanDigit) + ' juta';
      return convertToTerbilang(jutaanDigit) + ' juta ' + convertToTerbilang(sisa);
    }
    if (angka < 1000000000000) {
      const milyaranDigit = Math.floor(angka / 1000000000);
      const sisa = angka % 1000000000;
      if (sisa === 0) return convertToTerbilang(milyaranDigit) + ' milyar';
      return convertToTerbilang(milyaranDigit) + ' milyar ' + convertToTerbilang(sisa);
    }
    return 'angka terlalu besar';
  };

  const handleApprove = () => {
    let tempStatus = approvalStatus;
    let tempNote = approvalNote;

    Modal.confirm({
      title: 'Konfirmasi Approval',
      content: (
        <div>
          <p>Apakah Anda yakin ingin melanjutkan?</p>
          <Select
            defaultValue={tempStatus}
            onChange={(value) => (tempStatus = value)}
            className="w-full mb-2"
          >
            <Option value="pending">Pending</Option>
            <Option value="approved">Approved</Option>
            <Option value="rejected">Rejected</Option>
          </Select>
          <Input
            placeholder="Keterangan (opsional)"
            defaultValue={tempNote}
            onChange={(e) => (tempNote = e.target.value)}
            className="w-full"
          />
        </div>
      ),
      okText: 'OK',
      okButtonProps: { className: 'bg-green-600 border-green-600' },
      cancelText: 'Cancel',
      cancelButtonProps: { className: 'bg-red-600 border-red-600 text-white' },
      onOk: async () => {
        setApprovalStatus(tempStatus);
        setApprovalNote(tempNote);

        const token = localStorage.getItem('token');
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const userName = tokenData.nama_user || 'Unknown';
        const currentUserRole = tokenData.role || null;

        const approvalPayload = {
          id_pengajuan: parseInt(id_pengajuan),
          status: tempStatus,
          keterangan: tempNote || undefined,
          user_role: currentUserRole,
          approver_type: currentUserRole, // Tambahkan approver_type
        };

        try {
          // Normalize role untuk comparison
          const normalizedRole = (currentUserRole || '').toLowerCase().trim().replace(/\s+/g, '');

          // Untuk supervisor, coba dengan payload yang berbeda
          if (normalizedRole === 'supervisor') {
            // Coba dengan payload yang lebih sederhana untuk supervisor
            const supervisorPayload = {
              id_pengajuan: parseInt(id_pengajuan),
              status: tempStatus,
              keterangan: tempNote || undefined,
            };

            const response = await fetch(`${baseUrl}/nimda/pengajuan/approve`, {
              method: 'PUT',
              headers: {
                'Authorization': `${token}`,
                'Content-Type': 'application/json',
                'X-User-Role': 'supervisor', // Tambahkan header khusus
              },
              body: JSON.stringify(supervisorPayload),
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Gagal submit approval: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            message.success(`Approval berhasil disubmit dengan status "${tempStatus}"${tempNote ? ` dan keterangan "${tempNote}"` : ''}`);

            const newComment = {
              key: Date.now(),
              tanggal: new Date().toLocaleString('id-ID'),
              nama: userName,
              komentar: `Mengubah status menjadi "${tempStatus}"${tempNote ? ` dengan keterangan: ${tempNote}` : ''}`,
            };
            setCommentData(prev => [...prev, newComment]);

            // Refresh data pengajuan tanpa reload page
            fetchPengajuanData();
            return;
          }

          // Untuk Koord Partnership dan role lain, gunakan payload normal
          // Pastikan approver_type sesuai dengan role yang diharapkan API
          const finalPayload = {
            ...approvalPayload,
            approver_type: normalizedRole === 'koordpartnership' || normalizedRole === 'koord_partnership'
              ? 'legalitas' // Koord Partnership biasanya menggunakan approver_type 'legalitas'
              : currentUserRole
          };

          console.log('Approval Payload:', {
            currentUserRole,
            normalizedRole,
            payload: finalPayload
          });

          const response = await fetch(`${baseUrl}/nimda/pengajuan/approve/pengajuan`, {
            method: 'PUT',
            headers: {
              'Authorization': `${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(finalPayload),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gagal submit approval: ${response.status} - ${errorText}`);
          }

          const result = await response.json();
          message.success(`Approval berhasil disubmit dengan status "${tempStatus}"${tempNote ? ` dan keterangan "${tempNote}"` : ''}`);

          const newComment = {
            key: Date.now(),
            tanggal: new Date().toLocaleString('id-ID'),
            nama: userName,
            komentar: `Mengubah status menjadi "${tempStatus}"${tempNote ? ` dengan keterangan: ${tempNote}` : ''}`,
          };
          setCommentData(prev => [...prev, newComment]);

          // Refresh data pengajuan tanpa reload page
          fetchPengajuanData();
        } catch (error) {
          console.error('Error submitting approval:', error);
          message.error(`Gagal submit approval: ${error.message}`);
        }
      },
      onCancel: () => {
        message.info('Approval dibatalkan');
      },
    });
  };

  const canUserApprove = () => {
    try {
      // 1. Ambil data dari localStorage 'user' (Response JSON yang diberikan user)
      const userStr = localStorage.getItem('user');
      let userData = {};
      if (userStr) {
        try {
          userData = JSON.parse(userStr);
        } catch (e) {
          console.error('Failed to parse user from localStorage', e);
        }
      }

      // 2. Ambil data dari localStorage 'token' (Fallback/SSO)
      const raw = localStorage.getItem('token');
      let tokenPayload = {};
      if (raw) {
        try {
          let token = raw;
          if (typeof token === 'string' && token.startsWith('Bearer ')) {
            token = token.slice(7);
          }
          const parts = String(token).split('.');
          if (parts.length >= 2) {
            tokenPayload = JSON.parse(decodeURIComponent(escape(window.atob(parts[1]))));
          }
        } catch (e) {
          console.warn('canUserApprove - token parse failed', e);
        }
      }

      const userEmail = userData.email || tokenPayload.email || tokenPayload.userEmail || null;
      const userNik = userData.nik || tokenPayload.nik || tokenPayload.NIK || tokenPayload.id_user || null;
      const ssoUserId = userData.id_user || tokenPayload.userId || tokenPayload.id_user || null;

      // Sequence Approval: Yazid -> Eviyana -> Anggi

      // Step 1: Yazid (Partnership)
      if (approvals[1]?.status === 'pending') {
        if (
          userEmail === 'YazidYeldrimAlhaziva@eurekagroup.id' ||
          String(userNik) === 'P3165'
        ) {
          return true;
        }
      }

      // Step 2: Eviyana (Koord Partnership)
      // Hanya muncul jika Yazid sudah Approve
      if (approvals[2]?.status === 'pending' && approvals[1]?.status === 'approved') {
        if (userEmail === 'eviyana.nuraini@eurekagroup.id' || String(userNik) === 'P2591') {
          return true;
        }
      }

      // Step 3: Anggi (Accounting)
      // Hanya muncul jika Eviyana sudah Approve
      if (approvals[3]?.status === 'pending' && approvals[2]?.status === 'approved') {
        const tokenRole = String(userData.role || userRole || '').toLowerCase().trim();
        if (tokenRole === 'accounting' || String(ssoUserId) === '69153c62a2f2b91db1338ac8') {
          return true;
        }
      }
    } catch (err) {
      console.warn('canUserApprove - logic failed', err);
    }

    return false;
  };

  const canCreatePO = () => {
    try {
      const userStr = localStorage.getItem('user');
      let userData = {};
      if (userStr) {
        try {
          userData = JSON.parse(userStr);
        } catch (e) {
          console.error('Failed to parse user from localStorage', e);
        }
      }

      const raw = localStorage.getItem('token');
      let tokenPayload = {};
      if (raw) {
        try {
          let token = raw;
          if (typeof token === 'string' && token.startsWith('Bearer ')) {
            token = token.slice(7);
          }
          const parts = String(token).split('.');
          if (parts.length >= 2) {
            tokenPayload = JSON.parse(decodeURIComponent(escape(window.atob(parts[1]))));
          }
        } catch (e) {}
      }

      const userEmail = userData.email || tokenPayload.email || tokenPayload.userEmail || null;
      const userNik = userData.nik || tokenPayload.nik || tokenPayload.NIK || tokenPayload.id_user || null;
      const ssoUserId = userData.id_user || tokenPayload.userId || tokenPayload.id_user || null;

      // Check for Lina Widianingsih (Admin authorized to create PO)
      if (
        userEmail === 'lina.widianingsih@jaja.id' ||
        String(userNik) === 'P2450' ||
        String(ssoUserId) === '69153b6ba2f2b91db1338ab7'
      ) {
        return true;
      }
    } catch (err) {
      console.warn('canCreatePO check failed', err);
    }
    return false;
  };

  const isAllApproved = () => {
    // Pastikan data approvals sudah ter-load
    if (!approvals || approvals.length === 0) {
      return false;
    }

    // Wajib: Yazid (index 1) dan Evi (index 2)
    const yazidApproved = approvals[1]?.status === 'approved';
    const eviApproved = approvals[2]?.status === 'approved';

    return yazidApproved && eviApproved;
  };

  const handleCreatePO = () => {
    // Validasi User (Admin authorized: Lina)
    if (!canCreatePO()) {
      message.error('Anda tidak memiliki akses untuk membuat Purchase Order.');
      return;
    }

    // Validasi data approvals sudah ter-load
    if (!approvals || approvals.length === 0) {
      message.error('Data approval belum ter-load. Silakan refresh halaman.');
      return;
    }

    // Wajib: Yazid (index 1) dan Evi (index 2)
    const yazidApproval = approvals[1];
    const eviApproval = approvals[2];

    if (!yazidApproval || !eviApproval) {
      message.error('Data approval Yazid atau Evi tidak ditemukan.');
      return;
    }

    if (yazidApproval.status !== 'approved') {
      message.error(`Yazid (Partnership) harus menyetujui terlebih dahulu.`);
      return;
    }

    if (eviApproval.status !== 'approved') {
      message.error(`Evi (Koord Partnership) harus menyetujui terlebih dahulu.`);
      return;
    }

    setIsPOModalVisible(true);
  };

  const handleVendorSelect = (vendorId) => {
    setSelectedVendorId(vendorId);
    const selectedVendor = pengajuanData.tb_pengajuan_vendors.find(v => v.id_supplier === vendorId);
    if (selectedVendor) {
      setSelectedVendorProducts(selectedVendor.tb_pengajuan_pilihans || []);
    } else {
      setSelectedVendorProducts([]);
    }
  };

  const handlePOConfirm = () => {
    if (!selectedVendorId) {
      message.error('Pilih vendor terlebih dahulu.');
      return;
    }

    const selectedVendor = pengajuanData.tb_pengajuan_vendors.find(v => v.id_supplier === selectedVendorId);
    if (!selectedVendor) {
      message.error('Vendor tidak ditemukan.');
      return;
    }

    setIsPOModalVisible(false);
    setSelectedVendorId(null);
    setSelectedVendorProducts([]);
    navigate(`/dashboard/purchase/detail/${id_pengajuan}`, {
      state: {
        id_pengajuan_vendor: selectedVendor.id_pengajuan_vendor,
        id_supplier: selectedVendor.id_supplier,
        supplier_name: selectedVendor.supplier_name,
      },
    });
  };

  const productColumns = [
    { title: 'No', dataIndex: 'no', key: 'no', width: 50, render: (_, __, index) => index + 1 },
    {
      title: 'Jenis Barang',
      dataIndex: 'product_id',
      key: 'product_id',
      width: 150,
      render: (productId) => getProductNameById(productId),
    },
    { title: 'Spesifikasi', dataIndex: 'specification', key: 'specification', width: 150 },
    {
      title: 'Harga',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price) => `Rp. ${Number(price || 0).toLocaleString()}`,
    },
    { title: 'Qty', dataIndex: 'quantity', key: 'quantity', width: 60 },
    { title: 'Diskon', dataIndex: 'discount', key: 'discount', width: 80, render: (discount) => `${discount || 0}%` },
    {
      title: 'Jumlah (exc PPN)',
      dataIndex: 'total_excl_vat',
      key: 'total_excl_vat',
      width: 120,
      render: (total) => `Rp. ${Number(total || 0).toLocaleString()}`,
    },
    {
      title: 'PPN',
      dataIndex: 'ppn',
      key: 'ppn',
      width: 60,
      render: (ppn) => `${ppn || 0}%`,
    },
    {
      title: 'Total Produk',
      dataIndex: 'total_product',
      key: 'total_product',
      width: 120,
      render: (total) => `Rp. ${Number(total || 0).toLocaleString()}`,
    },
  ];

  const columns = [
    { title: 'No', dataIndex: 'no', key: 'no', width: 40, align: 'center' },
    { title: 'Spesifikasi', dataIndex: 'spesifikasi', key: 'spesifikasi', width: 150 },
    {
      title: 'Pemasok',
      children: pengajuanData?.tb_pengajuan_vendors.map(vendor => ({
        title: (
          <span className={selectedSupplierId === vendor.id_supplier ? 'text-green-700 font-semibold' : 'text-black'}>
            {vendor.supplier_name}
          </span>
        ),
        dataIndex: `${vendor.supplier_name.replace(/\s+/g, '_')}_${vendor.id_supplier}`,
        key: `${vendor.supplier_name}_${vendor.id_supplier}`,
        width: 250,
        align: 'center',
        render: (text, record) => {
          if (record.isProductRow) {
            return (
              <div className="flex justify-between items-center text-center w-full">
                <span className="flex-1">{text}</span>
              </div>
            );
          }
          return text;
        }
      })),
    },
  ].filter(Boolean);

  // COMMENTED OUT - Unused pengajuan edit functionality
  // const editPengajuan = (id_pengajuan) => navigate(`/dashboard/pengajuan/${id_pengajuan}`);

  const editPengajuan = (id_pengajuan) => navigate(`/dashboard/pengajuan/edit/${id_pengajuan}`);

  const generateTableData = () => {
    if (!pengajuanData) return { mainData: [], summaryData: [] };

    const mainData = [];
    const maxProducts = Math.max(...pengajuanData.tb_pengajuan_vendors.map(v => v.tb_pengajuan_pilihans.length));

    for (let i = 0; i < maxProducts; i++) {
      mainData.push({
        key: `${i}-1`,
        no: `${i + 1}`,
        spesifikasi: 'Jenis Barang',
        isProductRow: true,
        productIndex: i,
        ...pengajuanData.tb_pengajuan_vendors.reduce((acc, vendor) => ({
          ...acc,
          [`${vendor.supplier_name.replace(/\s+/g, '_')}_${vendor.id_supplier}`]:
            vendor.tb_pengajuan_pilihans[i]?.product_id
              ? getProductNameById(vendor.tb_pengajuan_pilihans[i].product_id)
              : '-'
        }), {})
      });
      mainData.push({
        key: `${i}-2`,
        no: '',
        spesifikasi: '(Spek)',
        isProductRow: false,
        ...pengajuanData.tb_pengajuan_vendors.reduce((acc, vendor) => ({
          ...acc,
          [`${vendor.supplier_name.replace(/\s+/g, '_')}_${vendor.id_supplier}`]:
            vendor.tb_pengajuan_pilihans[i]?.specification || '-'
        }), {})
      });
      mainData.push({
        key: `${i}-3`,
        no: '',
        spesifikasi: 'Harga',
        isProductRow: false,
        ...pengajuanData.tb_pengajuan_vendors.reduce((acc, vendor) => ({
          ...acc,
          [`${vendor.supplier_name.replace(/\s+/g, '_')}_${vendor.id_supplier}`]:
            vendor.tb_pengajuan_pilihans[i] ? `Rp. ${Number(vendor.tb_pengajuan_pilihans[i].price || 0).toLocaleString()}` : '-'
        }), {})
      });
      mainData.push({
        key: `${i}-4`,
        no: '',
        spesifikasi: 'Qty',
        isProductRow: false,
        ...pengajuanData.tb_pengajuan_vendors.reduce((acc, vendor) => ({
          ...acc,
          [`${vendor.supplier_name.replace(/\s+/g, '_')}_${vendor.id_supplier}`]:
            vendor.tb_pengajuan_pilihans[i]?.quantity || '-'
        }), {})
      });
      mainData.push({
        key: `${i}-5`,
        no: '',
        spesifikasi: 'Disc',
        isProductRow: false,
        ...pengajuanData.tb_pengajuan_vendors.reduce((acc, vendor) => ({
          ...acc,
          [`${vendor.supplier_name.replace(/\s+/g, '_')}_${vendor.id_supplier}`]:
            vendor.tb_pengajuan_pilihans[i] ? `${vendor.tb_pengajuan_pilihans[i].discount || 0}%` : '-'
        }), {})
      });
      mainData.push({
        key: `${i}-6`,
        no: '',
        spesifikasi: 'Jumlah (exc PPN)',
        isProductRow: false,
        ...pengajuanData.tb_pengajuan_vendors.reduce((acc, vendor) => ({
          ...acc,
          [`${vendor.supplier_name.replace(/\s+/g, '_')}_${vendor.id_supplier}`]:
            vendor.tb_pengajuan_pilihans[i] ? `Rp. ${Number(vendor.tb_pengajuan_pilihans[i].total_excl_vat || 0).toLocaleString()}` : '-'
        }), {})
      });
    }

    const vendorCalculations = pengajuanData.tb_pengajuan_vendors.map(vendor => {
      const subtotal = vendor.tb_pengajuan_pilihans.reduce((sum, item) =>
        sum + Number(item.total_excl_vat || 0), 0);
      const ppn = vendor.tb_pengajuan_pilihans.reduce((sum, item) =>
        sum + (Number(item.total_product || 0) - Number(item.total_excl_vat || 0)), 0);
      const grandTotal = subtotal + ppn;
      return { subtotal, ppn, grandTotal };
    });

    const allocation = pengajuanData.allocation?.toLowerCase() || '';
    const isAutoBrand = allocation.includes('auto');

    const summaryData = [
      {
        key: 'summary-1',
        spesifikasi: 'Subtotal',
        ...pengajuanData.tb_pengajuan_vendors.reduce((acc, vendor, index) => ({
          ...acc,
          [`${vendor.supplier_name.replace(/\s+/g, '_')}_${vendor.id_supplier}`]:
            `Rp. ${vendorCalculations[index].subtotal.toLocaleString()}`
        }), {})
      },
      {
        key: 'summary-2',
        spesifikasi: 'Pengiriman',
        ...pengajuanData.tb_pengajuan_vendors.reduce((acc, vendor) => ({
          ...acc,
          [`${vendor.supplier_name.replace(/\s+/g, '_')}_${vendor.id_supplier}`]:
            vendor.delivery_terms || '-'
        }), {})
      },
      {
        key: 'summary-3',
        spesifikasi: 'Pembayaran',
        ...pengajuanData.tb_pengajuan_vendors.reduce((acc, vendor) => ({
          ...acc,
          [`${vendor.supplier_name.replace(/\s+/g, '_')}_${vendor.id_supplier}`]:
            vendor.payment_terms || '-'
        }), {})
      },
      // { 
      //   key: 'summary-4', 
      //   spesifikasi: 'PKP',
      //   ...pengajuanData.tb_pengajuan_vendors.reduce((acc, vendor) => ({
      //     ...acc,
      //     [`${vendor.supplier_name.replace(/\s+/g, '_')}_${vendor.id_supplier}`]: 
      //       vendor.taxable || '-'
      //   }), {})
      // },
      {
        key: 'summary-5',
        spesifikasi: 'PPN',
        ...pengajuanData.tb_pengajuan_vendors.reduce((acc, vendor, index) => ({
          ...acc,
          [`${vendor.supplier_name.replace(/\s+/g, '_')}_${vendor.id_supplier}`]:
            `Rp. ${vendorCalculations[index].ppn.toLocaleString()}`
        }), {})
      },
      {
        key: 'summary-6',
        spesifikasi: 'Biaya Lain-lain',
        ...pengajuanData.tb_pengajuan_vendors.reduce((acc, vendor) => ({
          ...acc,
          [`${vendor.supplier_name.replace(/\s+/g, '_')}_${vendor.id_supplier}`]:
            vendor.miscellaneous || '-'
        }), {})
      },
      {
        key: 'summary-7',
        spesifikasi: 'Keterangan',
        ...pengajuanData.tb_pengajuan_vendors.reduce((acc, vendor) => ({
          ...acc,
          [`${vendor.supplier_name.replace(/\s+/g, '_')}_${vendor.id_supplier}`]:
            vendor.description || '-'
        }), {})
      }
    ];

    if (isAutoBrand) {
      summaryData.push(
        {
          key: 'summary-8',
          spesifikasi: 'Alasan',
          ...pengajuanData.tb_pengajuan_vendors.reduce((acc, vendor) => ({
            ...acc,
            [`${vendor.supplier_name.replace(/\s+/g, '_')}_${vendor.id_supplier}`]:
              vendor.alasan || '-'
          }), {})
        },
        {
          key: 'summary-9',
          spesifikasi: 'Catatan',
          ...pengajuanData.tb_pengajuan_vendors.reduce((acc, vendor) => ({
            ...acc,
            [`${vendor.supplier_name.replace(/\s+/g, '_')}_${vendor.id_supplier}`]:
              vendor.catatan || '-'
          }), {})
        },
        {
          key: 'summary-10',
          spesifikasi: 'Kesimpulan',
          className: 'kesimpulan-row',
          ...pengajuanData.tb_pengajuan_vendors.reduce((acc, vendor) => ({
            ...acc,
            [`${vendor.supplier_name.replace(/\s+/g, '_')}_${vendor.id_supplier}`]:
              vendor.kesimpulan || '-'
          }), {})
        }
      );
    }

    summaryData.push(
      {
        key: 'summary-11',
        spesifikasi: 'GRAND TOTAL',
        ...pengajuanData.tb_pengajuan_vendors.reduce((acc, vendor, index) => ({
          ...acc,
          [`${vendor.supplier_name.replace(/\s+/g, '_')}_${vendor.id_supplier}`]:
            `Rp. ${vendorCalculations[index].grandTotal.toLocaleString()}`
        }), {})
      },
      {
        key: 'summary-12',
        spesifikasi: '',
        ...pengajuanData.tb_pengajuan_vendors.reduce((acc, vendor) => ({
          ...acc,
          [`${vendor.supplier_name.replace(/\s+/g, '_')}_${vendor.id_supplier}`]:
            selectedSupplierId === vendor.id_supplier ? '✔' : ''
        }), {})
      }
    );

    return { mainData, summaryData };
  };

  const { mainData, summaryData } = generateTableData();

  const commentColumns = [
    { title: 'Tanggal', dataIndex: 'tanggal', key: 'tanggal', width: 100 },
    { title: 'Nama', dataIndex: 'nama', key: 'nama', width: 150 },
    { title: 'Komentar', dataIndex: 'komentar', key: 'komentar' },
  ];

  const purchaseOrderColumns = [
    { title: 'No', dataIndex: 'no', key: 'no', width: 50, render: (_, __, index) => index + 1 },
    {
      title: 'Transaction No',
      dataIndex: 'transaction_no',
      key: 'transaction_no',
      width: 150,
      render: (text, record) => (
        <a
          onClick={() => navigate(`/dashboard/purchase/order/detail/${record.id_purchase_order}`)}
          className="text-blue-500 hover:underline"
        >
          {text}
        </a>
      )
    },
    { title: 'Transaction Date', dataIndex: 'transaction_date', key: 'transaction_date', width: 120 },
    { title: 'Person Name', dataIndex: 'person_name', key: 'person_name', width: 200 },
    { title: 'Term Name', dataIndex: 'term_name', key: 'term_name', width: 100 },
    { title: 'Tags', dataIndex: 'tags', key: 'tags', width: 200 },
  ];

  const handlePrintOption = (title, type) => {
    if (!pengajuanData) return;

    const printWindow = window.open('', '_blank');
    const vendors = pengajuanData.tb_pengajuan_vendors || [];

    const allocation = pengajuanData.allocation?.toLowerCase() || '';
    let logoSrc, logoAlt, logoWidth, logoHeight;

    // Convert logo to base64 for print
    const convertImageToBase64 = (imgSrc) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
          // Fallback to default logo if image fails to load
          resolve('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        };
        img.src = imgSrc;
      });
    };

    // Set logo based on allocation
    let logoImage;
    if (allocation.includes('jajaid')) {
      logoImage = LogoJaja;
      logoAlt = 'JAJAID Logo';
      logoWidth = '120px';
      logoHeight = '70px';
    } else if (allocation.includes('auto')) {
      logoImage = JajaAuto;
      logoAlt = 'Jaja Auto Logo';
      logoWidth = '150px';
      logoHeight = '70px';
    } else {
      logoImage = LogoJaja;
      logoAlt = 'JAJAID Logo';
      logoWidth = '100px';
      logoHeight = '50px';
    }

    // Convert logo to base64 and then generate print content
    convertImageToBase64(logoImage).then((base64Logo) => {
      logoSrc = base64Logo;



      const vendorCalculations = vendors.map(vendor => {
        const subtotal = vendor.tb_pengajuan_pilihans.reduce((sum, item) =>
          sum + Number(item.total_excl_vat || 0), 0);
        const ppn = vendor.tb_pengajuan_pilihans.reduce((sum, item) =>
          sum + (Number(item.total_product || 0) - Number(item.total_excl_vat || 0)), 0);
        const grandTotal = subtotal + ppn;
        return { subtotal, ppn, grandTotal };
      });

      const isAutoBrand = allocation.includes('auto');

      const printContent = `
      <html>
        <head>
          <title>${title} - ${pengajuanData.kode_pengajuan || '-'}</title>
          <style>
            body { 
              font-family: 'Plus Jakarta Sans', sans-serif; 
              margin: 20px; 
              font-size: 12px;
              line-height: 1.4;
              color: #000;
              font-weight: 500;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start; 
              margin-bottom: 20px;
            }
            .logo-container {
              display: flex;
              align-items: center;
            }
            .company-info { 
              text-align: right; 
              font-size: 11px;
              color: #000;
              font-weight: 500;
            }
            .document-info {
              margin-bottom: 20px;
            }
            .document-info table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
            }
            .document-info td {
              padding: 2px 5px;
              font-size: 11px;
              vertical-align: top;
              font-weight: 500;
            }
            .document-info td:first-child {
              width: 120px;
              font-weight: bold;
            }
            .body-text {
              margin-bottom: 10px;
              text-align: justify;
              font-size: 10px;
              font-weight: 500;
            }
            .main-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              font-size: 9px;
              font-weight: 500;
            }
            .main-table th, .main-table td {
              border: 1px solid #000;
              padding: 2px 4px;
              text-align: center;
              vertical-align: middle;
              height: 20px;
              font-weight: 500;
            }
            .main-table th {
              background-color: #f0f0f0;
              font-weight: 700;
            }
            .main-table td:first-child {
              text-align: center;
              font-weight: 700;
            }
            .main-table td:nth-child(2) {
              text-align: left;
            }
            .main-table td:nth-child(3) {
              text-align: left;
            }
            .main-table td:nth-child(4) {
              text-align: left;
            }
            .main-table td:nth-child(5) {
              text-align: left;
            }
            .main-table td:nth-child(6) {
              text-align: center;
            }
            .main-table td:nth-child(7) {
              text-align: center;
            }
            .main-table td:nth-child(8) {
              text-align: center;
            }
            .main-table td:nth-child(9) {
              text-align: center;
            }
            .summary-section {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 20px;
              margin-top: 10px;
            }
            .summary-table {
              width: 180px;
              border-collapse: collapse;
              font-size: 9px;
              margin-left: auto;
              font-weight: 500;
            }
            .summary-table td {
              padding: 1px 4px;
              border: 1px solid #000;
              height: 18px;
              font-weight: 500;
            }
            .summary-table td:first-child {
              text-align: left;
              font-weight: 700;
              width: 120px;
            }
            .summary-table td:last-child {
              text-align: right;
              font-weight: bold;
              width: 80px;
            }
            .conclusion-text {
              margin-bottom: 15px;
              font-size: 10px;
              text-align: justify;
              font-weight: 500;
            }
            .signature-section {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-top: 20px;
            }
            .signature-box {
              text-align: center;
              border: none;
            }
            .signature-title {
              font-weight: 700;
              margin-bottom: 12px;
              font-size: 10px;
            }
            .signature-space {
              height: 40px;
              border-bottom: 1px solid #000;
              margin: 8px 0;
            }
            .signature-name {
              font-weight: 700;
              margin-top: 5px;
              font-size: 10px;
            }
            .signature-position {
              font-size: 9px;
              margin-top: 2px;
            }
            .signature-date {
              font-size: 8px;
              margin-top: 3px;
            }
            .additional-signatures {
              margin-top: 20px;
            }
            .additional-signatures .signature-section {
              grid-template-columns: repeat(3, 1fr);
            }
            @media print {
              @page {
                size: A4;
                margin: 15mm;
              }
              body {
                margin: 0;
                padding: 15mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-container">
              <img src="${logoSrc}" alt="${logoAlt}" style="width: ${logoWidth}; height: ${logoHeight}; margin-right: 15px;" />
            </div>
            <div class="company-info">
              JL. H. Baping Raya No.100<br>
              Ciracas Pasar Rebo, Jakarta 13740<br>
              Telp (021)87796010 Fx (021)87796903<br>
              jajaid.official@gmail.com
            </div>
          </div>

          <div class="document-info">
            <table>
              <tr>
                <td>Jakarta, ${new Date().getDate()} ${['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][new Date().getMonth()]} ${new Date().getFullYear()}</td>
              </tr>
              <tr>
                <td>No</td>
                <td>: ${pengajuanData.kode_pengajuan || '-'}</td>
              </tr>
              <tr>
                <td>Perihal</td>
                <td>: Permohonan Biaya Pengajuan Pembelian</td>
              </tr>
                             <tr>
                 <td colspan="2">Kepada Yth.</td>
               </tr>
               <tr>
                 <td colspan="2">${type === 'printpo_nobulat' ?
          `Bpk. Raja D.M Hutauruk,<br>Direktur PT. Jaja Usaha Laku,<br>Di Jakarta` :
          `Bpk. Raja D.M Hutauruk,<br>Direktur PT. Jaja Usaha Laku,<br>Di Jakarta`
        }</td>
               </tr>
            </table>
          </div>

          <div class="body-text">
            <p>Dengan hormat,</p>
            <p>Bersama ini kami mengajukan permohonan biaya sebesar <strong>Rp. ${vendorCalculations.reduce((sum, calc) => sum + calc.grandTotal, 0).toLocaleString()},- (${(() => {
          const total = vendorCalculations.reduce((sum, calc) => sum + calc.grandTotal, 0);
          const terbilang = convertToTerbilang(total);
          return terbilang;
        })()})</strong> untuk pengadaan ${(() => {
          // Mengumpulkan semua jenis barang yang unik
          const allProducts = [];
          vendors.forEach(vendor => {
            vendor.tb_pengajuan_pilihans.forEach(product => {
              const productName = getProductNameById(product.product_id);
              if (productName && !allProducts.includes(productName)) {
                allProducts.push(productName);
              }
            });
          });

          if (allProducts.length === 1) {
            return allProducts[0];
          } else if (allProducts.length === 2) {
            return `${allProducts[0]} dan ${allProducts[1]}`;
          } else if (allProducts.length > 2) {
            const lastProduct = allProducts.pop();
            return `${allProducts.join(', ')}, dan ${lastProduct}`;
          }
          return 'sparepart';
        })()} dengan maksud meneruskan permintaan dari PT. Jaja Usaha Laku dengan perincian sebagai berikut:</p>
          </div>

          <table class="main-table">
            <thead>
              <tr>
                <th rowspan="2">No.</th>
                <th rowspan="2">Vendor</th>
                <th rowspan="2">Referensi</th>
                <th rowspan="2">No. Kwitansi</th>
                <th rowspan="2">Jenis Barang</th>
                <th rowspan="2">Jenis Pembelian</th>
                <th rowspan="2">Jumlah (unit)</th>
                <th rowspan="2">Harga /Unit</th>
                <th rowspan="2">Jumlah Penjualan</th>
              </tr>
            </thead>
                         <tbody>
               ${(() => {
          let allRows = '';

          vendors.forEach((vendor, vendorIndex) => {
            vendor.tb_pengajuan_pilihans.forEach((product, productIndex) => {
              allRows += `
                        <tr>
                          <td>${productIndex === 0 ? vendorIndex + 1 : ''}</td>
                          <td>${vendor.supplier_name || '-'}</td>
                          <td>${pengajuanData.kode_pengajuan || '-'}</td>
                          <td>-</td>
                          <td>${getProductNameById(product.product_id) || '-'}</td>
                          <td>Kredit</td>
                          <td>${product.quantity || '-'}</td>
                          <td>Rp ${Number(product.price || 0).toLocaleString()}</td>
                          <td>Rp ${Number(product.total_excl_vat || 0).toLocaleString()}</td>
                        </tr>
                      `;
            });
          });

          return allRows || `
                   <tr>
                     <td>1</td>
                     <td>-</td>
                     <td>-</td>
                     <td>-</td>
                     <td>-</td>
                     <td>-</td>
                     <td>-</td>
                     <td>-</td>
                     <td>-</td>
                   </tr>
                 `;
        })()}
             </tbody>
          </table>

          <div class="summary-section">
            <div></div>
            <table class="summary-table">
              <tr>
                <td>Jumlah</td>
                <td>Rp ${vendorCalculations.reduce((sum, calc) => sum + calc.subtotal, 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td>PPN 11%</td>
                <td>Rp ${vendorCalculations.reduce((sum, calc) => sum + calc.ppn, 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Biaya Kirim</td>
                <td>Rp -</td>
              </tr>
              <tr>
                <td>Biaya Lain-lain</td>
                <td>Rp -</td>
              </tr>
              <tr style="border-top: 1px solid #000;">
                <td>Total Tagihan</td>
                <td>Rp ${vendorCalculations.reduce((sum, calc) => sum + calc.grandTotal, 0).toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <div class="conclusion-text">
            <p>Demikian permohonan ini kami sampaikan. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>
          </div>

          ${type !== 'printpo_nobulat' ? `
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-title">Diperiksa Oleh,</div>
                <div class="signature-space"></div>
                <div class="signature-name">Yazid</div>
                <div class="signature-position">Partnership</div>
                <div class="signature-date">${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear().toString().slice(-2)}</div>
              </div>
              <div class="signature-box">
                <div class="signature-title">Diperiksa Oleh,</div>
                <div class="signature-space"></div>
                <div class="signature-name">Eviyana</div>
                <div class="signature-position">Legalitas</div>
                <div class="signature-date">${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear().toString().slice(-2)}</div>
              </div>

              <div class="signature-box">
                <div class="signature-title">Disetujui Oleh,</div>
                <div class="signature-space"></div>
                <div class="signature-name">Anggi</div>
                <div class="signature-position">Accounting / Final Approver</div>
                <div class="signature-date">${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear().toString().slice(-2)}</div>
              </div>
            </div>
          ` : ''}

          ${type === 'printpo_nobulat' ? `
            <div class="additional-signatures">
              <div class="signature-section" style="grid-template-columns: repeat(3, 1fr);">
                <div class="signature-box">
                  <div class="signature-title">Diperiksa Oleh,</div>
                  <div class="signature-space"></div>
                  <div class="signature-name">Yazid</div>
                  <div class="signature-position">Partnership</div>
                </div>
                <div class="signature-box">
                  <div class="signature-title">Diperiksa Oleh,</div>
                  <div class="signature-space"></div>
                  <div class="signature-name">Eviyana</div>
                  <div class="signature-position">Legalitas</div>
                </div>

                <div class="signature-box">
                  <div class="signature-title">Disetujui Oleh,</div>
                  <div class="signature-space"></div>
                  <div class="signature-name">Anggi</div>
                  <div class="signature-position">Accounting / Final Approver</div>
                </div>
              </div>
              <div class="signature-section-bottom" style="display: flex; justify-content: center; margin-top: 20px;">
                <div class="signature-box" style="width: 33.33%; margin: 0 15px;">
                  <div class="signature-title">Diperiksa Oleh,</div>
                  <div class="signature-space"></div>
                  <div class="signature-name">Willianoes S</div>
                  <div class="signature-position">Bisnis Analis</div>
                </div>
                <div class="signature-box" style="width: 33.33%; margin: 0 15px;">
                  <div class="signature-title">Disetujui Oleh,</div>
                  <div class="signature-space"></div>
                  <div class="signature-name">Raja DM Hutauruk</div>
                  <div class="signature-position">Direktur Utama</div>
                </div>
              </div>
            </div>
          ` : ''}
        </body>
      </html>
    `;

      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = function () {
        printWindow.focus();
        printWindow.print();
      };
    });
  };

  const renderApprovalStamp = (approval) => {
    // Supervisor tidak menampilkan stamp, hanya info biasa
    if (approval.position === 'Supervisor') {
      return (
        <div className="text-center">
          <div>{approval.role}</div>
          <div className="font-bold">{approval.name}</div>
          <div className="text-xs">{approval.position}</div>
        </div>
      );
    }

    let stampStyle = '';
    if (approval.status === 'approved') {
      stampStyle = 'background-color: white; color: #15803d; border: 2px solid #15803d;';
    } else if (approval.status === 'pending') {
      stampStyle = 'background-color: white; color: #d97706; border: 2px solid #d97706;';
    } else if (approval.status === 'rejected') {
      stampStyle = 'background-color: white; color: #b91c1c; border: 2px solid #b91c1b;';
    } else {
      stampStyle = 'background-color: white; color: #d97706; border: 2px solid #d97706;';
    }

    let approvalDateTime = '-';
    if (approval.date) {
      approvalDateTime = new Date(approval.date).toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(',', '');
    } else {
      const approvalHistory = commentData.find(history =>
        history.nama.includes(approval.position) &&
        history.nama.includes(approval.name) &&
        (approval.position === 'Staff Partnership' ?
          (history.komentar.includes('dibuat') || history.komentar.includes('pending')) :
          history.komentar.includes(approval.status))
      );
      if (approvalHistory && approvalHistory.tanggal) {
        approvalDateTime = approvalHistory.tanggal.replace(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/, '$1/$2/$3, $4.$5.$6');
      }
    }

    return (
      <div className="text-center">
        <div>{approval.role}</div>
        <div className="my-2">
          <div
            className="font-bold inline-block transform -rotate-12 px-3 py-1"
            style={{
              backgroundColor: 'white',
              color: approval.status === 'approved' ? '#15803d' : approval.status === 'rejected' ? '#b91c1c' : '#d97706',
              border: `2px solid ${approval.status === 'approved' ? '#15803d' : approval.status === 'rejected' ? '#b91c1c' : '#d97706'}`
            }}
          >
            {approval.status.toUpperCase()}
          </div>
        </div>
        <div className="font-bold">{approval.name}</div>
        <div className="text-xs">{approval.position}</div>
        <div className="text-xs mt-1">({approvalDateTime})</div>
      </div>
    );
  };

  const printMenu = (
    <Menu>
      <Menu.Item key="1" onClick={() => handlePrintOption('Cetak Total Pembuatan', 'printpo_bulat')}>
        Cetak Pengajuan Kacab
      </Menu.Item>
      <Menu.Item key="2" onClick={() => handlePrintOption('Cetak Total Pembuatan No TTD', 'printpo_nobulat')}>
        Cetak Pengajuan Dirut
      </Menu.Item>
    </Menu>
  );

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <ConfigProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-1 sm:p-2">
        <div className="bg-white shadow-2xl rounded-2xl p-6 sm:p-8 mb-6 border border-gray-100">
          {/* Clean Header */}
          <div className="mb-8">
            <div className="border-b border-gray-200 pb-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* <div className="w-1 h-8 bg-blue-600 rounded-full"></div> */}
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                      Pengajuan Pembelian
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Manajemen pengajuan pembelian barang</p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  {/* <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    <CheckCircleOutlined className="text-2xl text-gray-600" />
                  </div> */}
                </div>
              </div>
            </div>

            {/* Modern Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <Dropdown overlay={printMenu} trigger={['click']}>
                <Button
                  type="primary"
                  ghost
                  icon={<PrinterOutlined />}
                  className="w-full sm:w-auto text-sm px-4 py-2 h-auto border-gray-300 hover:border-blue-400 hover:text-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Cetak
                </Button>
              </Dropdown>
              <Button
                onClick={() => editPengajuan(id_pengajuan)}
                type="primary"
                icon={<EditOutlined />}
                className="bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600 w-full sm:w-auto text-sm px-4 py-2 h-auto transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Edit
              </Button>
              {isAllApproved() && canCreatePO() && (
                <Button
                  type="primary"
                  className="bg-blue-500 border-blue-500 hover:bg-blue-600 hover:border-blue-600 w-full sm:w-auto text-sm px-4 py-2 h-auto transition-all duration-200 shadow-sm hover:shadow-md"
                  onClick={handleCreatePO}
                >
                  Buat PO
                </Button>
              )}
              <Button
                type="primary"
                danger
                className="w-full sm:w-auto text-sm px-4 py-2 h-auto transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Batal
              </Button>
            </div>
          </div>

          <Modal
            title="Buat Purchase Order"
            visible={isPOModalVisible}
            onOk={handlePOConfirm}
            onCancel={() => {
              setIsPOModalVisible(false);
              setSelectedVendorId(null);
              setSelectedVendorProducts([]);
            }}
            okText="Buat PO"
            cancelText="Batal"
            okButtonProps={{ className: 'bg-blue-500 border-blue-500' }}
            cancelButtonProps={{ className: 'bg-red-500 border-red-500 text-white' }}
            width={800}
          >
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Pilih Vendor</label>
              <Select
                placeholder="Pilih vendor"
                value={selectedVendorId}
                onChange={handleVendorSelect}
                className="w-full"
                size="middle"
              >
                {pengajuanData?.tb_pengajuan_vendors.map(vendor => (
                  <Option key={vendor.id_supplier} value={vendor.id_supplier}>
                    {vendor.supplier_name}
                  </Option>
                ))}
              </Select>
            </div>
            {selectedVendorId && (
              <div>
                <h3 className="text-sm font-medium mb-2">Produk dari Vendor</h3>
                <Table
                  columns={productColumns}
                  dataSource={selectedVendorProducts.map((product, index) => ({
                    ...product,
                    key: `${index}`,
                  }))}
                  pagination={false}
                  size="small"
                  scroll={{ x: 800 }}
                  bordered
                  components={{
                    header: {
                      cell: props => (
                        <th
                          {...props}
                          className="bg-gray-100 text-center font-semibold text-xs p-1"
                        />
                      ),
                    },
                    body: {
                      cell: props => (
                        <td
                          {...props}
                          className="text-xs p-1"
                        />
                      ),
                    },
                  }}
                />
              </div>
            )}
          </Modal>

          {/* Document Header */}
          <div className="text-center mb-8">
            <div className="inline-block px-8 py-4 rounded-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Pengajuan Pembelian
              </h2>
              <div className="text-sm text-gray-600 font-medium">Jaja Usaha Laku</div>
            </div>
          </div>

          {/* Document Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center space-x-3">
                <div>
                  <div className="text-xs text-gray-600 font-medium">Nomor Pengajuan</div>
                  <div className="text-sm font-bold text-gray-800">{pengajuanData?.kode_pengajuan || '-'}</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
              <div className="flex items-center space-x-3">
                <div>
                  <div className="text-xs text-gray-600 font-medium">Tanggal</div>
                  <div className="text-sm font-bold text-gray-800">{new Date(pengajuanData?.tgl_pengajuan).toLocaleDateString('id-ID') || '-'}</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-3">
                <div>
                  <div className="text-xs text-gray-600 font-medium">Alokasi</div>
                  <div className="text-sm font-bold text-gray-800">{pengajuanData?.allocation || '-'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Data Table */}
          <div className="mb-8">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">Detail Produk & Vendor</h3>
              </div>
              <div className="overflow-x-auto">
                <Table
                  columns={columns}
                  dataSource={mainData}
                  bordered={false}
                  pagination={false}
                  size="small"
                  scroll={{ x: 900 }}
                  components={{
                    header: {
                      cell: props => (
                        <th
                          {...props}
                          className="bg-gradient-to-r from-blue-50 to-indigo-50 text-center font-semibold text-xs p-3 border-b-2 border-blue-200"
                        />
                      )
                    },
                    body: {
                      cell: props => (
                        <td
                          {...props}
                          className="text-xs p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                        />
                      )
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Summary Table */}
          <div className="mb-8">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">Ringkasan & Total</h3>
              </div>
              <div className="overflow-x-auto">
                <Table
                  columns={columns}
                  dataSource={summaryData}
                  bordered={false}
                  pagination={false}
                  size="small"
                  showHeader={false}
                  scroll={{ x: 900 }}
                  components={{
                    body: {
                      cell: props => (
                        <td
                          {...props}
                          className="text-xs p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                        />
                      )
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Approval Section */}
          <div className="mb-8">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">Status Persetujuan</h3>
              </div>
              <div className="p-6">
                {canUserApprove() && (
                  <div className="flex justify-end mb-6">
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={handleApprove}
                      className="bg-green-600 border-green-600 hover:bg-green-700 hover:border-green-700 text-sm px-6 py-2 h-auto transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Approve
                    </Button>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {approvals.map((approval, index) => (
                    <div key={index} className="text-center">
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
                        <div className="font-medium mb-3 text-sm text-gray-600">
                          {index === 0 ? 'Diterima,' : index === 3 ? 'Disetujui,' : 'Diperiksa,'}
                        </div>
                        {renderApprovalStamp({
                          role: index === 0 ? 'Diajukan oleh,' : index === 3 ? 'Disetujui oleh,' : 'Diperiksa oleh,',
                          ...approval
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Modern Tabs Section */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              size="small"
              className="modern-tabs"
              tabBarStyle={{
                background: 'linear-gradient(to right, #f8fafc, #f1f5f9)',
                margin: 0,
                padding: '0 24px',
                borderBottom: '1px solid #e2e8f0'
              }}
            >
              <TabPane
                tab={
                  <span className="flex items-center space-x-2 px-3 py-2">
                    <span className="text-lg">💬</span>
                    <span className="font-medium">Komentar</span>
                  </span>
                }
                key="1"
              >
                <div className="p-6">
                  <div className="mb-6">
                    <div className="rounded-xl p-4 border border-blue-200">
                      <TextArea
                        placeholder="Tuliskan komentar anda disini..."
                        className="w-full text-sm border-0 bg-transparent resize-none focus:ring-0 focus:outline-none"
                        rows={3}
                      />
                      <div className="flex justify-end mt-3">
                        <Button
                          type="primary"
                          icon={<SendOutlined />}
                          className="bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600 text-sm px-6 py-2 h-auto transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          SUBMIT KOMENTAR
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700">Approval History</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <Table
                          columns={commentColumns}
                          dataSource={commentData}
                          bordered={false}
                          pagination={false}
                          size="small"
                          scroll={{ x: 600 }}
                          components={{
                            header: {
                              cell: props => (
                                <th
                                  {...props}
                                  className="bg-gradient-to-r from-blue-50 to-indigo-50 text-center font-semibold text-xs p-3 border-b-2 border-blue-200"
                                />
                              ),
                            },
                            body: {
                              cell: props => (
                                <td
                                  {...props}
                                  className="text-xs p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                                />
                              ),
                            },
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700">Purchase Orders</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <Table
                          columns={purchaseOrderColumns}
                          dataSource={pengajuanData?.purchase_orders || []}
                          bordered={false}
                          pagination={false}
                          size="small"
                          scroll={{ x: 600 }}
                          components={{
                            header: {
                              cell: props => (
                                <th
                                  {...props}
                                  className="bg-gradient-to-r from-green-50 to-emerald-50 text-center font-semibold text-xs p-3 border-b-2 border-green-200"
                                />
                              ),
                            },
                            body: {
                              cell: props => (
                                <td
                                  {...props}
                                  className="text-xs p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                                />
                              ),
                            },
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabPane>
              <TabPane
                tab={
                  <span className="flex items-center space-x-2 px-3 py-2">
                    <span className="text-lg">📎</span>
                    <span className="font-medium">Lampiran</span>
                  </span>
                }
                key="2"
              >
                <div className="p-6">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📎</span>
                    </div>
                    <p className="text-gray-500 text-sm">Lampiran dokumen akan ditampilkan di sini</p>
                  </div>
                </div>
              </TabPane>
              <TabPane
                tab={
                  <span className="flex items-center space-x-2 px-3 py-2">
                    <span className="text-lg">📋</span>
                    <span className="font-medium">Lampiran DPP</span>
                  </span>
                }
                key="3"
              >
                <div className="p-6">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📋</span>
                    </div>
                    <p className="text-gray-500 text-sm">Lampiran dokumen DPP akan ditampilkan di sini</p>
                  </div>
                </div>
              </TabPane>
            </Tabs>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default PengajuanPembelian;