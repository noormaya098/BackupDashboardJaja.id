import { Card, Button, Input, Radio, Select, Row, Col, Switch } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { baseUrl } from '@/configs';

const { Option } = Select;

function EditProduk() {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        product_code: '',
        sku_otomatis: true,
        product_type: null,
        stock: 0,
        unit: 21, // Default to id_product_unit for "Pcs"
        buy_price: 0,
        default_buy_tax_name: 'PPN',
        sell_price: 0,
        default_sell_tax_name: 'PPN',
        category_id: null,
        product_category: '',
        isV2: false,
        parent_code: null,
        sub_code: null,
        sell_tax_id: null,
        buy_tax_id: null,
        id_product_jurnal: null,
        buy_account_number: null,
        buy_account_name: null,
        sell_account_number: null,
        sell_account_name: null,
        id_inventory_asset: null,
        brand: null,
        vendor_id: null,
    });
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [condition, setCondition] = useState('baru');
    const [categories, setCategories] = useState([]);
    const [categoriesV2, setCategoriesV2] = useState([]);
    const [categoriesV2Loading, setCategoriesV2Loading] = useState(false);
    const [subOptions, setSubOptions] = useState([]);
    const [inventoryAssets, setInventoryAssets] = useState([]);
    const [inventoryLoading, setInventoryLoading] = useState(false);
    const [vendorOptions, setVendorOptions] = useState([]);
    const [vendorFetching, setVendorFetching] = useState(false);
    const [productUnits, setProductUnits] = useState([]);
    const [unitLoading, setUnitLoading] = useState(false);
    const navigate = useNavigate();
    const { id } = useParams();

    // Product type options
    const productTypeOptions = ["Jaja ID", "Auto"];

    // Fetch data produk, kategori, inventory assets, dan product units
    useEffect(() => {
        const fetchProductAndCategories = async () => {
            setFetchLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/auth/sign-in');
                    return;
                }

                // Fetch data produk
                const productResponse = await axios.get(`${baseUrl}/nimda/master_product/detail/${id}`, {
                    headers: {
                        Authorization: `${token}`
                    }
                });

                const productData = productResponse.data.data || {};
                setFormData(prev => ({
                    ...prev,
                    ...productData,
                    name: productData.name || '',
                    description: productData.description || '',
                    product_code: productData.product_code || '',
                    sku_otomatis: productData.sku_otomatis || true,
                    product_type: productData.product_type || null,
                    stock: productData.stock || 0,
                    unit: productData.unit || 21, // Assume unit is id_product_unit
                    buy_price: productData.buy_price || 0,
                    default_buy_tax_name: productData.default_buy_tax_name || 'PPN',
                    sell_price: productData.sell_price || 0,
                    default_sell_tax_name: productData.default_sell_tax_name || 'PPN',
                    // Detect V2: if category_id is non-numeric (contains hyphen or letters) treat as v2
                    category_id: productData.category_id || null,
                    isV2: (productData.category_id && isNaN(Number(productData.category_id))) || false,
                    // Try to populate parent_code/sub_code when category_id has a '-' separator
                    parent_code: (productData.category_id && String(productData.category_id).includes('-')) ? String(productData.category_id).split('-')[0] : (productData.parent_code || null),
                    sub_code: (productData.category_id && String(productData.category_id).includes('-')) ? String(productData.category_id).split('-').slice(1).join('-') : (productData.sub_code || null),
                    product_category: productData.product_category || '',
                    sell_tax_id: productData.sell_tax_id || null,
                    buy_tax_id: productData.buy_tax_id || null,
                    id_product_jurnal: productData.id_product_jurnal || null,
                    buy_account_number: productData.buy_account_number || null,
                    buy_account_name: productData.buy_account_name || null,
                    sell_account_number: productData.sell_account_number || null,
                    sell_account_name: productData.sell_account_name || null,
                    id_inventory_asset: productData.id_inventory_asset || null,
                    brand: productData.brand || (productData.product_type === 'Auto' ? 'AUTO' : 'JAJAID'),
                    vendor_id: productData.vendor_id || null,
                }));
                setCondition(productData.condition || 'baru');

                // Fetch data kategori (v1)
                const categoryResponse = await axios.get(`${baseUrl}/nimda/master_product/kategori`, {
                    headers: {
                        Authorization: `${token}`
                    }
                });
                setCategories(categoryResponse.data.data || []);

                // If this product is v2, also fetch kategori-v2 so we can populate children
                if ((productData.category_id && isNaN(Number(productData.category_id))) || productData.isV2) {
                    try {
                        setCategoriesV2Loading(true);
                        const responseV2 = await axios.get(`${baseUrl}/nimda/master_product/kategori-v2`, {
                            headers: { Authorization: `${token}` }
                        });
                        if (responseV2.data && responseV2.data.code === 200) {
                            setCategoriesV2(responseV2.data.data || []);
                            // try to determine selected parent and child
                            const parentCode = productData.parent_code || (productData.category_id && String(productData.category_id).includes('-') ? String(productData.category_id).split('-')[0] : productData.category_id) || null;
                            const childCode = productData.sub_code || (productData.category_id && String(productData.category_id).includes('-') ? String(productData.category_id).split('-').slice(1).join('-') : null) || null;
                            if (parentCode) {
                                const parent = (responseV2.data.data || []).find(p => p.code === parentCode);
                                const children = parent?.children || [];
                                setSubOptions(children);
                                setFormData(prev => ({ ...prev, category_id: parentCode, category_v2: childCode || (children[0]?.code) || parentCode }));
                            }
                        }
                    } catch (err) {
                        console.error('Error fetching kategori-v2 in edit:', err);
                    } finally {
                        setCategoriesV2Loading(false);
                    }
                }

                // Fetch inventory asset
                const inventoryResponse = await axios.get(`${baseUrl}/nimda/inventory/assets`, {
                    headers: { Authorization: `${token}` }
                });
                setInventoryAssets(inventoryResponse.data.data || []);

                // Fetch product units
                const unitResponse = await axios.get(`${baseUrl}/nimda/master_product/product-units`, {
                    headers: { Authorization: `${token}` }
                });
                if (unitResponse.data.success) {
                    setProductUnits(unitResponse.data.data);
                } else {
                    throw new Error('Gagal mengambil data satuan produk');
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: 'Gagal mengambil data: ' + (error.response?.data?.message || error.message),
                    confirmButtonColor: '#3B82F6',
                    confirmButtonText: 'OK'
                });
                navigate('/dashboard/produk');
            } finally {
                setFetchLoading(false);
                setUnitLoading(false);
            }
        };
        fetchProductAndCategories();
    }, [id, navigate]);

    // Update product_category secara dinamis saat category_id berubah
    useEffect(() => {
        if (formData.category_id) {
            const selectedCategory = categories.find(cat => parseInt(cat.id_category) === parseInt(formData.category_id));
            const productCategory = selectedCategory?.category_name || '';
            setFormData(prev => ({
                ...prev,
                product_category: productCategory
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                product_category: ''
            }));
        }
    }, [formData.category_id, categories]);

    useEffect(() => {
        handleVendorSearch('');
    }, []);

    // When toggling isV2, fetch kategori-v2 dynamically and prepare child options
    useEffect(() => {
        let mounted = true;
        const fetchV2 = async () => {
            if (!formData.isV2) {
                setCategoriesV2([]);
                setSubOptions([]);
                setFormData(prev => ({ ...prev, category_v2: undefined }));
                return;
            }
            setCategoriesV2Loading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${baseUrl}/nimda/master_product/kategori-v2`, {
                    headers: { Authorization: `${token}` }
                });
                if (!mounted) return;
                if (response.data && response.data.code === 200) {
                    setCategoriesV2(response.data.data || []);
                    // If we already have a parent_code or category_id string, use it to set children
                    const parentCode = formData.parent_code || (formData.category_id && String(formData.category_id).includes('-') ? String(formData.category_id).split('-')[0] : formData.category_id) || null;
                    const childCode = formData.sub_code || null;
                    if (parentCode) {
                        const parent = (response.data.data || []).find(p => p.code === parentCode);
                        const children = parent?.children || [];
                        setSubOptions(children);
                        setFormData(prev => ({ ...prev, category_id: parentCode, category_v2: childCode || (children[0]?.code) || parentCode }));
                    }
                }
            } catch (err) {
                console.error('Error fetching kategori-v2:', err);
            } finally {
                if (mounted) setCategoriesV2Loading(false);
            }
        };
        fetchV2();
        return () => { mounted = false; };
    }, [formData.isV2]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Jika product_type berubah, update brand
        if (name === 'product_type') {
            setFormData(prev => ({
                ...prev,
                brand: value === 'Auto' ? 'AUTO' : 'JAJAID',
            }));
        }
    };

    const handleSwitchChange = (checked) => {
        setFormData(prev => ({
            ...prev,
            sku_otomatis: checked,
            product_code: checked ? '' : prev.product_code
        }));
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

    const handleSubmit = async (isDraft = false) => {
        // Validasi manual untuk memastikan data yang dibutuhkan diisi
        if (!formData.name) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: 'Nama Produk wajib diisi',
                confirmButtonColor: '#3B82F6',
                confirmButtonText: 'OK'
            });
            return;
        }
        if (!formData.unit) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: 'Satuan wajib diisi',
                confirmButtonColor: '#3B82F6',
                confirmButtonText: 'OK'
            });
            return;
        }
        if (!formData.sku_otomatis && !formData.product_code) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: 'Kode Produk wajib diisi jika SKU tidak otomatis',
                confirmButtonColor: '#3B82F6',
                confirmButtonText: 'OK'
            });
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Cari kategori berdasarkan category_id
            const selectedCategory = categories.find(cat => parseInt(cat.id_category) === parseInt(formData.category_id));
            // Cari unit berdasarkan unit_id
            const selectedUnit = productUnits.find(unit => unit.id_product_unit === formData.unit);
            // Buat product_category dengan format yang sama seperti Postman
            const productCategory = selectedCategory?.category_name || "";

            // Debug: log untuk memeriksa data
            console.log('Selected category:', selectedCategory);
            console.log('Selected unit:', selectedUnit);
            console.log('Category ID from form:', formData.category_id);
            console.log('Unit ID from form:', formData.unit);

            // Payload dinamis berdasarkan input form
            const payload = {
                name: formData.name,
                description: formData.description || "",
                product_code: formData.sku_otomatis ? null : formData.product_code || null,
                sku_otomatis: formData.sku_otomatis || false,
                product_type: formData.product_type || null,
                stock: parseInt(formData.stock) || 0,
                unit: selectedUnit?.unit_name || "Unit", // Menggunakan nama unit yang dipilih
                buy_price: parseFloat(formData.buy_price) || 0,
                default_buy_tax_name: formData.default_buy_tax_name || "",
                sell_price: parseFloat(formData.sell_price) || 0,
                default_sell_tax_name: formData.default_sell_tax_name || "",
                // If using v2 categories, set category_id null and use parent_code/sub_code instead
                category_id: formData.isV2 ? null : (formData.category_id || null),
                vendor_id: formData.vendor_id,
                product_category: formData.isV2 ? "" : productCategory,
                // For v2: parent_code = selected parent (formData.category_id), sub_code = selected child (formData.category_v2) or fallback to parent
                parent_code: formData.isV2 ? (formData.category_id || null) : null,
                sub_code: formData.isV2 ? (formData.category_v2 || formData.category_id || null) : null,
                isV2: !!formData.isV2,
                sell_tax_id: null,
                buy_tax_id: null,
                id_product_jurnal: null,
                buy_account_number: null,
                buy_account_name: null,
                sell_account_number: null,
                sell_account_name: null,
                id_inventory_asset: formData.id_inventory_asset || null,
                brand: formData.brand || (formData.product_type === 'Auto' ? 'AUTO' : 'JAJAID'),
            };

            // Debug: log
            console.log('Final payload:', payload);
            const response = await axios.put(
                `${baseUrl}/nimda/master_product/update/${id}`,
                payload,
                {
                    headers: {
                        Authorization: `${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            Swal.fire({
                icon: 'success',
                title: 'Berhasil',
                text: `Produk berhasil ${isDraft ? 'disimpan sebagai draft' : 'diperbarui dan ditampilkan'}`,
                confirmButtonColor: '#3B82F6',
                confirmButtonText: 'OK'
            }).then(() => {
                navigate('/dashboard/produk');
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: error.response?.data?.message || 'Terjadi kesalahan saat mengupdate produk',
                confirmButtonColor: '#3B82F6',
                confirmButtonText: 'OK'
            });
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading) {
        return (
            <div className="text-center text-gray-500 py-10">Memuat...</div>
        );
    }

    return (
        <div className="min-h-screen px-2 sm:px-0">
            <Card title={`EDIT PRODUK - ${formData.name || 'Produk'}`} className="mb-8">
                {/* INFORMASI PRODUK */}
                <div className="mb-4">
                    <h3 className="text-lg font-semibold">INFORMASI PRODUK</h3>
                    <Row gutter={[8, 8]} className="flex flex-col sm:flex-row">
                        <Col xs={24} sm={6}>
                            <label className="block mb-1">Nama Produk <span className="text-red-500">*</span></label>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                showCount
                                maxLength={100}
                                placeholder="Masukkan nama produk"
                                className="w-full"
                            />
                        </Col>
                        <Col xs={24} sm={6}>
                            <label className="block mb-1">SKU Otomatis</label>
                            <Switch
                                checked={formData.sku_otomatis}
                                onChange={handleSwitchChange}
                            />
                        </Col>
                        <Col xs={24} sm={6}>
                            <label className="block mb-1">Kode Produk <span className="text-red-500">{!formData.sku_otomatis && '*'}</span></label>
                            <Input
                                name="product_code"
                                value={formData.product_code}
                                onChange={handleChange}
                                showCount
                                maxLength={50}
                                placeholder="Contoh: JI-8306J01100002"
                                className="w-full"
                            />
                        </Col>
                        <Col xs={24} sm={6}>
                            <label className="block mb-1">Pilih Vendor <span className="text-red-500">*</span></label>
                            <Select
                                showSearch
                                placeholder="Cari dan pilih vendor"
                                filterOption={false}
                                onSearch={handleVendorSearch}
                                onFocus={() => handleVendorSearch('')}
                                notFoundContent={vendorFetching ? 'Memuat...' : 'Tidak ditemukan'}
                                loading={vendorFetching}
                                allowClear
                                className="w-full"
                                value={formData.vendor_id || undefined}
                                onChange={value => handleSelectChange('vendor_id', value)}
                                optionLabelProp="children"
                            >
                                {vendorOptions.map(vendor => (
                                    <Option key={vendor.id_vendor} value={vendor.id_vendor}>{vendor.display_name}</Option>
                                ))}
                            </Select>
                        </Col>
                    </Row>
                    <Row gutter={[8, 8]} className="flex flex-col sm:flex-row">
                        <Col xs={24} sm={6}>
                            <label className="block mb-1">Deskripsi Produk <span className="text-red-500">*</span></label>
                            <TextArea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                showCount
                                maxLength={5000}
                                placeholder="Masukkan deskripsi produk"
                                rows={3}
                                className="w-full"
                            />
                        </Col>
                    </Row>
                </div>

                {/* KATEGORI */}
                <div className="mb-4">
                    <h3 className="text-lg font-semibold">KATEGORI</h3>
                    <Row gutter={[8, 8]} className="flex flex-col sm:flex-row">
                        <Col xs={24} sm={8}>
                            <label className="block mb-1">Kategori Produk <span className="text-red-500">*</span></label>
                            <Select
                                name="category_id"
                                value={formData.category_id}
                                onChange={(value) => {
                                    handleSelectChange('category_id', value);
                                    // if v2, value will be parent.code
                                    if (formData.isV2) {
                                        const parent = categoriesV2.find(p => p.code === value);
                                        const children = parent?.children || [];
                                        setSubOptions(children);
                                        setFormData(prev => ({ ...prev, category_v2: (children[0]?.code) || parent?.code }));
                                    } else {
                                        // clear any v2 child selection when switching to v1 parent
                                        setSubOptions([]);
                                        setFormData(prev => ({ ...prev, category_v2: undefined }));
                                    }
                                }}
                                placeholder={formData.isV2 ? 'Pilih kategori v2 (parent)' : 'Pilih kategori'}
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                className="w-full"
                            >
                                {formData.isV2
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
                        </Col>
                        <Col xs={24} sm={8} className="flex items-center gap-4">
                            <div>
                                <label className="block mb-1">Kategori v2</label>
                                <Switch checked={!!formData.isV2} onChange={(checked) => handleSelectChange('isV2', checked)} />
                            </div>
                        </Col>
                        <Col xs={24} sm={8}>
                            <label className="block mb-1">Tipe Produk</label>
                            <Select
                                name="product_type"
                                value={formData.product_type}
                                onChange={(value) => handleSelectChange('product_type', value)}
                                placeholder="Pilih tipe produk"
                                allowClear
                                className="w-full"
                            >
                                {productTypeOptions.map(type => (
                                    <Option key={type} value={type}>{type}</Option>
                                ))}
                            </Select>
                        </Col>
                    </Row>

                    {/* If using v2 show parent_code and sub_code */}
                    {formData.isV2 && (
                        <Row gutter={[8, 8]} className="flex flex-col sm:flex-row mt-2">
                            <Col xs={24} sm={12}>
                                <label className="block mb-1">Kategori v2 (Child)</label>
                                <Select
                                    name="category_v2"
                                    value={formData.category_v2}
                                    onChange={(value) => setFormData(prev => ({ ...prev, category_v2: value }))}
                                    placeholder="Pilih kategori v2"
                                    loading={categoriesV2Loading}
                                    className="w-full"
                                    showSearch
                                    optionFilterProp="children"
                                >
                                    {subOptions && subOptions.length > 0 ? (
                                        subOptions.map(sub => (
                                            <Option key={sub.code} value={sub.code}>
                                                {`${sub.code} - ${sub.name}`}
                                            </Option>
                                        ))
                                    ) : (
                                        // fallback: show currently selected parent as an option
                                        (() => {
                                            const parent = categoriesV2.find(p => p.code === formData.category_id);
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
                            </Col>
                        </Row>
                    )}
                </div>

                {/* INFORMASI PENJUALAN */}
                <div className="mb-4">
                    <h3 className="text-lg font-semibold">INFORMASI PENJUALAN</h3>
                    <Row gutter={[8, 8]} className="flex flex-col sm:flex-row">
                        <Col xs={24} sm={6}>
                            <label className="block mb-1">Harga Beli <span className="text-red-500">*</span></label>
                            <Input
                                type="number"
                                addonBefore="Rp."
                                name="buy_price"
                                value={formData.buy_price}
                                onChange={handleChange}
                                placeholder="Masukkan harga beli"
                                className="w-full"
                            />
                        </Col>
                        <Col xs={24} sm={6}>
                            <label className="block mb-1">Harga Jual <span className="text-red-500">*</span></label>
                            <Input
                                type="number"
                                addonBefore="Rp."
                                name="sell_price"
                                value={formData.sell_price}
                                onChange={handleChange}
                                placeholder="Masukkan harga jual"
                                className="w-full"
                            />
                        </Col>
                    </Row>
                    <Row gutter={[8, 8]} className="flex flex-col sm:flex-row">
                        <Col xs={24} sm={6}>
                            <label className="block mb-1">Stok Produk <span className="text-red-500">*</span></label>
                            <Input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                placeholder="Masukkan jumlah stok"
                                className="w-full"
                            />
                        </Col>
                        <Col xs={24} sm={6}>
                            <label className="block mb-1">Satuan <span className="text-red-500">*</span></label>
                            <Select
                                name="unit"
                                value={formData.unit}
                                onChange={(value) => handleSelectChange('unit', value)}
                                placeholder="Pilih satuan"
                                loading={unitLoading}
                                className="w-full"
                            >
                                {productUnits.map(unit => (
                                    <Option key={unit.id_product_unit} value={unit.id_product_unit}>
                                        {unit.unit_name}
                                    </Option>
                                ))}
                            </Select>
                        </Col>
                        <Col xs={24} sm={6}>
                            <label className="block mb-1">Kondisi Produk <span className="text-red-500">*</span></label>
                            <Radio.Group
                                onChange={(e) => setCondition(e.target.value)}
                                value={condition}
                            >
                                <Radio value="baru">Baru</Radio>
                                <Radio value="bekas">Bekas</Radio>
                            </Radio.Group>
                        </Col>
                        <Col xs={24} sm={6}>
                            <label className="block mb-1">Inventory Asset</label>
                            <Select
                                name="id_inventory_asset"
                                value={formData.id_inventory_asset}
                                onChange={(value) => handleSelectChange('id_inventory_asset', value)}
                                placeholder="Pilih akun persediaan"
                                loading={inventoryLoading}
                                className="w-full"
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                {inventoryAssets.map(asset => (
                                    <Option key={asset.id_asset} value={asset.id_asset}>
                                        {asset.account_name}
                                    </Option>
                                ))}
                            </Select>
                        </Col>
                    </Row>
                </div>
            </Card>

            <div className="flex justify-start sm:justify-end mt-8 space-x-4">
                <Button
                    type="primary"
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-md w-full sm:w-auto"
                    onClick={() => handleSubmit(false)}
                    loading={loading}
                    disabled={fetchLoading}
                >
                    Edit dan Tampilkan
                </Button>
            </div>
        </div>
    );
}

export default EditProduk;