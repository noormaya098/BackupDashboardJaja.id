import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Input, DatePicker, Select, Form, Card, Table, notification, Modal, Tabs, Checkbox } from 'antd';
import { SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import moment from 'moment';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import 'dayjs/locale/id'; // Optional: for Indonesian locale
import { baseUrl } from '@/configs';
dayjs.locale('id');

const { Option } = Select;
const { TextArea } = Input;

const TambahPengajuan = () => {
  const [form] = Form.useForm();
  const { id_data } = useParams();
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const navigate = useNavigate();
  const [vendorList, setVendorList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [vendors, setVendors] = useState([
    {
      id_supplier: '',
      supplier_name: '',
      payment_terms: 'Net 30',
      delivery_terms: 'FOB',
      is_pkp: false,
      tax_percentage: '11%',
      vat: '11%',
      vat_type: 'Exempt',
      withholding_tax: '0%',
      miscellaneous: '',
      description: '',
      alasan: '',
      catatan: '',
      kesimpulan: '',
      pilihanData: [],
    },
  ]);

  // Watch the allocation field
  const allocation = Form.useWatch('allocation', form);

  // Fetch Order Details dari API
  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      try {
        const requestOptions = {
          method: 'GET',
          redirect: 'follow',
        };
        const response = await fetch(
          `${baseUrl}/nimda/transaksi/detail-transaksi/${id_data}`,
          requestOptions
        );
        const result = await response.json();
        console.log('API Response:', result);

        if (result.code === 200) {
          const localOrder = JSON.parse(localStorage.getItem(`order_${id_data}`)) || {};
          const rawData = { ...result.data, ...localOrder };

          const normalizedData = {
            order_id: rawData.order_id || `ORDER-${rawData.id_data || 'Tidak Tersedia'}`,
            created_date: rawData.created_date || 'Tidak Tersedia',
            created_time: rawData.created_time || '',
            nama_customer: rawData.nama_customer || 'Tidak Tersedia',
            alamat_pengiriman: rawData.alamat_pengiriman || 'Alamat Tidak Tersedia',
            nama_penerima: rawData.nama_penerima || rawData.nama_customer || 'Tidak Tersedia',
            telp_penerima: rawData.telp_penerima || 'Tidak Tersedia',
            brand: rawData.brand || rawData.tb_company?.company_name || 'Jaja',
            subtotal:
              rawData.subtotal ||
              (rawData.tb_transaksi_directs?.reduce((sum, item) => sum + Number(item.amount || 0), 0)) ||
              (rawData.transaksi_details?.reduce((sum, item) => sum + Number(item.sub_total || 0), 0)) ||
              0,
            biaya_ongkir: rawData.biaya_ongkir || rawData.transaksi_details?.[0]?.ongkir || 0,
            total_tagihan:
              rawData.total_tagihan ||
              ((rawData.subtotal ||
                rawData.tb_transaksi_directs?.reduce((sum, item) => sum + Number(item.amount || 0), 0) ||
                rawData.transaksi_details?.reduce((sum, item) => sum + Number(item.sub_total || 0), 0) ||
                0) +
                (rawData.biaya_ongkir || 0) -
                (rawData.diskon_voucher || 0) -
                (rawData.diskon_voucher_toko || 0)),
            diskon_voucher: rawData.diskon_voucher || 0,
            diskon_voucher_toko: rawData.diskon_voucher_toko || 0,
            pesan_customer: rawData.pesan_customer || rawData.transaksi_details?.[0]?.pesan_customer_toko || '[Tidak Ada Pesan dari Pembeli]',
            pesan_package: rawData.pesan_package || rawData.transaksi_details?.[0]?.catatan_package_toko || '[Tidak Ada Pesan dari Pembeli]',
            pengiriman: rawData.pengiriman || rawData.transaksi_details?.[0]?.expedisi || 'Tidak Tersedia',
            platform: rawData.platform || (rawData.tb_transaksi_directs?.length > 0 ? 'Direct' : 'Else'),
            tb_transaksi_directs: rawData.tb_transaksi_directs || [],
            transaksi_details: rawData.transaksi_details || [],
            tb_company: rawData.tb_company || {},
            tb_sale: rawData.tb_sale || {},
            id_data: rawData.id_data,
            status_transaksi: rawData.status_transaksi,
            id_company: rawData.id_company,
            id_sales: rawData.id_sales,
            tb_invoice: rawData.tb_invoice || null,
            id_toko: rawData.id_toko || 103,
          };

          setOrderDetails(normalizedData);

          form.setFieldsValue({
            tgl_pengajuan: dayjs(), // Set to today's date
            allocation: normalizedData.brand || 'JAJAID',
            id_company: normalizedData.tb_company?.company_name || 'Tidak Tersedia',
            pembayaran: 'Cash',
            description: `Pengajuan untuk Order ${normalizedData.order_id}`,
          });

          // Ambil semua produk tanpa filter status_pengajuan agar bisa diajukan berkali-kali
          const productData = normalizedData.platform === 'Direct'
            ? (normalizedData.tb_transaksi_directs || [])
              .map((item, index) => ({
                key: `${index + 1}`,
                product_id: item.product_id,
                product_name: item.product_name || item.product_description || 'Nama Produk Tidak Tersedia',
                sell_price: item.tb_product?.sell_price || item.sell_price || 0,
                specification: '',
                price: 0,
                quantity: item.quantity || 0,
                discount: item.discount || 0,
                ppn: 0,
                total_product: 0,
                payment_terms: 'Net 30',
                delivery_terms: 'FOB',
                taxable: false,
                tax_percentage: '11%',
              }))
            : (normalizedData.transaksi_details || [])
              .map((item, index) => ({
                key: `${index + 1}`,
                product_id: item.id_produk,
                product_name: item.nama_produk || item.deskripsi || 'Nama Produk Tidak Tersedia',
                sell_price: item.tb_product?.sell_price || item.sell_price || 0,
                specification: '',
                price: 0,
                quantity: item.qty || 0,
                discount: 0,
                ppn: 0,
                total_product: 0,
                payment_terms: 'Net 30',
                delivery_terms: 'FOB',
                taxable: false,
                tax_percentage: '11%',
              }));

          // Jika productData kosong sama sekali
          if (productData.length === 0) {
            notification.info({
              message: 'Informasi',
              description: 'Tidak ada produk dalam pesanan ini.',
            });
          }

          setVendors(prevVendors =>
            prevVendors.map(vendor => ({
              ...vendor,
              pilihanData: productData.length > 0 ? JSON.parse(JSON.stringify(productData)) : [],
            }))
          );
        } else {
          notification.error({
            message: 'Error',
            description: 'Failed to fetch order details',
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        notification.error({
          message: 'Error',
          description: 'Failed to connect to server',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id_data, form]);

  useEffect(() => {
    const fetchVendorByIdToko = async () => {
      if (!orderDetails || !orderDetails.id_toko) return;

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${baseUrl}/nimda/vendor/get-vendor?page=1&limit=1000&keyword=&id_toko=${orderDetails.id_toko}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `${token}`,
            },
          }
        );
        const result = await response.json();

        if (result.code === 200) {
          setVendorList(result.data);
          console.log('Vendor fetched for id_toko:', result.data);

          if (result.data.length > 0) {
            const defaultVendor = result.data[0];
            setVendors(prevVendors => [
              {
                ...prevVendors[0],
                id_supplier: defaultVendor.id_vendor,
                supplier_name: defaultVendor.display_name,
              },
              ...prevVendors.slice(1),
            ]);
          }
        } else {
          notification.error({
            message: 'Error',
            description: `Gagal mengambil data vendor untuk id_toko ${orderDetails.id_toko}`,
          });
        }
      } catch (error) {
        console.error('Error fetching vendors:', error);
        notification.error({
          message: 'Error',
          description: 'Gagal terhubung ke server vendor',
        });
      }
    };

    fetchVendorByIdToko();
  }, [orderDetails]);

  useEffect(() => {
    const fetchAllVendors = async () => {
      let allVendors = [];
      let currentPage = 1;
      let totalPages = 1;

      try {
        while (currentPage <= totalPages) {
          const token = localStorage.getItem('token');
          const response = await fetch(
            `${baseUrl}/nimda/vendor/get-vendor?page=1&limit=1000&keyword=`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `${token}`,
              },
            }
          );
          const result = await response.json();

          if (result.code === 200) {
            allVendors = [...allVendors, ...result.data];
            totalPages = result.totalPages;
            currentPage++;
          } else {
            notification.error({
              message: 'Error',
              description: `Gagal mengambil data vendor di halaman ${currentPage}`,
            });
            break;
          }
        }
        setVendorList(allVendors);
        console.log('Total vendor yang diambil:', allVendors.length);
      } catch (error) {
        console.error('Error fetching all vendors:', error);
        notification.error({
          message: 'Error',
          description: 'Gagal terhubung ke server vendor',
        });
      }
    };

    fetchAllVendors();
  }, []);

  const onFinish = async (values) => {
    setIsSubmitDisabled(true);

    Modal.confirm({
      title: 'Konfirmasi',
      content: 'Apakah Anda yakin ingin menyimpan pengajuan ini?',
      okText: 'OK',
      cancelText: 'Cancel',
      okButtonProps: { style: { backgroundColor: '#52c41a', borderColor: '#52c41a' } },
      cancelButtonProps: { style: { backgroundColor: '#ff4d4f', borderColor: '#ff4d4f', color: 'white' } },
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          const decodedToken = JSON.parse(atob(token.split('.')[1]));
          const userId = decodedToken.id_user;

          const vendorData = vendors.map(vendor => {
            const pilihanData = vendor.pilihanData.map(item => ({
              product_id: item.product_id,
              specification: item.specification,
              price: item.price,
              quantity: item.quantity,
              total_excl_vat: (item.price * item.quantity * (1 - item.discount / 100)).toString(),
              payment_terms: item.payment_terms,
              delivery_terms: item.delivery_terms,
              discount: item.discount,
              taxable: item.taxable,
              ppn: item.ppn,
              total_product: (item.price * item.quantity * (1 - item.discount / 100) * (1 + item.ppn / 100)).toString(),
            }));

            const totalVendor = pilihanData.reduce((sum, item) => sum + parseFloat(item.total_product), 0).toString();

            return {
              id_supplier: vendor.id_supplier,
              supplier_name: vendor.supplier_name,
              payment_terms: vendor.payment_terms,
              delivery_terms: vendor.delivery_terms,
              is_pkp: vendor.is_pkp,
              tax_percentage: vendor.tax_percentage,
              vat: vendor.vat,
              vat_type: vendor.vat_type,
              withholding_tax: vendor.withholding_tax,
              miscellaneous: vendor.miscellaneous,
              description: vendor.description,
              alasan: vendor.alasan,
              catatan: vendor.catatan,
              kesimpulan: vendor.kesimpulan,
              total_vendor: totalVendor,
              pilihanData: pilihanData,
            };
          });

          const payload = {
            pengajuanData: {
              tgl_pengajuan: values.tgl_pengajuan.format('YYYY-MM-DD'),
              allocation: values.allocation,
              posted: 0,
              canceled: 0,
              cancel_note: '',
              id_company: orderDetails.id_company,
              discount_type: 'percent',
              pembayaran: values.pembayaran,
              description: values.description,
              id_user: userId,
              id_data: id_data,
            },
            vendorData: vendorData,
          };

          const response = await fetch(`${baseUrl}/nimda/pengajuan`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `${token}`,
            },
            body: JSON.stringify(payload),
          });

          const result = await response.json();
          if (response.ok) {
            notification.success({
              message: 'Pengajuan Berhasil',
              description: 'Data pengajuan berhasil disimpan.',
            });
            form.resetFields();

            const idPengajuan = result.data.pengajuan.id_pengajuan;
            if (idPengajuan) {
              navigate(`/dashboard/pengajuan/detail/${idPengajuan}`);
            } else {
              console.error('id_pengajuan tidak ditemukan dalam response');
              navigate(`/dashboard/pengajuan/detail/${idPengajuan}`);
            }
          } else {
            notification.error({
              message: 'Pengajuan Gagal',
              description: result.message || 'Terjadi kesalahan saat menyimpan pengajuan.',
            });
            setIsSubmitDisabled(false);
          }
        } catch (error) {
          console.error('Error:', error);
          notification.error({
            message: 'Pengajuan Gagal',
            description: 'Terjadi kesalahan saat menyimpan pengajuan.',
          });
          setIsSubmitDisabled(false);
        }
      },
      onCancel: () => {
        console.log('Pengajuan dibatalkan');
        setIsSubmitDisabled(false);
      },
    });
  };

  const handleVendorChange = (index, field, value) => {
    const newVendors = [...vendors];
    newVendors[index][field] = value;

    if (field === 'is_pkp') {
      newVendors[index].pilihanData = newVendors[index].pilihanData.map(product => ({
        ...product,
        taxable: value,
        ppn: value ? parseFloat(newVendors[index].tax_percentage.replace('%', '')) : 0,
        total_product: product.price * product.quantity * (1 - product.discount / 100) * (value ? (1 + parseFloat(newVendors[index].tax_percentage.replace('%', '')) / 100) : 1),
      }));
      if (value) {
        notification.info({
          message: 'Informasi',
          description: `Semua produk untuk vendor ini telah diatur menjadi kena pajak (PPN ${newVendors[index].tax_percentage}).`,
        });
      }
    }
    if (field === 'tax_percentage') {
      newVendors[index].pilihanData = newVendors[index].pilihanData.map(product => ({
        ...product,
        ppn: newVendors[index].is_pkp ? parseFloat(value.replace('%', '')) : 0,
        total_product: product.price * product.quantity * (1 - product.discount / 100) * (newVendors[index].is_pkp ? (1 + parseFloat(value.replace('%', '')) / 100) : 1),
      }));
    }

    setVendors(newVendors);
  };

  const handleVendorSelect = (vendorIndex, value) => {
    const selectedVendor = vendorList.find(v => v.id_vendor === value);
    const newVendors = [...vendors];
    newVendors[vendorIndex].id_supplier = selectedVendor ? selectedVendor.id_vendor : '';
    newVendors[vendorIndex].supplier_name = selectedVendor ? selectedVendor.display_name : '';
    setVendors(newVendors);
  };

  const generateRandomCode = (prefix) => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}${randomNum}`;
  };

  const handleProductChange = (vendorIndex, productIndex, field, value) => {
    const newVendors = [...vendors];
    const product = newVendors[vendorIndex].pilihanData[productIndex];

    if (field === 'specification' || field === 'payment_terms' || field === 'delivery_terms') {
      product[field] = value;
    } else if (field === 'taxable') {
      product[field] = value;
      product.ppn = value ? parseFloat((product.tax_percentage || '11%').replace('%', '')) : 0;
      const allTaxable = newVendors[vendorIndex].pilihanData.every(p => p.taxable);
      newVendors[vendorIndex].is_pkp = allTaxable;
    } else if (field === 'tax_percentage') {
      product[field] = value;
      product.ppn = product.taxable ? parseFloat(value.replace('%', '')) : 0;
    } else {
      product[field] = parseFloat(value) || 0;
    }

    // Hitung ulang total_product
    product.total_product =
      (product.price || 0) *
      (product.quantity || 0) *
      (1 - (product.discount || 0) / 100) *
      (1 + (product.ppn || 0) / 100);

    setVendors(newVendors);
  };

  const handleAddProduct = (vendorIndex) => {
    setVendors(prevVendors => {
      const newVendors = [...prevVendors];
      const newProduct = {
        key: `${newVendors[vendorIndex].pilihanData.length + 1}`,
        product_id: newVendors[vendorIndex].pilihanData.length + 1,
        product_name: 'Produk Baru',
        sell_price: 0,
        specification: '',
        price: 0,
        quantity: 0,
        discount: 0,
        ppn: newVendors[vendorIndex].is_pkp ? parseFloat(newVendors[vendorIndex].tax_percentage.replace('%', '')) : 0,
        total_product: 0,
        payment_terms: 'Net 30',
        delivery_terms: 'FOB',
        taxable: newVendors[vendorIndex].is_pkp,
        tax_percentage: '11%',
      };
      newVendors[vendorIndex].pilihanData = [...newVendors[vendorIndex].pilihanData, newProduct];
      return newVendors;
    });
  };

  const handleDeleteProduct = (vendorIndex, productIndex) => {
    const newVendors = [...vendors];
    newVendors[vendorIndex].pilihanData = newVendors[vendorIndex].pilihanData.filter(
      (_, i) => i !== productIndex
    );
    setVendors(newVendors);
  };

  const handleAddVendor = () => {
    const productData = orderDetails && orderDetails.tb_transaksi_directs && orderDetails.tb_transaksi_directs.length > 0
      ? orderDetails.tb_transaksi_directs.map((item, index) => ({
        key: `${index + 1}`,
        product_id: item.product_id,
        product_name: item.product_name || item.product_description || 'Nama Produk Tidak Tersedia',
        sell_price: item.tb_product?.sell_price || item.sell_price || 0,
        specification: '',
        price: 0,
        quantity: item.quantity || 0,
        discount: item.discount || 0,
        ppn: 0,
        total_product: 0,
        payment_terms: 'Net 30',
        delivery_terms: 'FOB',
        taxable: false,
        tax_percentage: '11%',
      }))
      : orderDetails && orderDetails.transaksi_details && orderDetails.transaksi_details.length > 0
        ? orderDetails.transaksi_details.map((item, index) => ({
          key: `${index + 1}`,
          product_id: item.id_produk,
          product_name: item.nama_produk || item.deskripsi || 'Nama Produk Tidak Tersedia',
          sell_price: item.tb_product?.sell_price || item.sell_price || 0,
          specification: '',
          price: 0,
          quantity: item.qty || 0,
          discount: 0,
          ppn: 0,
          total_product: 0,
          payment_terms: 'Net 30',
          delivery_terms: 'FOB',
          taxable: false,
          tax_percentage: '11%',
        }))
        : [];

    const defaultVendor = vendorList.length > 0 ? vendorList[0] : { id_vendor: '', display_name: '' };

    setVendors(prevVendors => [
      ...prevVendors,
      {
        id_supplier: defaultVendor.id_vendor,
        supplier_name: defaultVendor.display_name,
        payment_terms: 'Net 30',
        delivery_terms: 'FOB',
        is_pkp: false,
        tax_percentage: '11%',
        vat: '11%',
        vat_type: 'Exempt',
        withholding_tax: '0%',
        miscellaneous: '',
        description: '',
        alasan: '',
        catatan: '',
        kesimpulan: '',
        pilihanData: JSON.parse(JSON.stringify(productData)),
      },
    ]);
  };

  const handleDeleteVendor = (vendorIndex) => {
    if (vendors.length <= 1) {
      notification.warning({
        message: 'Tidak Dapat Menghapus',
        description: 'Minimal harus ada satu vendor.',
      });
      return;
    }

    const newVendors = vendors.filter((_, index) => index !== vendorIndex);
    setVendors(newVendors);
  };

  const handleVendorSearch = async (keyword, vendorIndex) => {
    try {
      const response = await fetch(
        `${baseUrl}/nimda/vendor/get-vendor?page=1&limit=10&keyword=${keyword}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      const result = await response.json();
      if (result.code === 200) {
        setVendorList(result.data);
      }
    } catch (error) {
      console.error('Error searching vendors:', error);
    }
  };

  useEffect(() => {
    setVendorList([]);
  }, []);

  const columns = [
    {
      title: 'Nama Produk',
      dataIndex: 'product_name',
      render: (text) => <span>{text}</span>,
    },
    {
      title: 'Harga Jual',
      dataIndex: 'sell_price',
      width: 120,
      render: (sell_price) => (
        <span className="text-green-600 font-medium">
          {sell_price ? `Rp. ${Number(sell_price).toLocaleString()}` : '-'}
        </span>
      ),
    },
    {
      title: 'Spesifikasi',
      dataIndex: 'specification',
      render: (_, record, index, vendorIndex) => (
        <Input
          value={record.specification}
          onChange={(e) => handleProductChange(vendorIndex, index, 'specification', e.target.value)}
          className="w-full"
          style={{ width: '200px', fontSize: '12px', padding: '2px 8px' }}
        />
      ),
    },
    {
      title: 'Harga Beli',
      dataIndex: 'price',
      render: (_, record, index, vendorIndex) => (
        <Input
          type="number"
          value={record.price}
          onChange={(e) => {
            const value = e.target.value;
            handleProductChange(vendorIndex, index, 'price', value);
          }}
          style={{ width: '100px', fontSize: '12px', padding: '2px 8px' }}
          className="w-full sm:w-[70px]"
          min={0}
        />
      ),
    },
    {
      title: 'Jumlah',
      dataIndex: 'quantity',
      render: (_, record, index, vendorIndex) => (
        <Input
          type="text"
          value={record.quantity}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9]/g, '');
            handleProductChange(vendorIndex, index, 'quantity', value);
          }}
          style={{ width: '50px', fontSize: '12px', padding: '2px 8px' }}
          className="w-full sm:w-[50px]"
        />
      ),
    },
    {
      title: 'Diskon(%)',
      dataIndex: 'discount',
      render: (_, record, index, vendorIndex) => (
        <Input
          type="text"
          value={record.discount}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9.]/g, '');
            handleProductChange(vendorIndex, index, 'discount', value);
          }}
          style={{ width: '60px', fontSize: '12px', padding: '2px 8px' }}
          className="w-full sm:w-[60px]"
        />
      ),
    },
    {
      title: 'Kena Pajak',
      dataIndex: 'taxable',
      render: (_, record, index, vendorIndex) => (
        <div className="space-y-2">
          <div className="flex items-center space-x-1">
            <Checkbox
              checked={record.taxable}
              onChange={(e) => handleProductChange(vendorIndex, index, 'taxable', e.target.checked)}
              size="small"
            >
              PKP
            </Checkbox>
            <Checkbox
              checked={!record.taxable}
              onChange={(e) => handleProductChange(vendorIndex, index, 'taxable', !e.target.checked)}
              size="small"
            >
              Non-PKP
            </Checkbox>
          </div>
          {record.taxable && (
            <Input
              value={record.tax_percentage || '11%'}
              onChange={(e) => handleProductChange(vendorIndex, index, 'tax_percentage', e.target.value)}
              placeholder="Contoh: 11% atau 1.1%"
              size="small"
              style={{ width: '100px', fontSize: '10px', padding: '2px 4px' }}
              className="w-full"
            />
          )}
        </div>
      ),
    },
    {
      title: 'Total Produk',
      dataIndex: 'total_product',
      render: (_, record) => (
        <span>{(record.total_product || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span>
      ),
    },
    {
      title: 'Aksi',
      render: (_, record, index, vendorIndex) => (
        <Button type="link" onClick={() => handleDeleteProduct(vendorIndex, index)} style={{ padding: '0 8px' }}>
          Hapus
        </Button>
      ),
    },
  ];

  const calculateVendorTotals = (vendor) => {
    const subtotal = vendor.pilihanData.reduce((sum, product) =>
      sum + (product.price * product.quantity * (1 - product.discount / 100)), 0);
    const ppn = vendor.pilihanData.reduce((sum, product) =>
      sum + (product.price * product.quantity * (1 - product.discount / 100) * (product.ppn / 100)), 0);
    const grandTotal = subtotal + ppn;

    return { subtotal, ppn, grandTotal };
  };

  return (
    <div className="px-2 sm:px-0">
      <div className="bg-white p-3 rounded-lg shadow-sm max-w-full sm:max-w-8xl mx-auto">
        <h1 className="text-xl font-semibold text-gray-800 mb-2">
          Tambah Pengajuan Baru {orderDetails ? `untuk Order ${orderDetails.order_id}` : ''}
        </h1>

        {loading ? (
          <p>Loading data...</p>
        ) : (
          <Form form={form} layout="vertical" onFinish={onFinish} className="space-y-2">
            {/* pengajuanData */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-2">
              <Form.Item
                label="Tanggal Pengajuan"
                name="tgl_pengajuan"
                rules={[{ required: true, message: 'Pilih tanggal pengajuan!' }]}
              >
                <DatePicker
                  className="w-full"
                  format="DD/MM/YYYY"
                  placeholder="Pilih tanggal"
                  size="small"
                  style={{ width: '100%', fontSize: '12px', padding: '2px 8px' }}
                />
              </Form.Item>
              <Form.Item
                label="Alokasi"
                name="allocation"
                rules={[{ required: true, message: 'Pilih alokasi!' }]}
              >
                <Select
                  placeholder="Pilih alokasi"
                  size="small"
                  className="w-full"
                >
                  <Option value="JAJAID">JAJAID</Option>
                  <Option value="AUTO">AUTO</Option>
                </Select>
              </Form.Item>
              <Form.Item
                label="ID Perusahaan"
                name="id_company"
                rules={[{ required: true, message: 'ID perusahaan harus diisi!' }]}
              >
                <Input
                  readOnly
                  size="small"
                  style={{ width: '100%', fontSize: '12px', padding: '2px 8px', backgroundColor: '#f5f5f5' }}
                />
              </Form.Item>
              <Form.Item
                label="Pembayaran"
                name="pembayaran"
                rules={[{ required: true, message: 'Pilih pembayaran!' }]}
              >
                <Select
                  placeholder="Pilih pembayaran"
                  size="small"
                  className="w-full"
                >
                  <Option value="Cash">Cash</Option>
                  <Option value="Kredit">Kredit</Option>
                </Select>
              </Form.Item>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Form.Item label="Deskripsi" name="description">
                <Input.TextArea placeholder="Masukkan deskripsi pengajuan" rows={3} size="middle" className="w-full" />
              </Form.Item>
            </div>

            {/* vendorData */}
            {vendors.map((vendor, vendorIndex) => {
              const { subtotal, ppn, grandTotal } = calculateVendorTotals(vendor);
              return (
                <Card
                  title={`Vendor ${vendorIndex + 1}`}
                  key={vendorIndex}
                  className="mb-4"
                  size="small"
                  bodyStyle={{ padding: '16px' }}
                  extra={
                    <Button
                      type="link"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteVendor(vendorIndex)}
                      danger
                      size="small"
                    >
                      Hapus Vendor
                    </Button>
                  }
                >
                  <Tabs
                    defaultActiveKey="1"
                    size="small"
                    items={[
                      {
                        key: '1',
                        label: (
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Supplier
                          </span>
                        ),
                        children: (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="max-w-md mx-auto">
                              <Form.Item
                                label={<span className="font-medium text-gray-700">Pilih Supplier</span>}
                                className="mb-4"
                              >
                                <Select
                                  showSearch
                                  placeholder="Cari dan pilih supplier..."
                                  optionFilterProp="children"
                                  onChange={(value) => handleVendorSelect(vendorIndex, value)}
                                  onSearch={(value) => handleVendorSearch(value, vendorIndex)}
                                  value={vendor.id_supplier || undefined}
                                  size="large"
                                  className="w-full"
                                  filterOption={false}
                                  style={{
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                  }}
                                >
                                  {vendorList.map(v => (
                                    <Option key={v.id_vendor} value={v.id_vendor}>
                                      <div className="flex items-center justify-between">
                                        <span>{v.display_name}</span>
                                        <span className="text-xs text-gray-500">ID: {v.id_vendor}</span>
                                      </div>
                                    </Option>
                                  ))}
                                </Select>
                              </Form.Item>

                              {vendor.supplier_name && (
                                <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                      <span className="text-blue-600 font-semibold text-sm">
                                        {vendor.supplier_name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-800">{vendor.supplier_name}</p>
                                      <p className="text-sm text-gray-500">Supplier terpilih</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ),
                      },
                      {
                        key: '2',
                        label: (
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Detail Vendor
                          </span>
                        ),
                        children: (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              <Form.Item label="TOP Pembayaran" className="mb-2">
                                <Select
                                  value={vendor.payment_terms}
                                  onChange={(value) => handleVendorChange(vendorIndex, 'payment_terms', value)}
                                  size="small"
                                  className="w-full"
                                >
                                  <Option value="Net 15">Net 15</Option>
                                  <Option value="Net 30">Net 30</Option>
                                  <Option value="Net 60">Net 60</Option>
                                  <Option value="Cash on Delivery">COD</Option>
                                </Select>
                              </Form.Item>
                              <Form.Item label="Syarat Pengiriman" className="mb-2">
                                <Select
                                  value={vendor.delivery_terms}
                                  onChange={(value) => handleVendorChange(vendorIndex, 'delivery_terms', value)}
                                  size="small"
                                  className="w-full"
                                >
                                  <Option value="FOB">FOB: Penjual kirim sampai titik penyerahan</Option>
                                  <Option value="CIF">CIF: Penjual tanggung ongkir & asuransi</Option>
                                  <Option value="EXW">EXW: Pembeli ambil sendiri dari tempat penjual</Option>
                                </Select>
                              </Form.Item>
                              <Form.Item label="Status PKP" className="mb-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={vendor.is_pkp}
                                    onChange={(e) => handleVendorChange(vendorIndex, 'is_pkp', e.target.checked)}
                                  >
                                    PKP
                                  </Checkbox>
                                  <Checkbox
                                    checked={!vendor.is_pkp}
                                    onChange={(e) => handleVendorChange(vendorIndex, 'is_pkp', !e.target.checked)}
                                  >
                                    Non-PKP
                                  </Checkbox>
                                </div>
                              </Form.Item>
                              {vendor.is_pkp && (
                                <Form.Item label="Persentase Pajak" className="mb-2">
                                  <Input
                                    value={vendor.tax_percentage}
                                    onChange={(e) => handleVendorChange(vendorIndex, 'tax_percentage', e.target.value)}
                                    placeholder="Contoh: 11% atau 1.1%"
                                    size="small"
                                    className="w-full"
                                  />
                                </Form.Item>
                              )}
                              <Form.Item label="Tipe PPN" className="mb-2">
                                <Select
                                  value={vendor.vat_type}
                                  onChange={(value) => handleVendorChange(vendorIndex, 'vat_type', value)}
                                  size="small"
                                  className="w-full"
                                >
                                  <Option value="Include">Include</Option>
                                  <Option value="Exclude">Exclude</Option>
                                  <Option value="Exempt">Exempt</Option>
                                </Select>
                              </Form.Item>
                              <Form.Item label="Pajak Pemotongan" className="mb-2">
                                <Input
                                  value={vendor.withholding_tax}
                                  onChange={(e) => handleVendorChange(vendorIndex, 'withholding_tax', e.target.value)}
                                  placeholder="Contoh: 2%"
                                  size="small"
                                  className="w-full"
                                />
                              </Form.Item>
                              <Form.Item label="Biaya Lain-lain" className="mb-2">
                                <Input
                                  value={vendor.miscellaneous}
                                  onChange={(e) => handleVendorChange(vendorIndex, 'miscellaneous', e.target.value)}
                                  placeholder="Contoh: Additional Fee"
                                  size="small"
                                  className="w-full"
                                />
                              </Form.Item>
                            </div>

                            <Form.Item label="Deskripsi Vendor" className="mb-2">
                              <Input
                                value={vendor.description}
                                onChange={(e) => handleVendorChange(vendorIndex, 'description', e.target.value)}
                                placeholder="Masukkan deskripsi vendor"
                                size="small"
                                className="w-full"
                              />
                            </Form.Item>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <p className="text-sm font-medium text-blue-700 mb-1">Subtotal</p>
                                <p className="text-lg font-bold text-blue-900">
                                  {subtotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                                </p>
                              </div>
                              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <p className="text-sm font-medium text-green-700 mb-1">PPN</p>
                                <p className="text-lg font-bold text-green-900">
                                  {ppn.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                                </p>
                              </div>
                              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                <p className="text-sm font-medium text-purple-700 mb-1">Grand Total</p>
                                <p className="text-lg font-bold text-purple-900">
                                  {grandTotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                                </p>
                              </div>
                            </div>

                            {allocation !== 'JAJAID' && (
                              <div className="grid grid-cols-1 gap-4 mt-4">
                                <Form.Item label="Alasan" className="mb-2">
                                  <TextArea
                                    value={vendor.alasan}
                                    onChange={(e) => handleVendorChange(vendorIndex, 'alasan', e.target.value)}
                                    placeholder="Masukkan alasan"
                                    rows={3}
                                    size="small"
                                    className="w-full"
                                  />
                                </Form.Item>
                                <Form.Item label="Catatan" className="mb-2">
                                  <TextArea
                                    value={vendor.catatan}
                                    onChange={(e) => handleVendorChange(vendorIndex, 'catatan', e.target.value)}
                                    placeholder="Masukkan catatan"
                                    rows={3}
                                    size="small"
                                    className="w-full"
                                  />
                                </Form.Item>
                                <Form.Item label="Kesimpulan" className="mb-2">
                                  <TextArea
                                    value={vendor.kesimpulan}
                                    onChange={(e) => handleVendorChange(vendorIndex, 'kesimpulan', e.target.value)}
                                    placeholder="Masukkan kesimpulan"
                                    rows={3}
                                    size="small"
                                    className="w-full"
                                  />
                                </Form.Item>
                              </div>
                            )}
                          </div>
                        ),
                      },
                    ]}
                    style={{
                      '--ant-tabs-ink-bar-color': '#1890ff',
                      '--ant-tabs-tab-active-color': '#1890ff',
                    }}
                  />

                  <Card
                    title={
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        <span>Detail Produk</span>
                      </div>
                    }
                    className="mt-4"
                    size="small"
                    bodyStyle={{ padding: '12px' }}
                  >
                    <Table
                      dataSource={vendor.pilihanData}
                      columns={columns.map(col => ({
                        ...col,
                        render: (text, record, index) => col.render(text, record, index, vendorIndex),
                      }))}
                      pagination={false}
                      bordered={false}
                      rowClassName={() => 'border-b hover:bg-gray-50'}
                      scroll={{ x: 'max-content' }}
                      size="small"
                      style={{ fontSize: '12px' }}
                    />
                  </Card>
                </Card>
              );
            })}

            <Button
              type="dashed"
              onClick={handleAddVendor}
              className="w-full"
              mb={2}
              size="small"
            >
              Tambah Vendor {vendors.length}
            </Button>

            <div className="flex justify-start sm:justify-end">
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                size="middle"
                disabled={isSubmitDisabled}
                style={{
                  backgroundColor: '#1890ff',
                  borderColor: '#1890ff',
                  borderRadius: '6px',
                  fontWeight: '500',
                }}
                className="w-full sm:w-auto"
              >
                Simpan Pengajuan
              </Button>
            </div>
          </Form>
        )}
      </div>
    </div>
  );
};

export default TambahPengajuan;