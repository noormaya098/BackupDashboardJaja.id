import { Select, DatePicker, Input, Card, Form, Button, Row, Col, Table, notification, Modal, Spin, Checkbox, InputNumber } from "antd";
import { useState, useEffect } from "react";
import { TrashIcon, PlusIcon } from '@heroicons/react/24/solid';
import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useNavigate } from 'react-router-dom';
import './createOrder.css';
import { baseUrl } from "@/configs";
import { fetchAllProducts } from '@/utils/productUtils';

dayjs.extend(utc);
dayjs.extend(timezone);

const { Option } = Select;

const CreateOrder = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState('JAJAID');
    const [customerType, setCustomerType] = useState('0');
    const [selectedTenorType, setSelectedTenorType] = useState(null);
    const [selectedCreditDays, setSelectedCreditDays] = useState(null);
    const [dataSource, setDataSource] = useState([
        {
            key: "1",
            product_id: "",
            produk: "",
            deskripsi: "",
            qty: 1,
            unit: "",
            harga: 0,
            diskon: 0,
            pajak: 0,
            koin: 0,
            jumlah: 0,
            isPengajuan: selectedBrand === 'JAJAID' || selectedBrand === 'AUTO', // Auto-check for JAJAID or AUTO
            parentProductId: null,
            isTenor: false,
            billingDate: null,
            isDP: false,
            dpAmount: 0,
            dpDate: null,
            tenorCount: 1,
        },
    ]);
    const navigate = useNavigate();
    const [salesList, setSalesList] = useState([]);
    const [companyList, setCompanyList] = useState([]);
    const [productList, setProductList] = useState([]);
    const [statusList, setStatusList] = useState([]);
    const [warehouseList, setWarehouseList] = useState([]);
    const [fetchingStatus, setFetchingStatus] = useState(false);
    const [fetchingSales, setFetchingSales] = useState(false);
    const [fetchingCompany, setFetchingCompany] = useState(false);
    const [fetchingProducts, setFetchingProducts] = useState(false);
    const [fetchingWarehouses, setFetchingWarehouses] = useState(false);
    // Tambah state untuk no_referensi
    const [noReferensi, setNoReferensi] = useState("");

    useEffect(() => {
        const fetchStatus = async () => {
            setFetchingStatus(true);
            try {
                const requestOptions = { method: "GET", redirect: "follow" };
                const response = await fetch(`${baseUrl}/nimda/transaksi/get-transaksi-status`, requestOptions);
                const result = await response.json();
                // Tambahkan status custom jika belum ada
                let statusListApi = result.data || [];
                const customStatuses = [
                    { id_transaksi_status: 1001, name_status: 'Open' },
                    { id_transaksi_status: 1002, name_status: 'Partial' },
                    { id_transaksi_status: 1003, name_status: 'Closed' },
                ];
                customStatuses.forEach(cs => {
                    if (!statusListApi.some(s => s.name_status === cs.name_status)) {
                        statusListApi.push(cs);
                    }
                });
                setStatusList(statusListApi);
            } catch (error) {
                console.error("Error fetching status data:", error);
            } finally {
                setFetchingStatus(false);
            }
        };
        fetchStatus();
    }, []);

    useEffect(() => {
        const fetchSales = async () => {
            setFetchingSales(true);
            try {
                const requestOptions = { method: "GET", redirect: "follow" };
                const response = await fetch(`${baseUrl}/nimda/sales/get-sales`, requestOptions);
                const result = await response.json();
                setSalesList(result.data || []);
            } catch (error) {
                console.error("Error fetching sales data:", error);
                setSalesList([]);
            } finally {
                setFetchingSales(false);
            }
        };
        fetchSales();
    }, []);

    useEffect(() => {
        const fetchCompany = async () => {
            setFetchingCompany(true);
            try {
                const requestOptions = { method: "GET", redirect: "follow" };
                const limit = 1000;
                const response = await fetch(`${baseUrl}/nimda/company/get-company?limit=${limit}`, requestOptions);
                const result = await response.json();
                if (result.code === 200 && result.data) {
                    // Filter: keep only one Personal company (id_company: 1) and all non-Personal companies
                    const filteredData = result.data.filter(company => {
                        if (company.company_name === "Personal") {
                            return company.id_company === 1;
                        }
                        return true;
                    });
                    setCompanyList(filteredData);
                } else {
                    console.error(`Gagal mengambil data: ${result.message}`);
                }
            } catch (error) {
                console.error("Error fetching company data:", error);
            } finally {
                setFetchingCompany(false);
            }
        };
        fetchCompany();
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            setFetchingProducts(true);
            try {
                const token = localStorage.getItem('token');
                const allProducts = await fetchAllProducts(token, "exported=1");
                setProductList(allProducts);
            } catch (error) {
                console.error("Error fetching product data:", error);
                setProductList([]);
            } finally {
                setFetchingProducts(false);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        const fetchWarehouses = async () => {
            setFetchingWarehouses(true);
            try {
                const requestOptions = { method: "GET", redirect: "follow" };
                const response = await fetch(`${baseUrl}/nimda/warehouse/get-warehouse`, requestOptions);
                const result = await response.json();
                if (result.code === 200 && Array.isArray(result.data)) {
                    setWarehouseList(result.data);
                } else {
                    console.error("Data warehouse tidak valid:", result);
                    setWarehouseList([]);
                }
            } catch (error) {
                console.error("Error fetching warehouse data:", error);
                setWarehouseList([]);
            } finally {
                setFetchingWarehouses(false);
            }
        };
        fetchWarehouses();
    }, []);

    useEffect(() => {
        const defaultBrand = salesList.length > 0 && salesList[0].brand ? salesList[0].brand : "JAJAID";
        form.setFieldsValue({
            platform: "DIRECT",
            id_sales: salesList.length > 0 ? salesList[0].id_sales : undefined,
            id_status: statusList.length > 0 ? 1 : undefined,
            payment_method: "transfer",
            b2b: "0",
            id_company: companyList.length > 0 ? 1 : undefined,
            title: "mr",
            brand: defaultBrand,
            rencana_tanggal_tagih: null,
            pesan_customer: "",
            id_warehouse: warehouseList.length > 0 ? warehouseList[0].id_warehouse : undefined,
            tgl_order: dayjs(),
        });
        // sync local customer type state with initial form value
        setCustomerType(form.getFieldValue('b2b') || "0");
        setSelectedBrand(defaultBrand);
    }, [salesList, companyList, statusList, warehouseList, form]);

    const handleCompanyChange = (value) => {
        const selectedCompany = companyList.find(company => company.id_company === value);
        if (selectedCompany) {
            form.setFieldsValue({
                email: selectedCompany.pic_email || "",
                no_telepon: selectedCompany.pic_phone || "",
                title: selectedCompany.pic_name ? "mr" : "mr",
                nama_depan: selectedCompany.pic_name ? selectedCompany.pic_name.split(" ")[0] : "",
                nama_belakang: selectedCompany.pic_name ? selectedCompany.pic_name.split(" ").slice(1).join(" ") : "",
            });
        } else {
            form.setFieldsValue({
                email: "",
                no_telepon: "",
                title: "mr",
                nama_depan: "",
                nama_belakang: "",
            });
        }
    };

    const handleInputChange = (index, field, value) => {
        const newData = [...dataSource];
        const currentRow = newData[index];

        if (field === "deskripsi") {
            newData[index][field] = value;
        } else if (field === "billingDate") {
            newData[index][field] = value ? value.format("YYYY-MM-DD") : null;
            if (selectedTenorType === 'monthly' && selectedBrand === 'AUTO') {
                updateMonthlyTenors(index, newData, value);
            } else if (selectedTenorType === 'credit' && selectedCreditDays) {
                // For credit mode, calculate from tgl_order
                const tglOrder = form.getFieldValue('tgl_order');
                const baseDate = tglOrder ? dayjs(tglOrder) : dayjs();
                newData[index][field] = baseDate.add(selectedCreditDays, 'day').format("YYYY-MM-DD");
            }
        } else if (field === "dpDate") {
            newData[index][field] = value ? value.format("YYYY-MM-DD") : null;
            if (selectedTenorType === 'monthly' && selectedBrand === 'AUTO' && value) {
                newData[index].billingDate = value.format("YYYY-MM-DD");
                updateMonthlyTenors(index, newData, value);
            }
        } else if (field === "qty" && !currentRow.isTenor) {
            const qty = parseInt(value) || 1;
            newData[index].qty = qty;
            const productId = currentRow.product_id;
            newData.forEach((item, idx) => {
                if (item.product_id === productId && (item.isDP || item.isTenor)) {
                    newData[idx].qty = qty;
                }
            });
            if (selectedTenorType === 'monthly' && selectedBrand === 'AUTO') {
                updateMonthlyTenors(index, newData);
            } else if (selectedTenorType === 'yearly') {
                updateYearlyTenors(index, newData);
            }
        } else if (field === "harga") {
            const harga = parseFloat(value) || 0;
            const productId = currentRow.product_id;
            const product = productList.find((p) => p.id === productId);
            const originalPrice = product ? parseFloat(product.sell_price) || 0 : 0;
            const qty = currentRow.qty || 1;

            if (selectedTenorType === 'yearly' && selectedBrand === 'AUTO') {
                // Allow free editing of harga for yearly tenors
                newData[index].harga = Number(harga.toFixed(2));
                newData[index].isDP = harga < originalPrice * qty && harga > 0 && !currentRow.isTenor;
                newData[index].deskripsi = newData[index].isDP ? "DP" : "";
                newData[index].dpAmount = newData[index].isDP ? harga : 0;
                updateYearlyTenors(index, newData);
            } else {
                const isDP = harga < originalPrice * qty && harga > 0 && !currentRow.isTenor;
                newData[index].isDP = isDP;
                newData[index].deskripsi = isDP ? "DP" : "";
                newData[index].dpAmount = isDP ? harga : 0;
                newData[index].harga = isDP ? harga : Number(harga.toFixed(2));
                if (selectedTenorType === 'monthly' && selectedBrand === 'AUTO') {
                    updateMonthlyTenors(index, newData);
                } else if (selectedTenorType === 'yearly') {
                    updateYearlyTenors(index, newData);
                }
            }
        } else if (field === "tenorCount") {
            const count = parseInt(value) || 1;
            newData[index].tenorCount = Math.max(1, Math.min(60, count));
            if (selectedTenorType === 'monthly' && selectedBrand === 'AUTO') {
                updateMonthlyTenors(index, newData);
            }
        } else if (field === "dpAmount") {
            const dp = parseFloat(value) || 0;
            const product = productList.find(p => p.id === currentRow.product_id);
            const originalPrice = product ? parseFloat(product.sell_price) || 0 : 0;
            const totalPrice = originalPrice * (currentRow.qty || 1);
            newData[index].dpAmount = dp > totalPrice ? totalPrice : dp;
            newData[index].isDP = dp > 0;
            newData[index].deskripsi = dp > 0 ? "DP" : "";
            newData[index].harga = dp > 0 ? dp : originalPrice;
            newData[index].dpDate = dp > 0 ? newData[index].dpDate : null;
            updateMonthlyTenors(index, newData);
        } else if (field === "isPengajuan") {
            newData[index].isPengajuan = value;
        } else {
            newData[index][field] = parseFloat(value) || 0;
        }
        setDataSource(newData);
    };

    const updateMonthlyTenors = (index, data, newBillingDate = null) => {
        const newData = [...data];
        const mainProduct = newData[index];
        if (!mainProduct.product_id) return;

        const product = productList.find(p => p.id === mainProduct.product_id);
        const originalPrice = product ? parseFloat(product.sell_price) || 0 : 0;
        const qty = mainProduct.qty || 1;
        const totalPrice = originalPrice * qty;
        const dpAmount = mainProduct.dpAmount || 0;
        const remainingPrice = totalPrice - dpAmount;
        const tenorCount = mainProduct.tenorCount || 1;
        const splitPrice = remainingPrice / tenorCount;

        const newRows = newData.filter(item => !(item.product_id === mainProduct.product_id && item.isTenor));

        newRows[index].harga = dpAmount > 0 ? dpAmount : Number(splitPrice.toFixed(2));
        newRows[index].isDP = dpAmount > 0;

        const startDate = newBillingDate || mainProduct.billingDate ? dayjs(mainProduct.billingDate) : dayjs();
        for (let i = 0; i < tenorCount; i++) {
            const tenorRow = {
                key: `${Date.now()}-${index}-${i}`,
                product_id: mainProduct.product_id,
                produk: mainProduct.produk,
                deskripsi: `Cicilan Bulan ${i + 1}`,
                qty: qty,
                unit: mainProduct.unit,
                harga: Number(splitPrice.toFixed(2)),
                diskon: 0,
                pajak: mainProduct.pajak || 0,
                koin: 0,
                jumlah: 0,
                isPengajuan: false,
                parentProductId: mainProduct.product_id,
                isTenor: true,
                billingDate: i === 0 ? startDate.format("YYYY-MM-DD") : startDate.add(i, 'month').format("YYYY-MM-DD"), // First tenor uses billingDate directly
                isDP: false,
                dpAmount: 0,
                dpDate: null,
                tenorCount: 0,
            };
            newRows.splice(index + 1 + i, 0, tenorRow);
        }
        setDataSource(newRows);
    };

    const updateYearlyTenors = (index, data) => {
        const newData = [...data];
        const mainProduct = newData[index];
        if (!mainProduct.product_id) return;

        const product = productList.find(p => p.id === mainProduct.product_id);
        const originalPrice = product ? parseFloat(product.sell_price) || 0 : 0;
        const qty = mainProduct.qty || 1;
        const totalPrice = originalPrice * qty;

        // Collect all rows related to this product
        const relatedRows = newData.filter(item => item.product_id === mainProduct.product_id);
        const dpRows = relatedRows.filter(item => item.isDP);
        const tenorRows = relatedRows.filter(item => item.isTenor);
        const mainRow = relatedRows.find(item => !item.isDP && !item.isTenor);

        // Calculate total DP amount
        const dpAmount = dpRows.reduce((sum, item) => sum + item.harga * (item.qty || 1), 0);

        // Allow main row and tenor rows to keep their manually set prices
        // Only update quantities to sync with main row
        newData.forEach((item, idx) => {
            if (item.product_id === mainProduct.product_id && (item.isTenor || item.isDP)) {
                newData[idx].qty = qty;
            }
        });

        setDataSource(newData);
    };

    const handleProductChange = (value, index) => {
        const selectedProduct = productList.find((product) => product.id === value);
        if (selectedProduct) {
            const newData = [...dataSource];
            const productId = selectedProduct.id;
            const originalPrice = parseFloat(selectedProduct.sell_price) || 0;
            const qty = newData[index].qty || 1;

            // Calculate billing date for credit mode based on tgl_order
            let billingDateForCredit = null;
            if (selectedTenorType === 'credit' && selectedCreditDays) {
                const tglOrder = form.getFieldValue('tgl_order');
                const baseDate = tglOrder ? dayjs(tglOrder) : dayjs();
                billingDateForCredit = baseDate.add(selectedCreditDays, 'day').format("YYYY-MM-DD");
            }

            newData[index] = {
                ...newData[index],
                product_id: productId,
                produk: selectedProduct.name,
                harga: originalPrice,
                qty: qty,
                unit: selectedProduct.unit || "Pcs",
                isDP: false,
                dpAmount: 0,
                dpDate: null,
                deskripsi: "",
                isPengajuan: selectedBrand === 'JAJAID' || selectedBrand === 'AUTO', // Auto-check for JAJAID or AUTO
                billingDate: billingDateForCredit,
            };

            if (selectedTenorType === 'monthly' && selectedBrand === 'AUTO') {
                updateMonthlyTenors(index, newData);
            } else if (selectedTenorType === 'yearly') {
                updateYearlyTenors(index, newData);
            }
            setDataSource(newData);
        }
    };

    const handleFeeCheckboxChange = (index, checked) => {
        handleInputChange(index, "isPengajuan", checked);
    };

    const handleAddTenor = (index) => {
        const newData = [...dataSource];
        const mainProduct = newData[index];
        if (mainProduct.isTenor) {
            notification.warning({
                message: "Tidak Bisa Tambah Tenor",
                description: "Tenor hanya bisa ditambahkan pada baris non-tenor.",
            });
            return;
        }
        const tenorCount = newData.filter(item => item.product_id === mainProduct.product_id && item.isTenor).length;
        if (tenorCount >= 5 && selectedTenorType === 'yearly') {
            notification.warning({
                message: "Batas Tenor Tercapai",
                description: "Maksimum 5 tenor tahunan per produk.",
            });
            return;
        }

        const product = productList.find(p => p.id === mainProduct.product_id);
        const originalPrice = product ? parseFloat(product.sell_price) || 0 : 0;
        const qty = mainProduct.qty || 1;
        const totalPrice = originalPrice * qty;
        const dpRows = newData.filter(item => item.product_id === mainProduct.product_id && item.isDP);
        const dpAmount = dpRows.reduce((sum, item) => sum + item.harga * (item.qty || 1), 0);
        const remainingPrice = totalPrice - dpAmount;
        const totalPayments = (newData.find(item => item.product_id === mainProduct.product_id && !item.isDP && !item.isTenor) ? 1 : 0) + tenorCount + 1;
        const splitPrice = remainingPrice / totalPayments;

        newData.forEach((item, idx) => {
            if (item.product_id === mainProduct.product_id && !item.isDP && !item.isTenor) {
                newData[idx].harga = Number(splitPrice.toFixed(2)) / (item.qty || 1);
                newData[idx].qty = qty;
            } else if (item.product_id === mainProduct.product_id && item.isTenor) {
                newData[idx].harga = Number(splitPrice.toFixed(2));
                newData[idx].qty = qty;
            }
        });

        const tenorRow = {
            key: `${Date.now()}-${index}`,
            product_id: mainProduct.product_id,
            produk: mainProduct.produk,
            deskripsi: `Tenor Tahun ${tenorCount + 2}`,
            qty: qty,
            unit: mainProduct.unit,
            harga: Number(splitPrice.toFixed(2)),
            diskon: 0,
            pajak: mainProduct.pajak || 0,
            koin: 0,
            jumlah: 0,
            isPengajuan: false,
            parentProductId: mainProduct.product_id,
            isTenor: true,
            billingDate: mainProduct.billingDate ? dayjs(mainProduct.billingDate).add(tenorCount + 1, 'year').format("YYYY-MM-DD") : null,
            isDP: false,
            dpAmount: 0,
            dpDate: null,
            tenorCount: 0,

        };
        newData.splice(index + 1 + tenorCount, 0, tenorRow);
        setDataSource(newData);
    };

    const handleDeleteRow = (index) => {
        const newData = [...dataSource];
        const deletedItem = newData[index];
        const productId = deletedItem.product_id;
        const product = productList.find(p => p.id === productId);
        const originalPrice = product ? parseFloat(product.sell_price) || 0 : 0;
        const nonTenorRows = newData.filter(item => item.product_id === productId && !item.isTenor);
        const totalQty = nonTenorRows.reduce((sum, item) => sum + (item.qty || 1), 0) - (deletedItem.isTenor ? 0 : deletedItem.qty || 1);
        const totalPrice = originalPrice * totalQty;

        if (!deletedItem.isTenor) {
            if (totalQty === 0) {
                const tenorIndices = newData
                    .map((item, idx) => item.product_id === productId && item.isTenor ? idx : -1)
                    .filter(idx => idx !== -1)
                    .sort((a, b) => b - a);
                tenorIndices.forEach(idx => newData.splice(idx, 1));
            }

            if (deletedItem.isDP) {
                const nextNonTenor = newData.find((item, idx) => item.product_id === productId && !item.isTenor && idx > index);
                if (nextNonTenor) {
                    const nextIndex = newData.indexOf(nextNonTenor);
                    newData[nextIndex].isDP = false;
                    newData[nextIndex].deskripsi = "";
                    newData[nextIndex].dpAmount = 0;
                    newData[nextIndex].dpDate = null;
                    const tenorCount = newData.filter(item => item.product_id === productId && item.isTenor).length;
                    const dpRows = newData.filter(item => item.product_id === productId && item.isDP && !item.isTenor);
                    const dpAmount = dpRows.reduce((sum, item) => sum + item.harga * (item.qty || 1), 0);
                    const totalPayments = (totalQty > 0 ? 1 : 0) + tenorCount;
                    const remainingPrice = totalPrice - dpAmount;
                    const splitPrice = totalPayments > 0 ? remainingPrice / totalPayments : remainingPrice;
                    newData[nextIndex].harga = Number(splitPrice.toFixed(2)) / (nextNonTenor.qty || 1);
                    newData.forEach((item, idx) => {
                        if (item.product_id === productId && item.isTenor) {
                            newData[idx].harga = Number(splitPrice.toFixed(2));
                            newData[idx].qty = totalQty > 0 ? nextNonTenor.qty : 1;
                        }
                    });
                }
            } else {
                const dpRows = newData.filter(item => item.product_id === productId && item.isDP);
                const dpAmount = dpRows.reduce((sum, item) => sum + item.harga * (item.qty || 1), 0);
                const nonDPRow = newData.find((item, idx) => item.product_id === productId && !item.isDP && !item.isTenor && idx > index);
                if (nonDPRow) {
                    const nonDPIndex = newData.indexOf(nonDPRow);
                    const tenorCount = newData.filter(item => item.product_id === productId && item.isTenor).length;
                    const totalPayments = tenorCount + 1;
                    const remainingPrice = totalPrice - dpAmount;
                    const splitPrice = totalPayments > 0 ? remainingPrice / totalPayments : remainingPrice;
                    newData[nonDPIndex].harga = Number(splitPrice.toFixed(2)) / (nonDPRow.qty || 1);
                    newData.forEach((item, idx) => {
                        if (item.product_id === productId && item.isTenor) {
                            newData[idx].harga = Number(splitPrice.toFixed(2));
                            newData[idx].qty = nonDPRow.qty;
                        }
                    });
                } else {
                    const tenorCount = newData.filter(item => item.product_id === productId && item.isTenor).length;
                    const remainingPrice = totalPrice - dpAmount;
                    const splitPrice = tenorCount > 0 ? remainingPrice / tenorCount : 0;
                    newData.forEach((item, idx) => {
                        if (item.product_id === productId && item.isTenor) {
                            newData[idx].harga = Number(splitPrice.toFixed(2));
                            newData[idx].qty = totalQty > 0 ? nonTenorRows[0]?.qty || 1 : 1;
                        }
                    });
                }
            }
        } else {
            const dpRows = newData.filter(item => item.product_id === productId && item.isDP);
            const nonDPRow = newData.find(item => item.product_id === productId && !item.isDP && !item.isTenor);
            const dpAmount = dpRows.reduce((sum, item) => sum + item.harga * (item.qty || 1), 0);
            const remainingPrice = totalPrice - dpAmount;
            const tenorCountAfterDeletion = newData.filter(item => item.product_id === productId && item.isTenor).length - 1;
            const totalPayments = tenorCountAfterDeletion + (nonDPRow ? 1 : 0);
            const splitPrice = totalPayments > 0 ? remainingPrice / totalPayments : remainingPrice;
            newData.forEach((item, idx) => {
                if (item.product_id === productId && !item.isDP && !item.isTenor) {
                    newData[idx].harga = Number(splitPrice.toFixed(2)) / (item.qty || 1);
                    newData[idx].qty = nonDPRow?.qty || 1;
                } else if (item.product_id === productId && item.isTenor) {
                    newData[idx].harga = Number(splitPrice.toFixed(2));
                    newData[idx].qty = nonDPRow?.qty || 1;
                }
            });
        }
        newData.splice(index, 1);
        setDataSource(newData);
    };

    const calculateJumlah = (record) => {
        const harga = Number(record.harga || 0);
        const qty = Number(record.isTenor ? record.qty || 1 : record.qty || 1);
        const diskon = Number(record.diskon || 0);
        const pajak = Number(record.pajak || 0);
        const baseAmount = harga * qty;
        const discountedAmount = baseAmount * (1 - diskon / 100);
        const total = discountedAmount * (1 + pajak / 100);
        return Number(total.toFixed(2));
    };

    const calculateGrandTotal = () => {
        let total = 0;
        const uniqueProductIds = [...new Set(dataSource.map(item => item.product_id).filter(id => id))];

        uniqueProductIds.forEach(productId => {
            const productRows = dataSource.filter(item => item.product_id === productId);
            const product = productList.find(p => p.id === productId);
            const originalPrice = product ? parseFloat(product.sell_price) || 0 : 0;
            const mainRow = productRows.find(item => !item.isTenor && !item.isDP) || productRows[0];

            if (selectedBrand === 'AUTO' && selectedTenorType === 'monthly') {
                // For AUTO brand with monthly tenor, use the original price * quantity
                const qty = mainRow ? (mainRow.qty || 1) : 1;
                const productTotal = originalPrice * qty;
                total += productTotal;
            } else {
                // For other cases, sum the calculated amounts
                const productTotal = productRows.reduce((sum, item) => {
                    return sum + calculateJumlah(item);
                }, 0);
                total += productTotal;
            }
        });

        return Number(total.toFixed(2));
    };

    const handleSalesChange = (value) => {
        const selectedSales = salesList.find(sales => sales.id_sales === value);
        const brandValue = selectedSales ? selectedSales.brand : "JAJAID";
        form.setFieldsValue({
            brand: brandValue,
            rencana_tanggal_tagih: null,
        });
        setSelectedBrand(brandValue);
        setSelectedTenorType(null);
        setSelectedCreditDays(null);
        form.validateFields(['rencana_tanggal_tagih']);
        const newData = dataSource.map(item => ({
            ...item,
            isTenor: false,
            billingDate: null,
            dpAmount: 0,
            dpDate: null,
            isDP: false,
            deskripsi: "",
            product_id: "",
            produk: "",
            harga: 0,
            qty: 1,
            tenorCount: 1,
            isPengajuan: brandValue === 'JAJAID' || brandValue === 'AUTO', // Auto-check for JAJAID or AUTO
        }));
        setDataSource(newData);
    };

    const handleTenorTypeChange = (value) => {
        setSelectedTenorType(value);
        if (value !== 'credit') {
            setSelectedCreditDays(null);
            const newData = dataSource.map(item => ({
                ...item,
                isTenor: false,
                billingDate: null,
                dpAmount: 0,
                dpDate: null,
                isDP: false,
                deskripsi: "",
                product_id: "",
                produk: "",
                harga: 0,
                qty: 1,
                tenorCount: 1,
                isPengajuan: selectedBrand === 'JAJAID' || selectedBrand === 'AUTO', // Auto-check for JAJAID or AUTO
            }));
            setDataSource(newData);
        } else {
            // Don't reset data when switching to credit mode, just clear tenor flags
            const newData = dataSource.map(item => ({
                ...item,
                isTenor: false,
            }));
            setDataSource(newData);
        }
    };

    const handleCreditDaysChange = (value) => {
        setSelectedCreditDays(value);
        // Get tgl_order from form
        const tglOrder = form.getFieldValue('tgl_order');
        const baseDate = tglOrder ? dayjs(tglOrder) : dayjs();

        // Update billing dates for existing items (relative to tgl_order, not today)
        const newData = dataSource.map(item => {
            if (item.product_id && selectedTenorType === 'credit') {
                return {
                    ...item,
                    billingDate: value ? baseDate.add(value, 'day').format("YYYY-MM-DD") : null,
                };
            }
            return item;
        });
        setDataSource(newData);
    };

    const showConfirmModal = () => {
        // Check No Referensi first - field must be filled
        const noRef = form.getFieldValue('no_referensi') || noReferensi;
        if (!noRef || String(noRef).trim() === '') {
            // Modern alert modal with blue OK button
            Modal.info({
                title: 'No Referensi diperlukan',
                content: 'Silakan isi No Referensi sebelum menyimpan order.',
                okText: 'OK',
                okButtonProps: { className: 'bg-blue-500 hover:bg-blue-600 text-white' },
            });
            return;
        }

        setModalVisible(true);
    };

    const handleModalOk = async () => {
        setConfirmLoading(true);
        await handleSubmit();
        setConfirmLoading(false);
        setModalVisible(false);
    };

    const handleModalCancel = () => {
        setModalVisible(false);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const values = await form.validateFields();
            const insufficientStock = [];

            // Validate stock for non-tenor rows and collect insufficient stock messages
            dataSource.forEach(item => {
                if (!item.isTenor && !item.isPengajuan) { // Only check stock if isPengajuan is false
                    const product = productList.find(p => p.id === item.product_id);
                    if (product && item.qty > product.stock) {
                        insufficientStock.push({
                            product_id: item.product_id,
                            name: item.produk,
                            qtyRequested: item.qty,
                            stockAvailable: product.stock
                        });
                    }
                }
            });

            // Show warning for insufficient stock, but don't block submission
            if (insufficientStock.length > 0) {
                const message = insufficientStock.map(item =>
                    `Stok barang ${item.name} (ID: ${item.product_id}) kurang. Diminta: ${item.qtyRequested}, Tersedia: ${item.stockAvailable}`
                ).join('\n');
                notification.warning({
                    message: "Stok Tidak Cukup",
                    description: `Tolong buat pengajuan karena:\n${message}`,
                    duration: 3
                });
            }

            const transaksiDetails = [];
            const processedProducts = new Set();

            dataSource
                .filter(item => item.product_id)
                .forEach((item, idx) => {
                    const product = productList.find(p => p.id === item.product_id);
                    const originalPrice = product ? parseFloat(product.sell_price) || 0 : 0;
                    const qty = parseInt(item.qty || 1);
                    const totalPrice = originalPrice * qty;
                    const dpAmount = parseFloat(item.dpAmount || 0);
                    const tenorCount = parseInt(item.tenorCount || 1);
                    const remainingPrice = totalPrice - dpAmount;
                    const monthlyInstallment = tenorCount > 0 ? remainingPrice / tenorCount : 0;
                    const startDate = item.billingDate ? dayjs(item.billingDate) : dayjs();

                    // === Cicilan Bulanan ===
                    if (selectedBrand === 'AUTO' && selectedTenorType === 'monthly') {
                        if (!item.isTenor && !processedProducts.has(item.product_id)) {
                            // DP jika ada
                            if (dpAmount > 0) {
                                transaksiDetails.push({
                                    product_id: item.product_id,
                                    product_name: item.produk || "",
                                    product_description: "Down Payment",
                                    quantity: qty,
                                    rate: dpAmount / qty,
                                    discount_type: "percent",
                                    discount: parseFloat(item.diskon || 0),
                                    tax_type: item.pajak ? `${parseFloat(item.pajak).toFixed(2)}` : "0.00",
                                    price: dpAmount / qty,
                                    isPengajuan: item.isPengajuan,
                                    isDP: true,
                                    tanggal_tagih: item.dpDate ? dayjs(item.dpDate).format("YYYY-MM-DD") : startDate.format("YYYY-MM-DD"),
                                    tanggal_dp: item.dpDate ? dayjs(item.dpDate).format("YYYY-MM-DD") : null,
                                    created_date: values.tgl_order ? values.tgl_order.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
                                });
                            }
                            // Cicilan bulanan
                            const cicilanPerBulan = Number(monthlyInstallment.toFixed(2));
                            const ratePerUnit = qty > 0 ? cicilanPerBulan / qty : cicilanPerBulan;
                            for (let i = 0; i < tenorCount; i++) {
                                transaksiDetails.push({
                                    product_id: item.product_id,
                                    product_name: item.produk || "",
                                    product_description: `Cicilan Bulan ${i + 1}`,
                                    quantity: qty,
                                    rate: ratePerUnit,
                                    discount_type: "percent",
                                    discount: parseFloat(item.diskon || 0),
                                    tax_type: item.pajak ? `${parseFloat(item.pajak).toFixed(2)}` : "0.00",
                                    price: ratePerUnit,
                                    isPengajuan: item.isPengajuan,
                                    isDP: false,
                                    tanggal_tagih: startDate.add(i, 'month').format("YYYY-MM-DD"),
                                    tanggal_dp: null,
                                    created_date: values.tgl_order ? values.tgl_order.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
                                });
                            }
                            processedProducts.add(item.product_id);
                        }
                    } else {
                        // Transaksi biasa/cash/tenor tahunan
                        transaksiDetails.push({
                            product_id: item.product_id,
                            product_name: item.produk || "",
                            product_description: item.deskripsi || "",
                            quantity: qty,
                            rate: parseFloat(item.harga || 0),
                            discount_type: "percent",
                            discount: parseFloat(item.diskon || 0),
                            tax_type: item.pajak ? `${parseFloat(item.pajak).toFixed(2)}` : "0.00",
                            price: parseFloat(item.harga || 0),
                            isPengajuan: item.isPengajuan,
                            isDP: item.isDP || false,
                            tanggal_tagih: item.billingDate ? dayjs(item.billingDate).format("YYYY-MM-DD") : null,
                            tanggal_dp: item.dpDate ? dayjs(item.dpDate).format("YYYY-MM-DD") : null,
                            created_date: values.tgl_order ? values.tgl_order.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
                        });
                        if (item.isPengajuan) {
                            processedProducts.add(item.product_id);
                        }
                    }
                });

            // Calculate subtotal
            const subtotal = transaksiDetails.reduce((sum, item) => {
                const baseAmount = item.price * (item.quantity || 1);
                const discountedAmount = baseAmount * (1 - (item.discount || 0) / 100);
                return sum + discountedAmount * (1 + (parseFloat(item.tax_type) || 0) / 100);
            }, 0);

            const selectedStatus = statusList.find(status => status.id_transaksi_status === values.id_status);
            const statusTransaksi = selectedStatus ? selectedStatus.name_status : "Booked";

            let batasPembayaran;
            if (values.brand === "AUTO" && selectedTenorType === 'credit' && selectedCreditDays) {
                // For credit, batas_pembayaran is based on tgl_order + credit days
                const tglOrder = values.tgl_order ? dayjs(values.tgl_order) : dayjs();
                batasPembayaran = tglOrder.add(selectedCreditDays, 'day').format("YYYY-MM-DD");
            } else if (values.brand === "AUTO") {
                batasPembayaran = values.rencana_tanggal_tagih
                    ? values.rencana_tanggal_tagih.format("YYYY-MM-DD")
                    : dayjs().add(30, 'day').format("YYYY-MM-DD");
            } else {
                batasPembayaran = values.tgl_order
                    ? values.tgl_order.add(30, 'day').format("YYYY-MM-DD")
                    : dayjs().add(30, 'day').format("YYYY-MM-DD");
            }

            // created_date dan created_time harus mengikuti tgl_order
            const tglOrder = values.tgl_order ? dayjs(values.tgl_order) : dayjs();
            const payload = {
                billing_id: "BILL123",
                faktur: "FAKTUR123",
                id_toko: 103,
                waktu_pengiriman: "setiap saat",
                batas_pembayaran: batasPembayaran,
                created_date: tglOrder.format("YYYY-MM-DD"),
                created_time: tglOrder.tz("Asia/Jakarta").format("HH:mm:ss"),
                nama_customer: values.nama_belakang ? `${values.nama_depan} ${values.nama_belakang}` : values.nama_depan,
                subtotal: Number(subtotal.toFixed(2)),
                diskon_voucher_toko: 0,
                fee: 0,
                email: values.email || "",
                tax_amount: 0,
                total_tagihan: Number(subtotal.toFixed(2)),
                total_pembayaran: Number(subtotal.toFixed(2)),
                id_status: values.id_status || 1,
                id_sales: values.id_sales || 1,
                id_company: values.id_company || 6,
                platform: values.platform || "DIRECT",
                brand: values.brand || "",
                status_transaksi: statusTransaksi,
                koin: 0,
                biaya_asuransi: 0,
                is_erlangga: values.b2b === "1" ? 1 : 0,
                warehouse_id: values.id_warehouse || 7,
                transaksiDetails: transaksiDetails,
                alamat_pengiriman: values.alamat_pengiriman || "testinggg ya",
                nama_penerima: values.nama_penerima || "testinggg ya",
                telp_penerima: values.telp_penerima || "",
                pengiriman: "Raja Cepat Nusantara",
                desc_pengiriman: "RACE City Courier",
                pesan_customer: values.pesan_customer || "testinggg keterangan",
                no_referensi: noReferensi,
            };

            console.log("Payload sent to API:", JSON.stringify(payload, null, 2));

            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            const token = localStorage.getItem("token");
            if (token) {
                myHeaders.append("Authorization", token.startsWith("Bearer ") ? token : `${token}`);
            }
            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: JSON.stringify(payload),
                redirect: "follow"
            };

            const response = await fetch(`${baseUrl}/nimda/transaksi/create-transaksi`, requestOptions);
            const result = await response.json();
            console.log("API Response:", JSON.stringify(result, null, 2));

            if (response.ok) {
                const orderId = result.data?.transaksi?.id_data;
                if (orderId) {
                    notification.success({
                        message: "Transaksi Berhasil",
                        description: "Data transaksi berhasil disimpan."
                    });
                    navigate(`/dashboard/order/detail-order/${orderId}`);
                } else {
                    notification.error({
                        message: "Redirect Gagal",
                        description: "ID transaksi tidak ditemukan dalam response."
                    });
                }
            } else {
                notification.error({
                    message: "Transaksi Gagal",
                    description: result.message || "Terjadi kesalahan saat menyimpan transaksi."
                });
            }
        } catch (error) {
            console.error("Error submitting order:", error);
            if (error.errorFields) {
                const missingFields = error.errorFields.map(field => field.errors[0]).join('\n');
                notification.error({
                    message: "Form Tidak Lengkap",
                    description: `Harap lengkapi field berikut:\n${missingFields}`,
                    duration: 5
                });
            } else {
                notification.error({
                    message: "Transaksi Gagal",
                    description: "Terjadi kesalahan saat menyimpan transaksi."
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: "No",
            dataIndex: "index",
            width: 20,
            render: (_, __, index) => index + 1,
        },
        {
            title: "",
            dataIndex: "isPengajuan",
            width: 20,
            render: (_, record, index) => (
                !record.isTenor && (
                    <Checkbox
                        checked={record.isPengajuan}
                        onChange={(e) => handleFeeCheckboxChange(index, e.target.checked)}
                    />
                )
            ),
        },
        {
            title: "Produk",
            dataIndex: "produk",
            width: 300,
            render: (_, record, index) => (
                record.isTenor ? (
                    <span>{record.produk}</span>
                ) : (
                    <Select
                        showSearch
                        placeholder="Pilih Produk"
                        value={record.produk ? record.produk : undefined}
                        onChange={(value) => handleProductChange(value, index)}
                        optionFilterProp="children"
                        style={{ width: '100%' }}
                        dropdownStyle={{ minWidth: 600 }}
                    >
                        {productList.map((product) => (
                            <Option key={product.id} value={product.id}>
                                {product.product_code} - {product.name}
                            </Option>
                        ))}
                    </Select>
                )
            ),
        },
        {
            title: "Deskripsi",
            dataIndex: "deskripsi",
            width: 200,
            render: (_, record, index) => (
                <Input.TextArea
                    value={record.deskripsi}
                    onChange={(e) => handleInputChange(index, "deskripsi", e.target.value)}
                    placeholder={record.isDP ? "DP" : record.isTenor ? "" : "Deskripsi"}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                />
            ),
        },
        {
            title: "Rencana Tanggal Tagih",
            dataIndex: "billingDate",
            width: 200,
            render: (_, record, index) => {
                if (selectedBrand === 'AUTO' && selectedTenorType === 'credit') {
                    // Untuk kredit, tampilkan tanggal tapi readonly
                    if (selectedCreditDays) {
                        const tglOrder = form.getFieldValue('tgl_order') || dayjs();
                        const baseDate = dayjs.isDayjs(tglOrder) ? tglOrder : dayjs(tglOrder);
                        const calculatedDate = baseDate.add(selectedCreditDays, 'day').format("DD/MM/YYYY");
                        return <span className="font-medium text-blue-600">{calculatedDate}</span>;
                    }
                    return <span>-</span>;
                } else if (selectedBrand === 'AUTO' && selectedTenorType !== 'cash') {
                    return (
                        <DatePicker
                            format="DD/MM/YYYY"
                            value={record.billingDate ? dayjs(record.billingDate) : null}
                            onChange={(date) => handleInputChange(index, "billingDate", date)}
                            placeholder="Pilih Tanggal"
                            style={{ width: '100%' }}
                        />
                    );
                }
                return null;
            },
        },
        {
            title: "Stok",
            dataIndex: "stock",
            width: 70,
            render: (_, record) => {
                if (record.isTenor) {
                    return null;
                }
                const product = productList.find(p => p.id === record.product_id);
                return <span>{product ? product.stock : 0} pcs</span>;
            },
        },
        {
            title: "Qty",
            dataIndex: "qty",
            width: 100,
            render: (_, record, index) => (
                !record.isTenor && (
                    <Input
                        value={record.qty}
                        onChange={(e) => handleInputChange(index, "qty", e.target.value)}
                        placeholder="0"
                        style={{ width: '100%' }}
                    />
                )
            ),
        },
        {
            title: "Harga",
            dataIndex: "harga",
            width: 120,
            render: (_, record, index) => (
                <div className="custom-number-input">
                    <Input
                        type="text"
                        inputMode="numeric"
                        value={
                            record.harga !== undefined && record.harga !== null
                                ? Number(record.harga).toLocaleString('id-ID', {
                                    minimumFractionDigits: Number(record.harga % 1 !== 0 ? 2 : 0),
                                    maximumFractionDigits: 2,
                                })
                                : ''
                        }
                        onChange={(e) => {
                            let rawValue = e.target.value.replace(/[^\d,]/g, '');
                            rawValue = rawValue.replace(/\./g, '');
                            rawValue = rawValue.replace(',', '.');
                            const numericValue = rawValue ? parseFloat(rawValue) : 0;
                            handleInputChange(index, "harga", isNaN(numericValue) ? 0 : numericValue);
                        }}
                        placeholder="0"
                        style={{
                            width: '100%',
                            textAlign: 'right',
                        }}
                    />
                </div>
            ),
        },
        {
            title: "Diskon %",
            dataIndex: "diskon",
            width: 80,
            render: (_, record, index) => (
                <Input
                    type="text"
                    value={record.diskon}
                    onChange={(e) => handleInputChange(index, "diskon", e.target.value)}
                    placeholder="0"
                    style={record.isTenor ? { width: '100%', backgroundColor: '#e6f7ff' } : { width: '100%' }}
                />
            ),
        },
        {
            title: "PPN",
            dataIndex: "pajak",
            width: 120,
            render: (_, record, index) => (
                <Select
                    value={record.pajak !== undefined && record.pajak !== null ? Number(record.pajak) : 0}
                    onChange={(val) => handleInputChange(index, 'pajak', val)}
                    className="w-full"
                >
                    <Option value={11}>Ya (11%)</Option>
                    <Option value={0}>Tidak</Option>
                </Select>
            ),
        },
        {
            title: "Jumlah",
            dataIndex: "jumlah",
            width: 120,
            render: (_, record) => (
                <span>{calculateJumlah(record).toLocaleString('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: calculateJumlah(record) % 1 !== 0 ? 2 : 0,
                    maximumFractionDigits: calculateJumlah(record) % 1 !== 0 ? 2 : 0
                })}</span>
            ),
        },
        {
            title: "Aksi",
            dataIndex: "aksi",
            width: 150,
            render: (_, __, index) => {
                const record = dataSource[index];
                const tenorCount = dataSource.filter(item => item.product_id === record.product_id && item.isTenor).length;
                return (
                    <div className="flex gap-2">
                        <Button
                            type="link"
                            danger
                            onClick={() => handleDeleteRow(index)}
                            style={{ padding: 0 }}
                        >
                            <TrashIcon className="w-4 h-4 text-red-500" />
                        </Button>
                        {selectedBrand === 'AUTO' && !record.isTenor && selectedTenorType === 'yearly' && tenorCount < 5 && (
                            <Button
                                type="link"
                                onClick={() => handleAddTenor(index)}
                                style={{ padding: 0 }}
                            >
                                <PlusIcon className="w-4 h-4 text-blue-500" />
                                <span className="text-blue-500">Tenor</span>
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];

    const handleAddRow = () => {
        // Calculate billing date for credit mode based on tgl_order
        let billingDateForCredit = null;
        if (selectedTenorType === 'credit' && selectedCreditDays) {
            const tglOrder = form.getFieldValue('tgl_order');
            const baseDate = tglOrder ? dayjs(tglOrder) : dayjs();
            billingDateForCredit = baseDate.add(selectedCreditDays, 'day').format("YYYY-MM-DD");
        }

        const newRow = {
            key: `${Date.now()}-${dataSource.length + 1}`,
            product_id: "",
            produk: "",
            deskripsi: "",
            qty: 1,
            unit: "",
            harga: 0,
            diskon: 0,
            pajak: 0,
            koin: 0,
            jumlah: 0,
            isPengajuan: selectedBrand === 'JAJAID' || selectedBrand === 'AUTO', // Auto-check for JAJAID or AUTO
            parentProductId: null,
            isTenor: false,
            billingDate: billingDateForCredit,
            isDP: false,
            dpAmount: 0,
            dpDate: null,
            tenorCount: selectedBrand === 'AUTO' && selectedTenorType === 'monthly' ? 1 : 0,
        };
        setDataSource([...dataSource, newRow]);
    };

    const renderMonthlyTenor = (record, index) => {
        const product = productList.find(p => p.id === record.product_id);
        const stock = product ? product.stock : 0;
        const originalPrice = product ? parseFloat(product.sell_price) || 0 : 0;
        const qty = record.qty || 1;
        const totalPrice = originalPrice * qty;
        const dpAmount = record.dpAmount || 0;
        const tenorCount = record.tenorCount || 1;
        const monthlyInstallment = tenorCount > 0 ? (totalPrice - dpAmount) / tenorCount : 0;

        return (
            <div className="border rounded-lg p-6 mb-6 bg-white shadow-md">
                <Row gutter={[24, 24]}>
                    <Col xs={24} md={12}>
                        <div className="space-y-4">
                            <Form.Item label="Produk" className="mb-0">
                                <Select
                                    showSearch
                                    placeholder="Pilih Produk"
                                    value={record.produk ? record.produk : undefined}
                                    onChange={(value) => handleProductChange(value, index)}
                                    optionFilterProp="children"
                                    className="w-full"
                                >
                                    {productList.map((item) => (
                                        <Option key={item.id} value={item.id}>
                                            {item.product_code} - {item.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Form.Item label="Stok" className="mb-0">
                                <span>{stock} pcs</span>
                            </Form.Item>
                            <Form.Item label="Pengajuan?" className="mb-0">
                                <Checkbox
                                    checked={record.isPengajuan}
                                    onChange={(e) => handleFeeCheckboxChange(index, e.target.checked)}
                                />
                            </Form.Item>
                            <Form.Item label="Deskripsi" className="mb-0">
                                <Input.TextArea
                                    value={record.deskripsi}
                                    onChange={e => handleInputChange(index, 'deskripsi', e.target.value)}
                                    placeholder="Deskripsi cicilan bulanan"
                                    autoSize={{ minRows: 1, maxRows: 4 }}
                                />
                            </Form.Item>
                            <Form.Item label="Uang Muka (DP)" className="mb-0">
                                <Input
                                    value={record.dpAmount ? Number(record.dpAmount).toLocaleString('id-ID') : ''}
                                    onChange={(e) => {
                                        let rawValue = e.target.value.replace(/[^\d,]/g, '').replace(/\./g, '').replace(',', '.');
                                        const numericValue = rawValue ? parseFloat(rawValue) : 0;
                                        handleInputChange(index, "dpAmount", isNaN(numericValue) ? 0 : numericValue);
                                    }}
                                    placeholder="0"
                                    className="w-full"
                                    prefix="Rp"
                                />
                            </Form.Item>
                            <Form.Item label="Tanggal DP" className="mb-0">
                                <DatePicker
                                    format="DD/MM/YYYY"
                                    value={record.dpDate ? dayjs(record.dpDate) : null}
                                    onChange={(date) => handleInputChange(index, "dpDate", date)}
                                    className="w-full"
                                    placeholder="Pilih Tanggal DP"
                                    disabled={dpAmount <= 0}
                                />
                            </Form.Item>
                            <Form.Item label="PPN" className="mb-0">
                                <Select
                                    value={record.pajak ? Number(record.pajak) : 0}
                                    onChange={(val) => handleInputChange(index, 'pajak', val)}
                                    className="w-full"
                                >
                                    <Option value={11}>Ya (Include PPN 11%)</Option>
                                    <Option value={0}>Tidak</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item label="Jumlah Tenor (Bulan)" className="mb-0">
                                <div className="flex items-center space-x-2">
                                    <Button
                                        icon={<MinusCircleOutlined />}
                                        onClick={() => handleInputChange(index, "tenorCount", record.tenorCount - 1)}
                                        disabled={record.tenorCount <= 1}
                                        className="border-gray-300"
                                    />
                                    <InputNumber
                                        min={1}
                                        max={60}
                                        value={record.tenorCount}
                                        onChange={(value) => handleInputChange(index, "tenorCount", value)}
                                        className="w-20 text-center"
                                    />
                                    <Button
                                        icon={<PlusCircleOutlined />}
                                        onClick={() => handleInputChange(index, "tenorCount", record.tenorCount + 1)}
                                        disabled={record.tenorCount >= 60}
                                        className="border-gray-300"
                                    />
                                </div>
                            </Form.Item>
                            <Form.Item label="Tanggal Tagih Pertama" className="mb-0">
                                <DatePicker
                                    format="DD/MM/YYYY"
                                    value={record.billingDate ? dayjs(record.billingDate) : null}
                                    onChange={(date) => handleInputChange(index, "billingDate", date)}
                                    className="w-full"
                                    placeholder="Pilih Tanggal"
                                />
                            </Form.Item>
                            <Form.Item label="Kuantitas" className="mb-0">
                                <Input
                                    value={record.qty}
                                    onChange={(e) => handleInputChange(index, "qty", e.target.value)}
                                    placeholder="0"
                                    className="w-full"
                                    type="number"
                                    min={1}
                                />
                            </Form.Item>
                            <Button
                                type="link"
                                danger
                                onClick={() => handleDeleteRow(index)}
                                className="p-0 mt-2"
                            >
                                <TrashIcon className="w-5 h-5 text-red-500" /> Hapus Produk
                            </Button>
                        </div>
                    </Col>
                    <Col xs={24} md={12}>
                        <div className="bg-gray-50 p-4 rounded-lg h-full">
                            <h4 className="text-lg font-semibold mb-4">Rincian Pembayaran</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Uang Muka (DP):</span>
                                    <span>{Number(dpAmount).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span>
                                </div>
                                {dpAmount > 0 && record.dpDate && (
                                    <div className="flex justify-between">
                                        <span>Tanggal DP:</span>
                                        <span>{dayjs(record.dpDate).format('DD/MM/YYYY')}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>Cicilan Perbulan ({tenorCount} Bulan):</span>
                                    <span>{Number(monthlyInstallment).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span>
                                </div>
                                <div className="flex justify-between font-bold border-t pt-2">
                                    <span>Jumlah Total:</span>
                                    <span>{Number(totalPrice).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</span>
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>
        );
    };

    const isFetching = fetchingStatus || fetchingSales || fetchingCompany || fetchingProducts || fetchingWarehouses;

    return (
        <Spin spinning={isFetching} tip="Memuat data...">
            <div className="min-h-screen px-2 sm:px-0">
                <Card title="DETAIL PESANAN #MD2501160219" className="mb-8">
                    <Form form={form} layout="vertical">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold">DETAIL PESANAN</h3>
                            <Row gutter={[8, 8]} className="flex flex-col sm:flex-row">
                                <Col xs={24} sm={4}>
                                    <Form.Item label="Platform" name="platform">
                                        <Input
                                            value="DIRECT"
                                            readOnly
                                            style={{
                                                width: '100%',
                                                backgroundColor: '#f5f5f5',
                                                color: '#000000',
                                                borderColor: '#d9d9d9'
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={4}>
                                    <Form.Item
                                        label="Marketing"
                                        name="id_sales"
                                        rules={[{ required: true, message: "Pilih Sales" }]}
                                    >
                                        <Select
                                            showSearch
                                            placeholder="Cari dan Pilih Sales"
                                            loading={fetchingSales}
                                            allowClear
                                            onChange={handleSalesChange}
                                            filterOption={(input, option) =>
                                                option.label?.toLowerCase().includes(input.toLowerCase())
                                            }
                                            options={salesList.map(sales => ({
                                                value: sales.id_sales,
                                                label: `${sales.nama_sales} - ${sales.brand}`
                                            }))}
                                            className="w-full"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={4}>
                                    <Form.Item
                                        label="Status"
                                        name="id_status"
                                        rules={[{ required: true, message: "Pilih Status" }]}
                                    >
                                        <Select
                                            showSearch
                                            placeholder="Pilih Status"
                                            loading={fetchingStatus}
                                            filterOption={(input, option) =>
                                                option.label?.toLowerCase().includes(input.toLowerCase())
                                            }
                                            options={statusList.map(status => ({
                                                value: status.id_transaksi_status,
                                                label: status.name_status
                                            }))}
                                            className="w-full"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={4}>
                                    <Form.Item
                                        label="Tgl Order"
                                        name="tgl_order"
                                        rules={[{ required: true, message: "Pilih Tanggal Order" }]}
                                    >
                                        <DatePicker
                                            format="DD/MM/YYYY"
                                            placeholder="Pilih Tanggal Order"
                                            className="w-full"
                                            defaultValue={dayjs()}
                                            onChange={(date) => {
                                                // When tgl_order changes and in credit mode, update all billing dates
                                                if (selectedTenorType === 'credit' && selectedCreditDays && date) {
                                                    const newData = dataSource.map(item => {
                                                        if (item.product_id) {
                                                            return {
                                                                ...item,
                                                                billingDate: date.add(selectedCreditDays, 'day').format("YYYY-MM-DD"),
                                                            };
                                                        }
                                                        return item;
                                                    });
                                                    setDataSource(newData);
                                                }
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={4}>
                                    <Form.Item
                                        label="Warehouse"
                                        name="id_warehouse"
                                        rules={[{ required: true, message: "Pilih Warehouse" }]}
                                    >
                                        <Select
                                            showSearch
                                            placeholder="Pilih Warehouse"
                                            loading={fetchingWarehouses}
                                            filterOption={(input, option) =>
                                                option.label?.toLowerCase().includes(input.toLowerCase())
                                            }
                                            options={warehouseList.map(warehouse => ({
                                                value: warehouse.id_warehouse,
                                                label: warehouse.name_warehouse
                                            }))}
                                            className="w-full"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={4}>
                                    <Form.Item label="Payment Method" name="payment_method">
                                        <Input
                                            value="TRANSFER"
                                            readOnly
                                            style={{
                                                width: '100%',
                                                backgroundColor: '#f5f5f5',
                                                color: '#000000',
                                                borderColor: '#d9d9d9'
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={[8, 8]} className="flex flex-col sm:flex-row">
                                <Col xs={24} sm={4}>
                                    <Form.Item
                                        label="No Referensi"
                                        name="no_referensi"
                                        rules={[
                                            { required: true, message: "Masukkan No Referensi" },
                                            {
                                                validator: (_, value) => {
                                                    // If empty, let the `required` rule handle the message to avoid duplicates
                                                    if (!value) return Promise.resolve();
                                                    const digitsOnly = String(value).replace(/\D/g, '');
                                                    if (!/^\d{4}$/.test(digitsOnly)) {
                                                        return Promise.reject('No Referensi harus 4 digit angka');
                                                    }
                                                    return Promise.resolve();
                                                }
                                            }
                                        ]}
                                    >
                                        <Input
                                            placeholder="Masukkan No Referensi (4 digit)"
                                            inputMode="numeric"
                                            pattern="\d*"
                                            maxLength={4}
                                            value={noReferensi}
                                            onChange={e => {
                                                // keep digits only and max length 4
                                                const digits = String(e.target.value).replace(/\D/g, '').slice(0, 4);
                                                setNoReferensi(digits);
                                                // keep form field in sync
                                                try {
                                                    form.setFieldsValue({ no_referensi: digits });
                                                } catch (err) {
                                                    // ignore if form not ready
                                                }
                                            }}
                                            onPaste={(e) => {
                                                // sanitize pasted input
                                                const paste = (e.clipboardData || window.clipboardData).getData('text');
                                                const digits = String(paste).replace(/\D/g, '').slice(0, 4);
                                                e.preventDefault();
                                                setNoReferensi(digits);
                                                try { form.setFieldsValue({ no_referensi: digits }); } catch (err) { }
                                            }}
                                            className="w-full"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={20}>
                                    <Form.Item label="Keterangan" name="pesan_customer">
                                        <Input.TextArea
                                            placeholder="Masukkan Keterangan"
                                            rows={1}
                                            className="w-full"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item
                                name="brand"
                                hidden
                                rules={[{ required: true, message: "Brand is required" }]}
                            >
                                <Input type="hidden" />
                            </Form.Item>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold">DETAIL PEMESAN</h3>
                            <Row gutter={[8, 8]} className="flex flex-col sm:flex-row">
                                <Col xs={24} sm={3}>
                                    <Form.Item
                                        label="Customer Type"
                                        name="b2b"
                                        rules={[{ required: true, message: "Pilih Customer Type" }]}
                                    >
                                        <Select
                                            placeholder="Pilih Customer Type"
                                            className="w-full"
                                            onChange={(val) => {
                                                setCustomerType(val);
                                                // if B2C selected, auto-select Personal company (id 1)
                                                if (val === "0" || val === "personal") {
                                                    form.setFieldsValue({ id_company: 1 });
                                                } else {
                                                    // when B2B selected, clear company to allow choosing
                                                    form.setFieldsValue({ id_company: undefined });
                                                }
                                            }}
                                        >
                                            <Option value="0">B2C</Option>
                                            <Option value="1">B2B</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={8}>
                                    <Form.Item
                                        label="Cabang"
                                        name="id_company"
                                        rules={[{ required: true, message: "Pilih Company" }]}
                                    >
                                        <Select
                                            showSearch
                                            placeholder="Cari dan Pilih Company"
                                            loading={fetchingCompany}
                                            allowClear
                                            onChange={handleCompanyChange}
                                            filterOption={(input, option) =>
                                                option.label?.toLowerCase().includes(input.toLowerCase())
                                            }
                                            options={companyList.map(company => ({
                                                value: company.id_company,
                                                label: `${company.company_name}`
                                            }))}
                                            className="w-full"
                                            dropdownStyle={{ width: '60%' }}
                                            disabled={customerType === '0' || customerType === 'personal'}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={3}>
                                    <Form.Item
                                        label="Email"
                                        name="email"
                                        rules={[{ type: "email", message: "Format email tidak valid" }]}
                                    >
                                        <Input placeholder="Masukkan Email" className="w-full" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={2}>
                                    <Form.Item
                                        label="Title"
                                        name="title"
                                        rules={[{ required: true, message: "Pilih Title" }]}
                                    >
                                        <Select placeholder="Pilih Title" className="w-full">
                                            <Option value="mr">Mr.</Option>
                                            <Option value="mrs">Mrs.</Option>
                                            <Option value="ms">Ms.</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={4}>
                                    <Form.Item
                                        label="Nama Depan"
                                        name="nama_depan"
                                        rules={[{ required: true, message: "Masukkan Nama Depan" }]}
                                    >
                                        <Input placeholder="Masukkan Nama Depan" className="w-full" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={4}>
                                    <Form.Item
                                        label="Nama Belakang"
                                        name="nama_belakang"
                                        rules={[{ message: "Masukkan Nama Belakang" }]}
                                    >
                                        <Input placeholder="Masukkan Nama Belakang" className="w-full" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <div className="mt-4">
                                <h3 className="text-lg font-semibold">DETAIL PENGIRIMAN</h3>
                                <Row gutter={[8, 8]} className="flex flex-col sm:flex-row">
                                    <Col xs={24} sm={12}>
                                        <Form.Item
                                            label="Alamat Pengiriman"
                                            name="alamat_pengiriman"
                                            rules={[{ required: true, message: "Masukkan Alamat Pengiriman" }]}
                                        >
                                            <Input.TextArea
                                                placeholder="Masukkan Alamat Pengiriman"
                                                rows={1}
                                                className="w-full"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={6}>
                                        <Form.Item
                                            label="Nama Penerima"
                                            name="nama_penerima"
                                            rules={[{ required: true, message: "Masukkan Nama Penerima" }]}
                                        >
                                            <Input placeholder="Masukkan Nama Penerima" className="w-full" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={6}>
                                        <Form.Item
                                            label="Telepon Penerima"
                                            name="telp_penerima"
                                            rules={[{ message: "Masukkan Nomor Telepon Penerima" }]}
                                        >
                                            <Input
                                                addonBefore="+62"
                                                placeholder="Masukkan Nomor Telepon Penerima"
                                                className="w-full"
                                                type="number"
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>
                        </div>

                        {selectedBrand === 'AUTO' && (
                            <div className="mt-6">
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} sm={6}>
                                        <Form.Item label="Jenis Tenor" className="w-full">
                                            <Select
                                                placeholder="Pilih Jenis Tenor"
                                                value={selectedTenorType}
                                                onChange={handleTenorTypeChange}
                                                className="w-full"
                                            >
                                                <Option value="monthly">Bulanan</Option>
                                                <Option value="yearly">Tahunan</Option>
                                                <Option value="cash">Cash</Option>
                                                <Option value="credit">Kredit</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    {selectedTenorType === 'credit' && (
                                        <Col xs={24} sm={18}>
                                            <Form.Item label="Lama Kredit" className="w-full">
                                                <div className="flex gap-2">
                                                    <Button
                                                        type={selectedCreditDays === 7 ? "primary" : "default"}
                                                        onClick={() => handleCreditDaysChange(7)}
                                                        className={selectedCreditDays === 7 ? "bg-blue-500 hover:bg-blue-600" : ""}
                                                    >
                                                        7
                                                    </Button>
                                                    <Button
                                                        type={selectedCreditDays === 14 ? "primary" : "default"}
                                                        onClick={() => handleCreditDaysChange(14)}
                                                        className={selectedCreditDays === 14 ? "bg-blue-500 hover:bg-blue-600" : ""}
                                                    >
                                                        14
                                                    </Button>
                                                    <Button
                                                        type={selectedCreditDays === 30 ? "primary" : "default"}
                                                        onClick={() => handleCreditDaysChange(30)}
                                                        className={selectedCreditDays === 30 ? "bg-blue-500 hover:bg-blue-600" : ""}
                                                    >
                                                        30
                                                    </Button>
                                                </div>
                                            </Form.Item>
                                        </Col>
                                    )}
                                </Row>
                            </div>
                        )}
                    </Form>
                </Card>

                <Card title="DETAIL PRODUK" className="mb-8">
                    {selectedBrand === 'AUTO' && !selectedTenorType && (
                        <div className="text-center">
                            Silakan pilih jenis Tenor terlebih dahulu.
                        </div>
                    )}
                    {selectedBrand === 'AUTO' && selectedTenorType && (
                        <>
                            {selectedTenorType === 'monthly' && dataSource.filter(record => !record.isTenor).map((record, index) => (
                                <div key={record.key}>
                                    {renderMonthlyTenor(record, dataSource.findIndex(item => item.key === record.key))}
                                </div>
                            ))}
                            {(selectedTenorType === 'yearly' || selectedTenorType === 'cash' || selectedTenorType === 'credit') && (
                                <Table
                                    dataSource={dataSource}
                                    columns={columns}
                                    pagination={false}
                                    bordered={false}
                                    rowClassName={(record) => record.isTenor ? "border-b bg-blue-50" : record.isDP ? "border-b bg-green-50" : "border-b"}
                                    className="mb-2"
                                    scroll={{ x: 'max-content' }}
                                />
                            )}
                        </>
                    )}
                    {selectedBrand === 'JAJAID' && (
                        <Table
                            dataSource={dataSource}
                            columns={columns}
                            pagination={false}
                            bordered={false}
                            rowClassName={(record) => record.isTenor ? "border-b bg-blue-50" : record.isDP ? "border-b bg-green-50" : "border-b"}
                            className="mb-2"
                            scroll={{ x: 'max-content' }}
                        />
                    )}
                    <div className="text-left sm:text-right mb-2">
                        <strong>Grand Total: {calculateGrandTotal().toLocaleString('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: calculateGrandTotal() % 1 !== 0 ? 2 : 0,
                            maximumFractionDigits: 2
                        })}</strong>
                    </div>
                    <Button
                        type="dashed"
                        onClick={handleAddRow}
                        className="w-full"
                    >
                        Tambah Baris
                    </Button>
                </Card>

                <div className="flex justify-start sm:justify-end mt-8">
                    <Button
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-md w-full sm:w-auto"
                        onClick={showConfirmModal}
                        loading={loading}
                        disabled={loading || isFetching}
                    >
                        Simpan Order
                    </Button>
                </div>

                <Modal
                    title="Konfirmasi Pembuatan Order"
                    open={modalVisible}
                    onOk={handleModalOk}
                    onCancel={handleModalCancel}
                    footer={[
                        <Button key="cancel" onClick={handleModalCancel}>
                            Cancel
                        </Button>,
                        <Button
                            key="submit"
                            type="default"
                            loading={confirmLoading}
                            onClick={handleModalOk}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                            OK
                        </Button>,
                    ]}
                >
                    <p>Ingin membuat order?</p>
                </Modal>
            </div>
        </Spin>
    );
};

export default CreateOrder;