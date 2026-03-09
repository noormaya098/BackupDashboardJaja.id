import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  Space,
  notification,
  Modal,
  Switch
} from 'antd';
import axios from 'axios';
import { PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { baseUrl } from '@/configs';

const { Option } = Select;
const { TextArea } = Input;

const AddProductPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesV2, setCategoriesV2] = useState([]);
  const [categoriesV2Loading, setCategoriesV2Loading] = useState(false);
  const [subOptions, setSubOptions] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [inventoryAssets, setInventoryAssets] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [vendorOptions, setVendorOptions] = useState([]);
  const [vendorFetching, setVendorFetching] = useState(false);
  const [productUnits, setProductUnits] = useState([]);
  const [unitLoading, setUnitLoading] = useState(false);
  const [buyBasePrice, setBuyBasePrice] = useState(null);
  const [sellBasePrice, setSellBasePrice] = useState(null);
  const navigate = useNavigate();

  // Tax options
  const taxOptions = ["PPN", "Tidak"];

  // Product type options
  const productTypeOptions = ["Jaja ID", "Auto"];

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoryLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token tidak ditemukan. Silakan login terlebih dahulu.');
        }

        const response = await axios.get(`${baseUrl}/nimda/master_product/kategori`, {
          headers: {
            Authorization: `${token}`
          }
        });

        if (response.data.code === 200) {
          console.log('Categories from API:', response.data.data);
          setCategories(response.data.data);
        } else {
          throw new Error('Gagal mengambil data kategori');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        notification.error({
          message: 'Gagal Memuat Kategori',
          description: error.message || 'Tidak dapat mengambil data kategori.',
        });
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch product units from API
  useEffect(() => {
    const fetchProductUnits = async () => {
      setUnitLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${baseUrl}/nimda/master_product/product-units`, {
          headers: { Authorization: `${token}` }
        });
        if (response.data.success) {
          setProductUnits(response.data.data);
        } else {
          throw new Error('Gagal mengambil data satuan produk');
        }
      } catch (error) {
        notification.error({
          message: 'Gagal Memuat Satuan Produk',
          description: error.message || 'Tidak dapat mengambil data satuan produk.',
        });
      } finally {
        setUnitLoading(false);
      }
    };
    fetchProductUnits();
  }, []);

  useEffect(() => {
    const fetchInventoryAssets = async () => {
      setInventoryLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${baseUrl}/nimda/inventory/assets`, {
          headers: { Authorization: `${token}` }
        });
        if (response.data.code === 200) {
          setInventoryAssets(response.data.data);
        } else {
          throw new Error('Gagal mengambil data inventory asset');
        }
      } catch (error) {
        notification.error({
          message: 'Gagal Memuat Inventory Asset',
          description: error.message || 'Tidak dapat mengambil data inventory asset.',
        });
      } finally {
        setInventoryLoading(false);
      }
    };
    fetchInventoryAssets();
  }, []);

  useEffect(() => {
    handleVendorSearch('');
  }, []);

  // Handle form validation failures (show modal when category is missing)
  const handleFinishFailed = (errorInfo) => {
    try {
      const hasCategoryError = Array.isArray(errorInfo?.errorFields) && errorInfo.errorFields.some((f) => {
        if (!f || !f.name) return false;
        // f.name may be an array like ['category_id']
        if (Array.isArray(f.name)) return f.name[0] === 'category_id';
        return f.name === 'category_id';
      });

      if (hasCategoryError) {
        Modal.error({
          title: 'Kategori Produk Wajib',
          content: 'Mohon pilih kategori produk sebelum menyimpan.',
          okText: 'OK',
          okButtonProps: { style: { backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#fff' } },
        });
      }
    } catch (e) {
      console.error('Error handling form failure:', e);
    }
  };

  // Watch tax selection and percentage to adjust displayed prices
  const buyTax = Form.useWatch('default_buy_tax_name', form);
  const buyPpnPercentage = Form.useWatch('buy_ppn_percentage', form);
  const sellTax = Form.useWatch('default_sell_tax_name', form);
  const sellPpnPercentage = Form.useWatch('sell_ppn_percentage', form);
  // Watch isV2 toggle to control category behavior
  const isV2 = Form.useWatch('isV2', form);
  // Watch inventory asset value for debugging
  const inventoryAssetValue = Form.useWatch('id_inventory_asset', form);

  useEffect(() => {
    // Debug: log inventory asset value whenever it changes
    console.log('Form id_inventory_asset changed ->', inventoryAssetValue);
  }, [inventoryAssetValue]);

  // When isV2 toggled on, fetch kategori-v2 and populate parent/sub options
  useEffect(() => {
    let mounted = true;
    const fetchV2 = async () => {
      setCategoriesV2Loading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${baseUrl}/nimda/master_product/kategori-v2`, {
          headers: { Authorization: `${token}` }
        });
        if (!mounted) return;
        if (response.data && response.data.code === 200) {
          setCategoriesV2(response.data.data || []);
        } else {
          setCategoriesV2([]);
        }
      } catch (error) {
        console.error('Error fetching kategori-v2:', error);
        setCategoriesV2([]);
        notification.error({
          message: 'Gagal Memuat Kategori v2',
          description: error.message || 'Tidak dapat mengambil data kategori v2.'
        });
      } finally {
        if (mounted) setCategoriesV2Loading(false);
      }
    };

    if (isV2) {
      fetchV2();
    } else {
      // clear v2 selections when toggled off
      setCategoriesV2([]);
      setSubOptions([]);
      form.setFieldsValue({ category_v2: undefined });
    }

    return () => { mounted = false; };
  }, [isV2, form]);

  // When buy tax or its percentage changes, update buy_price display
  useEffect(() => {
    try {
      const base = buyBasePrice !== null ? buyBasePrice : (form.getFieldValue('buy_price') || 0);
      if (buyTax === 'PPN') {
        const percent = typeof buyPpnPercentage === 'number' ? buyPpnPercentage : 11;
        const gross = Math.round(base * (1 + percent / 100));
        form.setFieldsValue({ buy_price: gross });
      } else {
        // revert to base price
        form.setFieldsValue({ buy_price: base });
      }
    } catch (e) {
      // ignore
    }
  }, [buyTax, buyPpnPercentage, buyBasePrice, form]);

  // When sell tax or its percentage changes, update sell_price display
  useEffect(() => {
    try {
      const base = sellBasePrice !== null ? sellBasePrice : (form.getFieldValue('sell_price') || 0);
      if (sellTax === 'PPN') {
        const percent = typeof sellPpnPercentage === 'number' ? sellPpnPercentage : 11;
        const gross = Math.round(base * (1 + percent / 100));
        form.setFieldsValue({ sell_price: gross });
      } else {
        form.setFieldsValue({ sell_price: base });
      }
    } catch (e) {
      // ignore
    }
  }, [sellTax, sellPpnPercentage, sellBasePrice, form]);

  // Handlers to capture base prices when user edits price inputs
  const handleBuyPriceChange = (value) => {
    const numeric = Number(value) || 0;
    setBuyBasePrice(numeric);
    if (buyTax === 'PPN') {
      const percent = typeof buyPpnPercentage === 'number' ? buyPpnPercentage : 11;
      const gross = Math.round(numeric * (1 + percent / 100));
      form.setFieldsValue({ buy_price: gross });
    } else {
      form.setFieldsValue({ buy_price: numeric });
    }
  };

  const handleSellPriceChange = (value) => {
    const numeric = Number(value) || 0;
    setSellBasePrice(numeric);
    if (sellTax === 'PPN') {
      const percent = typeof sellPpnPercentage === 'number' ? sellPpnPercentage : 11;
      const gross = Math.round(numeric * (1 + percent / 100));
      form.setFieldsValue({ sell_price: gross });
    } else {
      form.setFieldsValue({ sell_price: numeric });
    }
  };

  // Handler untuk search vendor
  const handleVendorSearch = async (value) => {
    setVendorFetching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${baseUrl}/nimda/vendor/get-vendor?page=1&limit=2000&keyword=${value || ''}`,
        { headers: { Authorization: `${token}` } });
      if (response.data.code === 200) {
        setVendorOptions(response.data.data);
      } else {
        setVendorOptions([]);
      }
    } catch (e) {
      setVendorOptions([]);
    } finally {
      setVendorFetching(false);
    }
  };

  const handleSubmit = async (values) => {
    Modal.confirm({
      title: 'Konfirmasi Simpan Produk',
      content: `Apakah Anda yakin ingin menyimpan produk "${values.name}"?`,
      okText: 'OK',
      okButtonProps: { style: { backgroundColor: '#22c55e', borderColor: '#22c55e', color: '#fff' } },
      cancelText: 'Cancel',
      cancelButtonProps: { style: { backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#fff' } },
      onOk: async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('Token tidak ditemukan. Silakan login terlebih dahulu.');
          }
          // Cari kategori berdasarkan category_id
          const selectedCategory = categories.find(cat => parseInt(cat.id_category) === parseInt(values.category_id));
          // Cari unit berdasarkan unit_id
          const selectedUnit = productUnits.find(unit => unit.id_product_unit === values.unit);
          // Buat product_category dengan format yang sama seperti Postman
          const productCategory = values.isV2 ? "" : (selectedCategory?.category_name || "");

          // Debug: log untuk memeriksa data
          console.log('Selected category:', selectedCategory);
          console.log('Selected unit:', selectedUnit);
          console.log('Category ID from form:', values.category_id);
          console.log('Unit ID from form:', values.unit);

          // Payload dinamis berdasarkan input form
          const payload = {
            name: values.name,
            description: values.description || "",
            product_code: values.sku_otomatis ? null : values.product_code || null,
            sku_otomatis: values.sku_otomatis || false,
            product_type: values.product_type || null,
            stock: values.stock || 0,
            unit: selectedUnit?.unit_name || "Unit", // Menggunakan nama unit yang dipilih
            buy_price: values.buy_price || 0,
            default_buy_tax_name: values.default_buy_tax_name || "",
            buy_ppn_percentage: values.default_buy_tax_name === 'PPN' ? (values.buy_ppn_percentage || 11) : null,
            sell_price: values.sell_price || 0,
            default_sell_tax_name: values.default_sell_tax_name || "",
            sell_ppn_percentage: values.default_sell_tax_name === 'PPN' ? (values.sell_ppn_percentage || 11) : null,
            // If using v2 categories, category_id should be null and parent/sub codes used instead
            category_id: values.isV2 ? null : (values.category_id ? parseInt(values.category_id) : null), // Pastikan ini number
            vendor_id: values.vendor_id || null, // Set null jika tidak ada vendor yang dipilih
            product_category: productCategory,
            // For v2: parent_code = selected parent (values.category_id), sub_code = selected child (values.category_v2) or fallback to parent
            parent_code: values.isV2 ? (values.category_id || null) : null,
            sub_code: values.isV2 ? (values.category_v2 || values.category_id || null) : null,
            isV2: !!values.isV2,
            sell_tax_id: null,
            buy_tax_id: null,
            id_product_jurnal: null,
            buy_account_number: null,
            buy_account_name: null,
            sell_account_number: null,
            sell_account_name: null,
            id_inventory_asset: values.id_inventory_asset,
            brand: values.product_type === 'Auto' ? 'AUTO' : 'JAJAID',
          };

          // Debug: log payload
          console.log('Final payload:', payload);
          const response = await axios.post(
            `${baseUrl}/nimda/master_product/create`,
            payload,
            {
              headers: {
                Authorization: token ? `${token}` : undefined,
                'Content-Type': 'application/json'
              }
            }
          );

          // Follow API response shape: { message, code, data?, success? }
          const respData = response?.data || {};
          const respCode = respData.code ?? (response.status || null);
          const respMessage = respData.message || respData?.data?.message || `Status ${respCode}`;

          if (respCode === 200 || respData.success === true || response.status === 200 || response.status === 201) {
            Modal.success({
              title: 'Produk Berhasil Ditambahkan',
              content: respMessage || `Produk ${values.name} telah berhasil ditambahkan.`,
              okText: 'OK',
              okButtonProps: { style: { backgroundColor: '#22c55e', borderColor: '#22c55e', color: '#fff' } },
              onOk: () => {
                navigate('/dashboard/produk');
              }
            });
            form.resetFields();
          } else {
            Modal.error({
              title: 'Gagal Menambahkan Produk',
              content: `${respMessage || 'Gagal menambahkan produk'}${respCode ? ` (code: ${respCode})` : ''}`,
              okText: 'OK',
              okButtonProps: { style: { backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#fff' } },
            });
          }
        } catch (error) {
          Modal.error({
            title: 'Gagal Menambahkan Produk',
            content: error.message || 'Terjadi kesalahan saat menyimpan produk.',
            okText: 'OK',
            okButtonProps: { style: { backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#fff' } },
          });
        } finally {
          setLoading(false);
        }
      },
      onCancel: () => { },
    });
  };

  return (
    <div className="min-h-screen px-2 sm:px-0">
      <style>
        {`
          .ant-form-item {
            margin-bottom: 8px !important;
          }
          .ant-form-item-label > label {
            margin-bottom: 2px !important;
          }
        `}
      </style>
      <Card title="TAMBAH PRODUK BARU" className="mb-8">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onFinishFailed={handleFinishFailed}
          requiredMark={false}
          initialValues={{ sku_otomatis: true, unit: 21, isV2: false }} // Default unit to id_product_unit for "Pcs"
        >
          {/* INFORMASI DASAR */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold">INFORMASI DASAR</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Form.Item
                name="name"
                label="Nama Produk"
                rules={[{ required: true, message: 'Mohon masukkan nama produk' }]}
              >
                <Input
                  placeholder="Masukkan nama produk"
                  className="w-full"
                />
              </Form.Item>

              <Form.Item
                name="sku_otomatis"
                label="SKU Otomatis"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="product_code"
                label="Kode Produk"
                rules={[{ required: Form.useWatch('sku_otomatis', form) === false, message: 'Mohon masukkan kode produk jika SKU tidak otomatis' }]}
                dependencies={['sku_otomatis']}
              >
                <Input
                  placeholder="Contoh: JI-8306J01100002"
                  className="w-full"
                  disabled={Form.useWatch('sku_otomatis', form)}
                />
              </Form.Item>

              <Form.Item
                name="vendor_id"
                label="Pilih Vendor (Opsional)"
              >
                <Select
                  showSearch
                  placeholder="Pilih vendor (opsional)"
                  filterOption={false}
                  onSearch={handleVendorSearch}
                  onFocus={() => handleVendorSearch('')}
                  notFoundContent={vendorFetching ? 'Memuat...' : 'Tidak ditemukan'}
                  loading={vendorFetching}
                  allowClear
                  className="w-full"
                  optionLabelProp="children"
                >
                  {vendorOptions.map(vendor => (
                    <Option key={vendor.id_vendor} value={vendor.id_vendor}>{vendor.display_name}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="product_type"
                label="Tipe Produk"
              >
                <Select
                  placeholder="Pilih tipe produk"
                  className="w-full"
                  allowClear
                >
                  {productTypeOptions.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Form.Item
                name="description"
                label="Deskripsi"
              >
                <TextArea
                  placeholder="Masukkan deskripsi produk"
                  rows={3}
                  className="w-full"
                  rules={[{ required: true, message: 'Mohon pilih satuan' }]}

                />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                name="unit"
                label="Satuan"
                rules={[{ required: true, message: 'Mohon pilih satuan' }]}
              >
                <Select
                  placeholder="Pilih satuan"
                  className="w-full"
                  loading={unitLoading}
                >
                  {productUnits.map(unit => (
                    <Option key={unit.id_product_unit} value={unit.id_product_unit}>{unit.unit_name}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="stock"
                label="Stok Awal"
                initialValue={0}
              >
                <InputNumber
                  min={0}
                  className="w-full"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </div>
          </div>

          {/* INFORMASI KATEGORI */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold">INFORMASI KATEGORI</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-4">
                <Form.Item
                  name="category_id"
                  label={<span> Kategori Produk <span className="text-red-500 ml-1">*</span></span>}
                  dependencies={["isV2"]}
                  rules={[{
                    validator: (_, value) => {
                      const usingV2 = form.getFieldValue('isV2');
                      if (usingV2) return Promise.resolve();
                      if (!value && !usingV2) return Promise.reject(new Error('Mohon pilih kategori produk'));
                      return Promise.resolve();
                    }
                  }]}
                >
                  <Select
                    placeholder={isV2 ? "Pilih kategori v2 (parent)" : "Pilih kategori"}
                    loading={isV2 ? categoriesV2Loading : categoryLoading}
                    className="w-full"
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    onChange={(value) => {
                      if (isV2) {
                        // value is parent.code
                        const parent = categoriesV2.find(p => p.code === value);
                        const firstChild = parent?.children?.[0];
                        setSubOptions(parent?.children || []);
                        // set category_v2 to first child.code if exists, otherwise parent.code
                        form.setFieldsValue({ category_v2: firstChild?.code || parent?.code });
                        // clear inventory asset errors when category changes
                        try { form.setFields([{ name: ['id_inventory_asset'], errors: [] }]); } catch (e) { }
                      } else {
                        // clear any v2 fields if switching back
                        setSubOptions([]);
                        form.setFieldsValue({ category_v2: undefined });
                        // clear inventory asset errors when category changes
                        try { form.setFields([{ name: ['id_inventory_asset'], errors: [] }]); } catch (e) { }
                      }
                    }}
                  >
                    {isV2
                      ? categoriesV2.map(parent => (
                        <Option key={parent.code} value={parent.code}>
                          {`${parent.code} - ${parent.name}`}
                        </Option>
                      ))
                      : categories.map(category => (
                        <Option key={category.id_category} value={parseInt(category.id_category)}>
                          {category.category_name}
                        </Option>
                      ))}
                  </Select>
                </Form.Item>

                <Form.Item name="isV2" label="Kategori v2" valuePropName="checked" className="!mb-0">
                  <Switch />
                </Form.Item>
              </div>
              <Form.Item
                name="id_inventory_asset"
                label="Inventory asset"
                rules={[
                  { required: true, message: 'Pilih akun persediaan' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      // Accept numeric 0 as a valid selection; only reject null/undefined/empty string
                      if (value !== undefined && value !== null && value !== '') {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Pilih akun persediaan'));
                    }
                  })
                ]}
              >
                <Select
                  placeholder="Pilih akun persediaan"
                  loading={inventoryLoading}
                  className="w-full"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  onChange={(val) => {
                    // Atomically set the field value and clear any errors
                    try {
                      form.setFields([{ name: ['id_inventory_asset'], value: val, errors: [] }]);
                    } catch (e) {
                      // fallback
                      form.setFieldsValue({ id_inventory_asset: val });
                      form.setFields([{ name: ['id_inventory_asset'], errors: [] }]);
                    }

                    // Extra debug logs to inspect current form state for this field
                    console.log('Select onChange id_inventory_asset ->', val);
                    console.log('After setFields value:', form.getFieldValue('id_inventory_asset'));
                    console.log('After setFields errors:', form.getFieldError('id_inventory_asset'));

                    // Re-validate shortly after to ensure AntD updates internal state
                    setTimeout(() => {
                      form.validateFields(['id_inventory_asset']).then(() => {
                        console.log('Validation passed for id_inventory_asset');
                      }).catch(err => {
                        console.log('Validation error for id_inventory_asset after set ->', form.getFieldError('id_inventory_asset'), err);
                      });
                    }, 50);
                  }}
                >
                  {inventoryAssets.map(asset => (
                    <Option key={String(asset.id_asset)} value={asset.id_asset}>
                      {asset.account_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            {/* If using v2 categories show parent_code and sub_code as dynamic selects */}
            {isV2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <Form.Item
                  name="category_v2"
                  label="Kategori v2"
                  rules={[{ required: true, message: 'Mohon pilih kategori v2' }]}
                >
                  <Select
                    placeholder="Pilih kategori v2"
                    loading={categoriesV2Loading}
                    className="w-full"
                    showSearch
                    optionFilterProp="children"
                    allowClear
                    onChange={(val) => form.setFieldsValue({ category_v2: val })}
                  >
                    {/* If there are subOptions (children), list them. Otherwise list the parent itself */}
                    {subOptions && subOptions.length > 0 ? (
                      subOptions.map(sub => (
                        <Option key={sub.code} value={sub.code}>
                          {`${sub.code} - ${sub.name}`}
                        </Option>
                      ))
                    ) : (
                      // find selected parent
                      (() => {
                        const parent = categoriesV2.find(p => p.code === form.getFieldValue('category_id'));
                        if (parent) {
                          return (
                            <Option key={parent.code} value={parent.code}>
                              {`${parent.code} - ${parent.name}`}
                            </Option>
                          );
                        }
                        return null;
                      })()
                    )}
                  </Select>
                </Form.Item>
              </div>
            )}
          </div>

          {/* INFORMASI HARGA */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold">INFORMASI HARGA</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                name="buy_price"
                label="Harga Beli"
              >
                <InputNumber
                  min={0}
                  className="w-full"
                  formatter={value => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\Rp\s?|(,*)/g, '')}
                  onChange={handleBuyPriceChange}
                />
              </Form.Item>

              <div className="flex gap-2">
                <Form.Item
                  name="default_buy_tax_name"
                  label="Pajak Pembelian"
                  className="flex-1"
                >
                  <Select
                    placeholder="Pilih pajak"
                    className="w-full"
                  >
                    {taxOptions.map(tax => (
                      <Option key={tax} value={tax}>{tax}</Option>
                    ))}
                  </Select>
                </Form.Item>

                {Form.useWatch('default_buy_tax_name', form) === 'PPN' && (
                  <Form.Item
                    name="buy_ppn_percentage"
                    label="% PPN"
                    className="w-24"
                    initialValue={11}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      className="w-full"
                      formatter={value => `${value}%`}
                      parser={value => value.replace('%', '')}
                    />
                  </Form.Item>
                )}
              </div>

              <Form.Item
                name="sell_price"
                label="Harga Jual"
              >
                <InputNumber
                  min={0}
                  className="w-full"
                  formatter={value => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\Rp\s?|(,*)/g, '')}
                  onChange={handleSellPriceChange}
                />
              </Form.Item>

              <div className="flex gap-2">
                <Form.Item
                  name="default_sell_tax_name"
                  label="Pajak Penjualan"
                  className="flex-1"
                >
                  <Select
                    placeholder="Pilih pajak"
                    className="w-full"
                  >
                    {taxOptions.map(tax => (
                      <Option key={tax} value={tax}>{tax}</Option>
                    ))}
                  </Select>
                </Form.Item>

                {Form.useWatch('default_sell_tax_name', form) === 'PPN' && (
                  <Form.Item
                    name="sell_ppn_percentage"
                    label="% PPN"
                    className="w-24"
                    initialValue={11}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      className="w-full"
                      formatter={value => `${value}%`}
                      parser={value => value.replace('%', '')}
                    />
                  </Form.Item>
                )}
              </div>
            </div>
          </div>
        </Form>
      </Card>

      <div className="flex justify-start sm:justify-end mt-8">
        <Space>
          <Button
            type="default"
            onClick={() => form.resetFields()}
          >
            Reset
          </Button>
          <Button
            type="primary"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-md"
            onClick={() => form.submit()}
            loading={loading}
            disabled={loading}
            icon={<SaveOutlined />}
          >
            Simpan Produk
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default AddProductPage;