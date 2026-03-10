import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Radio,
  Breadcrumb,
  notification,
  Modal,
  Card,
  Table
} from 'antd';
import { DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import moment from 'moment';
import { baseUrl } from '@/configs';
import { fetchAllProducts } from '@/utils/productUtils';

const { Option } = Select;
const { TextArea } = Input;

const PengajuanPembelianBaru = () => {
  const { id_pengajuan } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vendorList, setVendorList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [orderDetails, setOrderDetails] = useState({ id_company: '' });

  useEffect(() => {
    const fetchPurchaseOrder = async () => {
      if (!id_pengajuan) {
        notification.error({
          message: 'Error',
          description: 'ID pengajuan tidak diberikan!',
        });
        return;
      }

      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${baseUrl}/nimda/pengajuan/${id_pengajuan}`,
          {
            headers: {
              Authorization: `${token}`,
            },
          }
        );

        const result = await response.json();
        if (result.message === 'Pengajuan retrieved successfully!' && result.data) {
          const pengajuan = result.data;

          // Simpan orderDetails untuk id_company
          setOrderDetails({ id_company: pengajuan.id_company });

          // Set form fields
          form.setFieldsValue({
            kode_pengajuan: pengajuan.kode_pengajuan,
            tgl_pengajuan: moment(pengajuan.tgl_pengajuan),
            allocation: pengajuan.allocation,
            id_company: pengajuan.id_company,
            discount_type: pengajuan.discount_type,
            description: pengajuan.description,
            selected: pengajuan.selected,
          });

          // Map vendors from response
          const fetchedVendors = pengajuan.tb_pengajuan_vendors.map((vendor, index) => ({
            id_supplier: vendor.id_supplier,
            supplier_name: vendor.supplier_name,
            payment_terms: vendor.payment_terms,
            delivery_terms: vendor.delivery_terms,
            taxable: vendor.taxable,
            vat: vendor.vat,
            vat_type: vendor.vat_type,
            withholding_tax: vendor.withholding_tax,
            miscellaneous: vendor.miscellaneous,
            description: vendor.description,
            alasan: vendor.alasan || '',
            catatan: vendor.catatan || '',
            kesimpulan: vendor.kesimpulan || '',
            pilihanData: vendor.tb_pengajuan_pilihans.map((item, idx) => {
              const product = productList.find(p => p.id === item.product_id);
              return {
                key: `${index}-${idx}`,
                product_id: item.product_id,
                product_name: product ? product.name : item.specification,
                specification: item.specification,
                price: item.price,
                quantity: item.quantity,
                discount: item.discount,
                ppn: parseFloat(item.ppn) || 0,
                total_product: parseFloat(item.total_product),
                payment_terms: item.payment_terms,
                delivery_terms: item.delivery_terms,
                taxable: item.taxable,
              };
            }),
          }));

          setVendors(fetchedVendors);
        } else {
          notification.error({
            message: 'Error',
            description: 'Gagal mengambil data pengajuan',
          });
        }
      } catch (error) {
        console.error('Error fetching purchase order:', error);
        notification.error({
          message: 'Error',
          description: 'Gagal terhubung ke server',
        });
      } finally {
        setLoading(false);
      }
    };

    if (productList.length > 0) {
      fetchPurchaseOrder();
    }
  }, [id_pengajuan, form, productList]);

  useEffect(() => {
    const fetchAllVendors = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${baseUrl}/nimda/vendor/get-vendor?page=1&limit=1000&keyword=`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `${token}`,
            },
          }
        );
        const result = await response.json();
        if (result.code === 200) {
          setVendorList(result.data);
        }
      } catch (error) {
        console.error('Error fetching vendors:', error);
      }
    };

    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        const allProducts = await fetchAllProducts(token);
        setProductList(allProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchAllVendors();
    fetchProducts();
  }, []);

  const handleVendorChange = (index, field, value) => {
    setVendors(prevVendors => {
      const newVendors = [...prevVendors];
      newVendors[index] = { ...newVendors[index], [field]: value };

      if (field === 'taxable') {
        newVendors[index].pilihanData = newVendors[index].pilihanData.map(product => ({
          ...product,
          taxable: value === 'Yes',
          ppn: value === 'Yes' ? 11 : 0,
          total_product: product.price * product.quantity * (1 - product.discount / 100) * (value === 'Yes' ? 1.11 : 1),
        }));
        if (value === 'Yes') {
          notification.info({
            message: 'Informasi',
            description: 'Semua produk untuk vendor ini telah diatur menjadi kena pajak (PPN 11%).',
          });
        }
      }

      return newVendors;
    });
  };

  const handleVendorSelect = (vendorIndex, value) => {
    const selectedVendor = vendorList.find(v => v.id_vendor === value);
    setVendors(prevVendors => {
      const newVendors = [...prevVendors];
      newVendors[vendorIndex] = {
        ...newVendors[vendorIndex],
        id_supplier: selectedVendor ? selectedVendor.id_vendor : '',
        supplier_name: selectedVendor ? selectedVendor.display_name : '',
      };
      return newVendors;
    });
  };

  const handleProductChange = (vendorIndex, productIndex, field, value) => {
    setVendors(prevVendors => {
      const newVendors = [...prevVendors];
      const product = newVendors[vendorIndex].pilihanData[productIndex];

      if (field === 'product_id') {
        const selectedProduct = productList.find(p => p.id === value);
        product.product_id = value;
        product.product_name = selectedProduct ? selectedProduct.name : '';
      } else if (field === 'specification' || field === 'payment_terms' || field === 'delivery_terms') {
        product[field] = value;
      } else if (field === 'taxable') {
        product[field] = value === 'Yes';
        product.ppn = value === 'Yes' ? 11 : 0;
        newVendors[vendorIndex].taxable = newVendors[vendorIndex].pilihanData.every(p => p.taxable) ? 'Yes' : 'No';
      } else {
        product[field] = parseFloat(value) || 0;
      }

      product.total_product =
        product.price * product.quantity * (1 - product.discount / 100) * (1 + product.ppn / 100);
      return newVendors;
    });
  };

  const handleDeleteProduct = (vendorIndex, productIndex) => {
    setVendors(prevVendors => {
      const newVendors = [...prevVendors];
      newVendors[vendorIndex].pilihanData = newVendors[vendorIndex].pilihanData.filter(
        (_, i) => i !== productIndex
      );
      return newVendors;
    });
  };

  const handleAddVendor = () => {
    if (vendors.length >= 3) {
      notification.warning({
        message: 'Batas Maksimum',
        description: 'Anda hanya dapat menambahkan maksimum 3 vendor.',
      });
      return;
    }

    const defaultVendor = vendorList.length > 0 ? vendorList[0] : { id_vendor: '', display_name: '' };
    setVendors(prevVendors => [
      ...prevVendors,
      {
        id_supplier: defaultVendor.id_vendor,
        supplier_name: defaultVendor.display_name,
        payment_terms: 'Net 30',
        delivery_terms: 'FOB',
        taxable: 'No',
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
  };

  const handleDeleteVendor = (vendorIndex) => {
    if (vendors.length <= 1) {
      notification.warning({
        message: 'Tidak Dapat Menghapus',
        description: 'Minimal harus ada satu vendor.',
      });
      return;
    }

    setVendors(prevVendors => {
      const newVendors = prevVendors.filter((_, index) => index !== vendorIndex);
      const currentSelected = form.getFieldValue('selected');
      if (currentSelected === vendorIndex) {
        form.setFieldsValue({ selected: 0 });
      } else if (currentSelected > vendorIndex) {
        form.setFieldsValue({ selected: currentSelected - 1 });
      }
      return newVendors;
    });
  };

  const handleSubmit = async (values) => {
    setIsSubmitDisabled(true);

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
          taxable: vendor.taxable,
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
          id_pengajuan: parseInt(id_pengajuan),
          kode_pengajuan: values.kode_pengajuan,
          tgl_pengajuan: values.tgl_pengajuan.format('YYYY-MM-DD'),
          allocation: values.allocation,
          selected: parseInt(values.selected),
          posted: 0,
          canceled: 0,
          cancel_note: '',
          id_company: orderDetails.id_company,
          discount_type: values.discount_type,
          description: values.description,
          id_user: userId,
          id_data: parseInt(id_pengajuan),
        },
        vendorData: vendorData,
      };

      const response = await fetch(`${baseUrl}/nimda/pengajuan/${id_pengajuan}`, {
        method: 'PUT',
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
          description: 'Data pengajuan berhasil diperbarui.',
        });
        navigate(`/dashboard/pengajuan/detail/${id_pengajuan}`);
      } else {
        notification.error({
          message: 'Pengajuan Gagal',
          description: result.message || 'Terjadi kesalahan saat menyimpan pengajuan.',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      notification.error({
        message: 'Pengajuan Gagal',
        description: 'Terjadi kesalahan saat menyimpan pengajuan.',
      });
    } finally {
      setIsSubmitDisabled(false);
      setIsModalVisible(false);
    }
  };

  const showConfirmModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.submit();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: 'Nama Produk',
      dataIndex: 'product_name',
      width: 150,
      render: (_, record, index, vendorIndex) => (
        <Select
          showSearch
          placeholder="Pilih Produk"
          optionFilterProp="children"
          value={record.product_id}
          onChange={(value) => handleProductChange(vendorIndex, index, 'product_id', value)}
          size="small"
          style={{ width: 150 }}
          dropdownStyle={{ minWidth: 300 }}
          filterOption={(input, option) =>
            option.children.toLowerCase().includes(input.toLowerCase())
          }
        >
          {productList.map(product => (
            <Option key={product.id} value={product.id}>
              {product.name}
            </Option>
          ))}
        </Select>
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
          style={{ width: '170px', fontSize: '12px', padding: '2px 8px' }}
        />
      ),
    },
    {
      title: 'Harga',
      dataIndex: 'price',
      render: (_, record, index, vendorIndex) => (
        <Input
          type="text"
          value={record.price}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9.]/g, '');
            handleProductChange(vendorIndex, index, 'price', value);
          }}
          style={{ width: '100px', fontSize: '12px', padding: '2px 8px' }}
          className="w-full sm:w-[70px]"
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
        <Select
          value={record.taxable ? 'Yes' : 'No'}
          onChange={(value) => handleProductChange(vendorIndex, index, 'taxable', value)}
          style={{ width: '70px' }}
          className="w-full sm:w-[70px]"
        >
          <Option value="Yes">Yes</Option>
          <Option value="No">No</Option>
        </Select>
      ),
    },
    {
      title: 'Total Produk',
      dataIndex: 'total_product',
      render: (_, record) => (
        <span>{record.total_product.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span>
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
    <div className="max-w-8xl mx-auto mobile-responsive">
      <div className="bg-white p-3 rounded-lg shadow-sm max-w-full sm:max-w-8xl mx-auto">
        <h1 className="text-xl font-semibold text-gray-800 mb-2">
          Edit Pengajuan {form.getFieldValue('kode_pengajuan') || ''}
        </h1>

        {loading ? (
          <p>Loading data...</p>
        ) : (
          <Form form={form} layout="vertical" onFinish={handleSubmit} className="space-y-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-5 sm:gap-2">
              <Form.Item
                label="Kode Pengajuan"
                name="kode_pengajuan"
                rules={[{ required: true, message: 'Kode pengajuan harus diisi!' }]}
              >
                <Input
                  readOnly
                  size="small"
                  style={{ width: '100%', fontSize: '12px', padding: '2px 8px', backgroundColor: '#f5f5f5' }}
                />
              </Form.Item>
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
                label="Tipe Diskon"
                name="discount_type"
                rules={[{ required: true, message: 'Pilih tipe diskon!' }]}
              >
                <Select
                  placeholder="Pilih tipe diskon"
                  size="small"
                  className="w-full"
                >
                  <Option value="Percent">Percent</Option>
                  <Option value="Fixed">Fixed</Option>
                </Select>
              </Form.Item>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Form.Item label="Deskripsi" name="description">
                <TextArea placeholder="Masukkan deskripsi pengajuan" rows={3} size="middle" className="w-full" />
              </Form.Item>
            </div>

            {vendors.map((vendor, vendorIndex) => {
              const { subtotal, ppn, grandTotal } = calculateVendorTotals(vendor);
              return (
                <Card
                  title={`Vendor ${vendorIndex + 1}`}
                  key={vendorIndex}
                  className="mb-2"
                  size="small"
                  bodyStyle={{ padding: '8px' }}
                  extra={
                    <Button
                      type="link"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteVendor(vendorIndex)}
                      danger
                    >
                      Hapus
                    </Button>
                  }
                >
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4 sm:gap-2">
                    <Form.Item label="Supplier" className="mb-1">
                      <Select
                        showSearch
                        placeholder="Cari Supplier"
                        optionFilterProp="children"
                        onChange={(value) => handleVendorSelect(vendorIndex, value)}
                        value={vendor.id_supplier || undefined}
                        size="small"
                        className="w-full"
                        filterOption={false}
                      >
                        {vendorList.map(v => (
                          <Option key={v.id_vendor} value={v.id_vendor}>
                            {v.display_name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item label="Syarat Pembayaran" className="mb-1">
                      <Select
                        value={vendor.payment_terms}
                        onChange={(value) => handleVendorChange(vendorIndex, 'payment_terms', value)}
                        size="small"
                        className="w-full"
                      >
                        <Option value="Net 30">Net 30</Option>
                        <Option value="Net 45">Net 45</Option>
                        <Option value="Net 60">Net 60</Option>
                        <Option value="Cash on Delivery">COD</Option>
                        <Option value="Cash">Cash</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="Syarat Pengiriman" className="mb-1">
                      <Select
                        value={vendor.delivery_terms}
                        onChange={(value) => handleVendorChange(vendorIndex, 'delivery_terms', value)}
                        size="small"
                        className="w-full"
                      >
                        <Option value="FOB">FOB</Option>
                        <Option value="CIF">CIF</Option>
                        <Option value="EXW">EXW</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="Kena Pajak" className="mb-1">
                      <Select
                        value={vendor.taxable}
                        onChange={(value) => handleVendorChange(vendorIndex, 'taxable', value)}
                        size="small"
                        className="w-full"
                      >
                        <Option value="Yes">Yes</Option>
                        <Option value="No">No</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="PPN" className="mb-1">
                      <Input
                        value={vendor.vat}
                        onChange={(e) => handleVendorChange(vendorIndex, 'vat', e.target.value)}
                        placeholder="Contoh: 10%"
                        size="small"
                        className="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="Tipe PPN" className="mb-1">
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
                    <Form.Item label="Pajak Pemotongan" className="mb-1">
                      <Input
                        value={vendor.withholding_tax}
                        onChange={(e) => handleVendorChange(vendorIndex, 'withholding_tax', e.target.value)}
                        placeholder="Contoh: 2%"
                        size="small"
                        className="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="Biaya Lain-lain" className="mb-1">
                      <Input
                        value={vendor.miscellaneous}
                        onChange={(e) => handleVendorChange(vendorIndex, 'miscellaneous', e.target.value)}
                        placeholder="Contoh: Additional Fee"
                        size="small"
                        className="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="Deskripsi Vendor" className="mb-1">
                      <Input
                        value={vendor.description}
                        onChange={(e) => handleVendorChange(vendorIndex, 'description', e.target.value)}
                        placeholder="Masukkan deskripsi vendor"
                        size="small"
                        className="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="Subtotal" className="mb-1">
                      <Input
                        value={subtotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                        disabled
                        size="small"
                        className="w-full"
                        style={{ backgroundColor: '#f5f5f5' }}
                      />
                    </Form.Item>
                    <Form.Item label="PPN" className="mb-1">
                      <Input
                        value={ppn.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                        disabled
                        size="small"
                        className="w-full"
                        style={{ backgroundColor: '#f5f5f5' }}
                      />
                    </Form.Item>
                    <Form.Item label="GRAND TOTAL" className="mb-1">
                      <Input
                        value={grandTotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                        disabled
                        size="small"
                        className="w-full"
                        style={{ backgroundColor: '#f5f5f5' }}
                      />
                    </Form.Item>
                    <Form.Item label="Alasan" className="mb-1">
                      <TextArea
                        value={vendor.alasan}
                        onChange={(e) => handleVendorChange(vendorIndex, 'alasan', e.target.value)}
                        placeholder="Masukkan alasan"
                        rows={3}
                        size="small"
                        className="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="Catatan" className="mb-1">
                      <TextArea
                        value={vendor.catatan}
                        onChange={(e) => handleVendorChange(vendorIndex, 'catatan', e.target.value)}
                        placeholder="Masukkan catatan"
                        rows={3}
                        size="small"
                        className="w-full"
                      />
                    </Form.Item>
                    <Form.Item label="Kesimpulan" className="mb-1">
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

                  <Card title="DETAIL PRODUK" className="mt-2" size="small" bodyStyle={{ padding: '8px' }}>
                    <Table
                      tableLayout="fixed"
                      dataSource={vendor.pilihanData}
                      columns={columns.map(col => ({
                        ...col,
                        render: (text, record, index) => col.render(text, record, index, vendorIndex),
                      }))}
                      pagination={false}
                      bordered={false}
                      rowClassName={() => 'border-b'}
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
              className="w-full mb-2"
              size="small"
              disabled={vendors.length >= 3}
            >
              Tambah Vendor {vendors.length}/3
            </Button>

            <Form.Item
              label="Pilih Vendor"
              name="selected"
              rules={[{ required: true, message: 'Pilih salah satu vendor!' }]}
            >
              <Radio.Group className="flex flex-col sm:flex-row">
                {vendors.map((vendor, index) => (
                  <Radio key={index} value={index}>
                    {vendor.supplier_name || `Vendor ${index + 1}`}
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>

            <div className="flex justify-start sm:justify-end">
              <Button
                type="primary"
                onClick={showConfirmModal}
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

        <Modal
          title="Konfirmasi Submit"
          visible={isModalVisible}
          onOk={handleOk}
          onCancel={handleCancel}
          okText="OK"
          cancelText="Cancel"
          okButtonProps={{
            style: {
              backgroundColor: '#52c41a',
              borderColor: '#52c41a',
              color: '#fff',
            }
          }}
          cancelButtonProps={{
            style: {
              borderColor: '#d9d9d9',
              color: '#000',
            }
          }}
        >
          <p>Apakah Anda yakin ingin mengsubmit pengajuan pembelian ini?</p>
        </Modal>
      </div>
    </div>
  );
};

export default PengajuanPembelianBaru;