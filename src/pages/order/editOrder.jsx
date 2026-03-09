import { Select, DatePicker, Input, Card, Form, Button, Row, Col, Table, notification, Modal, Spin, Checkbox, InputNumber } from "antd";
import { useState, useEffect } from "react";
import { TrashIcon, PlusIcon } from '@heroicons/react/24/solid';
import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons";
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import './createOrder.css';
import { baseUrl } from "@/configs";

const { Option } = Select;

const EditOrder = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState('JAJAID');
    const [selectedTenorType, setSelectedTenorType] = useState(null);
    const [customerType, setCustomerType] = useState('personal');
    const [dataSource, setDataSource] = useState([]);
    const navigate = useNavigate();
    const { id_data } = useParams();
    const transactionId = id_data;
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
    const [noReferensi, setNoReferensi] = useState("");

    const MAX_YEARLY_TENORS = 5;
    const MAX_MONTHLY_TENORS = 36;

    useEffect(() => {
        const fetchTransaction = async () => {
            try {
                const requestOptions = { method: "GET", redirect: "follow" };
                const response = await fetch(`${baseUrl}/nimda/transaksi/detail-transaksi/${transactionId}`, requestOptions);
                const result = await response.json();

                if (response.ok) {
                    const transaction = result.data;
                    // Get brand from sales data, not from transaction.brand
                    const brandValue = transaction.tb_sale?.brand || transaction.brand || "JAJAID";
                    setSelectedBrand(brandValue);

                    // Determine tenor type based on tanggal_tagih patterns
                    const details = transaction.tb_transaksi_directs || transaction.transaksi_details || [];
                    let inferredTenorType = 'cash';
                    if (brandValue === 'AUTO') {
                        // Group by product_id to analyze each product's payment pattern
                        const productGroups = {};
                        details.forEach(item => {
                            if (!productGroups[item.product_id]) {
                                productGroups[item.product_id] = [];
                            }
                            productGroups[item.product_id].push(item);
                        });

                        // Analyze each product group
                        let hasMonthlyTenor = false;
                        let hasYearlyTenor = false;
                        let hasCash = false;

                        Object.values(productGroups).forEach(productItems => {
                            if (productItems.length === 1) {
                                hasCash = true;
                            } else {
                                // First check product descriptions for clear indicators
                                const hasMonthlyDescription = productItems.some(item =>
                                    item.product_description?.toLowerCase().includes('cicilan bulan') ||
                                    item.product_description?.toLowerCase().includes('angsuran')
                                );


                                if (hasMonthlyDescription) {
                                    hasMonthlyTenor = true;
                                } else {
                                    // Sort by tanggal_tagih to analyze intervals
                                    const sortedItems = productItems.sort((a, b) =>
                                        new Date(a.tanggal_tagih) - new Date(b.tanggal_tagih)
                                    );

                                    // Check if intervals are monthly (approximately 30 days)
                                    let isMonthly = true;
                                    for (let i = 1; i < sortedItems.length; i++) {
                                        const prevDate = new Date(sortedItems[i - 1].tanggal_tagih);
                                        const currDate = new Date(sortedItems[i].tanggal_tagih);
                                        const diffDays = Math.abs((currDate - prevDate) / (1000 * 60 * 60 * 24));

                                        // Allow some tolerance for monthly intervals (25-35 days)
                                        if (diffDays < 25 || diffDays > 35) {
                                            isMonthly = false;
                                            break;
                                        }
                                    }

                                    if (isMonthly) {
                                        hasMonthlyTenor = true;
                                    } else {
                                        hasYearlyTenor = true;
                                    }
                                }
                            }
                        });

                        // Determine final tenor type
                        if (hasMonthlyTenor) {
                            inferredTenorType = 'monthly';
                        } else if (hasYearlyTenor) {
                            inferredTenorType = 'yearly';
                        } else {
                            inferredTenorType = 'cash';
                        }
                    }
                    setSelectedTenorType(brandValue === 'AUTO' ? inferredTenorType : null);

                    // Set form values
                    form.setFieldsValue({
                        platform: transaction.platform || "DIRECT",
                        id_sales: transaction.id_sales,
                        id_status: transaction.id_status,
                        payment_method: transaction.metode_pembayaran || "transfer",
                        b2b: transaction.id_company === 1 ? "personal" : "corporate",
                        id_company: transaction.id_company,
                        email: transaction.tb_company?.pic_email || transaction.email || "",
                        no_telepon: transaction.tb_company?.pic_phone || transaction.telp_penerima || "",
                        title: transaction.nama_customer ? "mr" : "mr",
                        nama_depan: transaction.nama_customer ? transaction.nama_customer.split(" ")[0] : "",
                        nama_belakang: transaction.nama_customer ? transaction.nama_customer.split(" ").slice(1).join(" ") : "",
                        brand: brandValue,
                        erlangga: transaction.is_erlangga ?? (transaction.tb_company?.is_erlangga ? 1 : 0),
                        pesan_customer: transaction.pesan_customer || "", // <-- pastikan pesan_customer diisi dari response
                        alamat_pengiriman: transaction.alamat_pengiriman || "",
                        nama_penerima: transaction.nama_penerima || transaction.nama_customer || "",
                        telp_penerima: transaction.telp_penerima || "",
                        id_warehouse: transaction.warehouse_id || undefined,
                        tgl_order: transaction.created_date ? dayjs(transaction.created_date, "YYYY-MM-DD") : dayjs(),
                        rencana_tanggal_tagih: transaction.batas_pembayaran ? dayjs(transaction.batas_pembayaran) : null,
                        no_referensi: transaction.no_referensi,
                    });

                    // Set no_referensi state
                    setNoReferensi(transaction.no_referensi || "");
                    // sync local customerType state from transaction
                    setCustomerType(transaction.id_company === 1 ? "personal" : "corporate");

                    // === Mapping khusus untuk tenor bulanan ===
                    // Force monthly tenor type if we have cicilan bulan data
                    const hasCicilanBulan = details.some(item =>
                        item.product_description?.toLowerCase().includes('cicilan bulan')
                    );
                    if (inferredTenorType === 'monthly' || hasCicilanBulan) {
                        // Group by product_id and rate to handle multiple products with same ID but different rates
                        const grouped = {};
                        details.forEach(item => {
                            const key = `${item.product_id}-${item.rate}`;
                            if (!grouped[key]) grouped[key] = [];
                            grouped[key].push(item);
                        });

                        const newDataSource = [];
                        Object.values(grouped).forEach(items => {
                            // Find DP entry and cicilan entries
                            const dpEntry = items.find(item =>
                                item.product_description?.toLowerCase().includes('dp') ||
                                item.product_description === "Down Payment"
                            );
                            const cicilanEntries = items.filter(item =>
                                item.product_description?.toLowerCase().includes('cicilan bulan') ||
                                item.product_description?.toLowerCase().includes('angsuran')
                            );
                            const firstCicilan = cicilanEntries[0];

                            // Calculate DP amount and date
                            const dpAmount = dpEntry ? Number(dpEntry.price) : 0;
                            const dpDate = dpEntry ? dayjs(dpEntry.tanggal_tagih).format("YYYY-MM-DD") : null;
                            const billingDate = firstCicilan && firstCicilan.tanggal_tagih
                                ? dayjs(firstCicilan.tanggal_tagih).format("YYYY-MM-DD")
                                : (dpDate || (transaction.created_date ? dayjs(transaction.created_date).format("YYYY-MM-DD") : null));
                            const tenorCount = cicilanEntries.length;

                            // Get product info for original price calculation
                            const product = productList.find(p => p.id === items[0].product_id);
                            const qty = items[0].quantity || 1;

                            // Calculate total price from cicilan entries using actual rate from transaction data
                            const totalCicilanAmount = cicilanEntries.reduce((sum, item) => sum + (Number(item.rate) * (item.quantity || 1)), 0);
                            const totalPrice = dpAmount + totalCicilanAmount;

                            // Main row with DP info - show DP amount if exists, otherwise show first cicilan amount
                            newDataSource.push({
                                key: `main-${items[0].product_id}-${items[0].rate}`,
                                product_id: items[0].product_id,
                                produk: items[0].product_name,
                                deskripsi: dpAmount > 0 ? "Down Payment" : "",
                                qty: qty,
                                unit: "Pcs",
                                harga: dpAmount > 0 ? dpAmount : Number(firstCicilan?.rate || 0),
                                diskon: items[0].discount || 0,
                                pajak: parseFloat(items[0].tax_type) || 0,
                                koin: 0,
                                jumlah: 0,
                                isPengajuan: items[0].status_pengajuan === "sudah_diajukan" || brandValue === 'JAJAID' || brandValue === 'AUTO',
                                parentProductId: null,
                                isTenor: false,
                                billingDate: billingDate,
                                isDP: dpAmount > 0,
                                dpAmount: dpAmount,
                                dpDate: dpDate,
                                tenorCount: tenorCount,
                            });

                            // Add tenor rows (cicilan)
                            cicilanEntries.forEach((item, idx) => {
                                newDataSource.push({
                                    key: `tenor-${item.id_transaksi_direct}`,
                                    product_id: item.product_id,
                                    produk: item.product_name,
                                    deskripsi: item.product_description,
                                    qty: item.quantity || 1,
                                    unit: "Pcs",
                                    harga: Number(item.rate),
                                    diskon: item.discount || 0,
                                    pajak: parseFloat(item.tax_type) || 0,
                                    koin: 0,
                                    jumlah: 0,
                                    isPengajuan: false,
                                    parentProductId: item.product_id,
                                    isTenor: true,
                                    billingDate: item.tanggal_tagih ? dayjs(item.tanggal_tagih).format("YYYY-MM-DD") : null,
                                    isDP: false,
                                    dpAmount: 0,
                                    dpDate: null,
                                    tenorCount: 0,
                                });
                            });
                        });
                        setDataSource(newDataSource);
                        return;
                    }
                    // === END mapping khusus tenor bulanan ===

                    // Set dataSource from transaction details (default logic for non-monthly)
                    if (Array.isArray(details) && details.length > 0) {
                        const sortedDetails = [...details].sort((a, b) => a.id_transaksi_direct - b.id_transaksi_direct);

                        // Untuk tenor tahunan, langsung mapping semua data tanpa grouping
                        if (inferredTenorType === 'yearly') {
                            const newDataSource = sortedDetails.map((detail, idx) => {
                                const productId = detail.product_id;
                                const isDP = detail.product_description?.toLowerCase().includes('dp') || detail.isDP;
                                const isTenor = detail.product_description?.toLowerCase().includes('tenor') || detail.quantity === 0;
                                const billingDate = detail.tanggal_tagih ? dayjs(detail.tanggal_tagih).format("YYYY-MM-DD") : null;
                                const dpDate = detail.tanggal_dp ? dayjs(detail.tanggal_dp).format("YYYY-MM-DD") : null;

                                return {
                                    key: detail.id_transaksi_direct?.toString() || `${Date.now()}-${idx}`,
                                    product_id: productId,
                                    produk: detail.product_name || detail.nama_produk || "Unknown Product",
                                    deskripsi: detail.product_description || "",
                                    qty: detail.quantity || 1,
                                    unit: productList.find(p => p.id === productId)?.unit || "Pcs",
                                    harga: detail.price || detail.rate || 0,
                                    diskon: detail.discount || 0,
                                    pajak: parseFloat(detail.tax_type) || 0,
                                    koin: detail.koin || 0,
                                    jumlah: 0,
                                    isPengajuan: detail.status_pengajuan === "sudah_diajukan" || brandValue === 'JAJAID' || brandValue === 'AUTO',
                                    parentProductId: isTenor ? productId : null,
                                    isTenor,
                                    billingDate,
                                    isDP,
                                    dpAmount: isDP ? (detail.price || detail.rate || 0) : 0,
                                    dpDate,
                                    tenorCount: isTenor ? 0 : 1,
                                };
                            });
                            setDataSource(newDataSource);
                            return;
                        }

                        // Logic untuk non-yearly (cash, monthly, dll)
                        const productGroups = {};

                        sortedDetails.forEach((detail, idx) => {
                            const productId = detail.product_id;
                            if (!productGroups[productId]) {
                                productGroups[productId] = { main: null, tenors: [], dp: null };
                            }

                            const isDP = detail.product_description?.toLowerCase().includes('dp') || detail.isDP;
                            const isTenor = detail.product_description?.toLowerCase().includes('tenor') || detail.quantity === 0;
                            const billingDate = detail.tanggal_tagih ? dayjs(detail.tanggal_tagih).format("YYYY-MM-DD") : null;
                            const dpDate = detail.tanggal_dp ? dayjs(detail.tanggal_dp).format("YYYY-MM-DD") : null;

                            const row = {
                                key: detail.id_transaksi_direct?.toString() || `${Date.now()}-${idx}`,
                                product_id: productId,
                                produk: detail.product_name || detail.nama_produk || "Unknown Product",
                                deskripsi: detail.product_description || "",
                                qty: detail.quantity || 1,
                                unit: productList.find(p => p.id === productId)?.unit || "Pcs",
                                harga: detail.price || detail.rate || 0,
                                diskon: detail.discount || 0,
                                pajak: parseFloat(detail.tax_type) || 0,
                                koin: detail.koin || 0,
                                jumlah: 0,
                                isPengajuan: detail.status_pengajuan === "sudah_diajukan" || brandValue === 'JAJAID' || brandValue === 'AUTO',
                                parentProductId: isTenor ? productId : null,
                                isTenor,
                                billingDate,
                                isDP,
                                dpAmount: isDP ? (detail.price || detail.rate || 0) : 0,
                                dpDate,
                                tenorCount: isTenor ? 0 : 1,
                            };

                            if (isDP) {
                                productGroups[productId].dp = row;
                            } else if (isTenor) {
                                productGroups[productId].tenors.push(row);
                            } else {
                                productGroups[productId].main = row;
                            }
                        });

                        const newDataSource = [];
                        Object.values(productGroups).forEach(group => {
                            // Create a synthetic main row if none exists
                            if (!group.main && group.tenors.length > 0) {
                                const firstTenor = group.tenors[0];
                                const product = productList.find(p => p.id === firstTenor.product_id) || {
                                    id: firstTenor.product_id,
                                    name: firstTenor.produk,
                                    unit: "Pcs",
                                    sell_price: 0,
                                };
                                group.main = {
                                    key: `${Date.now()}-main-${firstTenor.product_id}`,
                                    product_id: firstTenor.product_id,
                                    produk: product.name || firstTenor.produk || "Main Product",
                                    deskripsi: "",
                                    qty: firstTenor.qty || 1,
                                    unit: product.unit || "Pcs",
                                    harga: parseFloat(product.sell_price) || 0,
                                    diskon: 0,
                                    pajak: 0,
                                    koin: 0,
                                    jumlah: 0,
                                    isPengajuan: brandValue === 'JAJAID' || brandValue === 'AUTO',
                                    parentProductId: null,
                                    isTenor: false,
                                    billingDate: group.tenors[0].billingDate || null,
                                    isDP: false,
                                    dpAmount: 0,
                                    dpDate: null,
                                    tenorCount: group.tenors.length || 1,
                                };
                            }

                            if (group.main) {
                                group.main.tenorCount = group.tenors.length || 1;
                                newDataSource.push(group.main);
                            }
                            if (group.dp) {
                                newDataSource.push(group.dp);
                            }
                            if (group.tenors.length > 0) {
                                newDataSource.push(...group.tenors);
                            }
                        });

                        setDataSource(newDataSource);
                    } else {
                        setDataSource([]);
                    }
                }
            } catch (error) {
                console.error("Error fetching transaction:", error);
                notification.error({
                    message: "Gagal Mengambil Data",
                    description: "Terjadi kesalahan saat mengambil data transaksi.",
                });
            }
        };

        if (transactionId && productList.length > 0) {
            fetchTransaction();
        }
    }, [transactionId, form, productList]);

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
                    setCompanyList(result.data);
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
                const requestOptions = { method: "GET", redirect: "follow" };
                const response = await fetch(`${baseUrl}/nimda/master_product?limit=500000`, requestOptions);
                const result = await response.json();
                if (result.code === 200 && Array.isArray(result.data)) {
                    setProductList(result.data);
                } else {
                    console.error("Data produk tidak valid:", result);
                    setProductList([]);
                }
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
                // Only update if no existing tenor rows to preserve data
                const existingTenorRows = newData.filter(item => item.product_id === currentRow.product_id && item.isTenor);
                if (existingTenorRows.length === 0) {
                    updateMonthlyTenors(index, newData, value);
                }
            } else if (selectedTenorType === 'yearly' && selectedBrand === 'AUTO') {
                updateYearlyTenors(index, newData, value);
            }
        } else if (field === "dpDate") {
            newData[index][field] = value ? value.format("YYYY-MM-DD") : null;
            if ((selectedTenorType === 'monthly' || selectedTenorType === 'yearly') && selectedBrand === 'AUTO' && value) {
                newData[index].billingDate = value.format("YYYY-MM-DD");
                if (selectedTenorType === 'monthly') {
                    // Only update if no existing tenor rows to preserve data
                    const existingTenorRows = newData.filter(item => item.product_id === currentRow.product_id && item.isTenor);
                    if (existingTenorRows.length === 0) {
                        updateMonthlyTenors(index, newData);
                    }
                } else {
                    updateYearlyTenors(index, newData);
                }
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
                // Only update if no existing tenor rows to preserve data
                const existingTenorRows = newData.filter(item => item.product_id === currentRow.product_id && item.isTenor);
                if (existingTenorRows.length === 0) {
                    updateMonthlyTenors(index, newData);
                }
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
                // Untuk tenor tahunan, biarkan user menginput harga secara bebas
                newData[index].harga = Number(harga.toFixed(2));
                newData[index].isDP = harga < originalPrice * qty && harga > 0 && !currentRow.isTenor;
                newData[index].deskripsi = newData[index].isDP ? "Down Payment" : "";
                newData[index].dpAmount = newData[index].isDP ? harga : 0;
                // Tidak perlu updateYearlyTenors karena kita tidak ingin mengubah harga yang sudah diinput
            } else if (selectedTenorType === 'monthly' && selectedBrand === 'AUTO') {
                newData[index].harga = Number(harga.toFixed(2));
                newData[index].isDP = harga < originalPrice * qty && harga > 0 && !currentRow.isTenor;
                newData[index].deskripsi = newData[index].isDP ? "Down Payment" : "";
                newData[index].dpAmount = newData[index].isDP ? harga : 0;
                // Only update if no existing tenor rows to preserve data
                const existingTenorRows = newData.filter(item => item.product_id === currentRow.product_id && item.isTenor);
                if (existingTenorRows.length === 0) {
                    updateMonthlyTenors(index, newData);
                }
            } else {
                const isDP = harga < originalPrice * qty && harga > 0 && !currentRow.isTenor;
                newData[index].isDP = isDP;
                newData[index].deskripsi = isDP ? "Down Payment" : "";
                newData[index].dpAmount = isDP ? harga : 0;
                newData[index].harga = Number(harga.toFixed(2));
            }
        } else if (field === "tenorCount") {
            const count = parseInt(value) || 1;
            const maxTenors = selectedTenorType === 'yearly' ? MAX_YEARLY_TENORS : MAX_MONTHLY_TENORS;
            newData[index].tenorCount = Math.max(1, Math.min(maxTenors, count));
            if (selectedTenorType === 'monthly' && selectedBrand === 'AUTO') {
                // For edit mode, always update monthly tenors when tenor count changes
                updateMonthlyTenors(index, newData);
            } else if (selectedTenorType === 'yearly' && selectedBrand === 'AUTO') {
                // Untuk tenor tahunan, tidak perlu updateYearlyTenors karena kita ingin mempertahankan harga yang sudah diinput
            }
        } else if (field === "dpAmount") {
            const dp = parseFloat(value) || 0;
            newData[index].dpAmount = dp;
            newData[index].isDP = dp > 0;
            newData[index].deskripsi = dp > 0 ? "Down Payment" : "";
            newData[index].harga = dp > 0 ? dp : newData[index].harga;
            newData[index].dpDate = dp > 0 ? newData[index].dpDate : null;
            // Don't call updateMonthlyTenors for existing data to preserve tenor amounts
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

        const dpAmount = mainProduct.dpAmount || 0;
        const tenorCount = mainProduct.tenorCount || 1;
        const mainRowRate = mainProduct.harga;

        // Get existing tenor rows for this specific rate group
        const existingTenorRows = newData.filter(item =>
            item.product_id === mainProduct.product_id &&
            item.isTenor &&
            Math.abs(Number(item.harga) - Number(mainRowRate)) < 0.01
        );

        // If we have existing tenor rows and tenor count hasn't changed, preserve their prices
        if (existingTenorRows.length > 0 && existingTenorRows.length === tenorCount) {
            // Just update the main row with DP info
            const mainRowIndex = newData.findIndex(item =>
                item.product_id === mainProduct.product_id &&
                !item.isTenor &&
                !item.isDP &&
                Math.abs(Number(item.harga) - Number(mainRowRate)) < 0.01
            );
            if (mainRowIndex !== -1) {
                newData[mainRowIndex].isDP = dpAmount > 0;
                newData[mainRowIndex].deskripsi = dpAmount > 0 ? "Down Payment" : "";
                newData[mainRowIndex].dpAmount = dpAmount;
                newData[mainRowIndex].dpDate = mainProduct.dpDate;
                newData[mainRowIndex].harga = dpAmount > 0 ? dpAmount : newData[mainRowIndex].harga;
            }
            setDataSource(newData);
            return;
        }

        // Remove existing tenor rows for this specific rate group
        const newRows = newData.filter(item => !(
            item.product_id === mainProduct.product_id &&
            item.isTenor &&
            Math.abs(Number(item.harga) - Number(mainRowRate)) < 0.01
        ));

        // Find the correct index for the main row after filtering
        const mainRowIndex = newRows.findIndex(item =>
            item.product_id === mainProduct.product_id &&
            !item.isTenor &&
            !item.isDP &&
            Math.abs(Number(item.harga) - Number(mainRowRate)) < 0.01
        );

        if (mainRowIndex === -1) return; // Main row not found

        // Calculate new monthly installment based on existing total
        const product = productList.find(p => p.id === mainProduct.product_id);
        const originalPrice = product ? parseFloat(product.sell_price) || 0 : 0;
        const qty = mainProduct.qty || 1;
        const totalPrice = originalPrice * qty;
        const remainingPrice = totalPrice - dpAmount;
        const splitPrice = tenorCount > 0 ? remainingPrice / tenorCount : remainingPrice;

        // Update main row
        newRows[mainRowIndex].harga = dpAmount > 0 ? dpAmount : Number(splitPrice.toFixed(2));
        newRows[mainRowIndex].isDP = dpAmount > 0;
        newRows[mainRowIndex].deskripsi = dpAmount > 0 ? "Down Payment" : "";
        newRows[mainRowIndex].tenorCount = tenorCount;

        // Add tenor rows
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
                pajak: 0,
                koin: 0,
                jumlah: 0,
                isPengajuan: false,
                parentProductId: mainProduct.product_id,
                isTenor: true,
                billingDate: startDate.add(i, 'month').format("YYYY-MM-DD"),
                isDP: false,
                dpAmount: 0,
                dpDate: null,
                tenorCount: 0,
            };
            newRows.splice(mainRowIndex + 1 + i, 0, tenorRow);
        }
        setDataSource(newRows);
    };

    const updateYearlyTenors = (index, data, newBillingDate = null) => {
        const newData = [...data];
        const mainProduct = newData[index];
        if (!mainProduct.product_id) return;

        // Untuk tenor tahunan, kita tidak mengubah harga yang sudah diinput user
        // Hanya sync quantity dan tanggal jika diperlukan
        const qty = mainProduct.qty || 1;

        // Sync quantity untuk semua row yang terkait dengan product ini
        newData.forEach((item, idx) => {
            if (item.product_id === mainProduct.product_id) {
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
                isPengajuan: selectedBrand === 'JAJAID' || selectedBrand === 'AUTO',
                tenorCount: selectedBrand === 'AUTO' && selectedTenorType === 'monthly' ? 1 : selectedTenorType === 'yearly' ? 1 : 0,
            };

            if (selectedTenorType === 'monthly' && selectedBrand === 'AUTO') {
                updateMonthlyTenors(index, newData);
            } else if (selectedTenorType === 'yearly' && selectedBrand === 'AUTO') {
                // Untuk tenor tahunan, tidak perlu updateYearlyTenors karena kita ingin mempertahankan harga yang sudah diinput
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
        if (tenorCount >= MAX_YEARLY_TENORS && selectedTenorType === 'yearly') {
            notification.warning({
                message: "Batas Tenor Tercapai",
                description: `Maksimum ${MAX_YEARLY_TENORS} tenor tahunan per produk.`,
            });
            return;
        }

        mainProduct.tenorCount = tenorCount + 1;
        // Untuk tenor tahunan, tidak perlu updateYearlyTenors karena kita ingin mempertahankan harga yang sudah diinput
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
                    if (selectedTenorType === 'monthly') {
                        updateMonthlyTenors(nextIndex, newData);
                    } else if (selectedTenorType === 'yearly') {
                        // Untuk tenor tahunan, tidak perlu updateYearlyTenors karena kita ingin mempertahankan harga yang sudah diinput
                    }
                }
            } else {
                if (selectedTenorType === 'monthly') {
                    updateMonthlyTenors(index, newData);
                } else if (selectedTenorType === 'yearly') {
                    // Untuk tenor tahunan, tidak perlu updateYearlyTenors karena kita ingin mempertahankan harga yang sudah diinput
                }
            }
        } else {
            const mainRow = newData.find(item => item.product_id === productId && !item.isTenor && !item.isDP);
            if (mainRow) {
                const mainIndex = newData.indexOf(mainRow);
                mainRow.tenorCount = Math.max(1, mainRow.tenorCount - 1);
                if (selectedTenorType === 'monthly') {
                    updateMonthlyTenors(mainIndex, newData);
                } else if (selectedTenorType === 'yearly') {
                    // Untuk tenor tahunan, tidak perlu updateYearlyTenors karena kita ingin mempertahankan harga yang sudah diinput
                }
            }
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

        if (selectedBrand === 'AUTO' && selectedTenorType === 'monthly') {
            // For monthly tenor, calculate from actual tenor data
            const grouped = {};
            dataSource.forEach(item => {
                if (!item.isTenor && !item.isDP) {
                    const key = `${item.product_id}-${item.harga}`;
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(item);
                }
            });

            Object.values(grouped).forEach(group => {
                const mainRow = group[0];
                const mainRowRate = mainRow.harga;

                // Get all tenor rows for this specific group
                const tenorRows = dataSource.filter(r =>
                    r.product_id === mainRow.product_id &&
                    r.isTenor &&
                    Math.abs(Number(r.harga) - Number(mainRowRate)) < 0.01
                );

                // Calculate total from actual tenor amounts
                const tenorTotal = tenorRows.reduce((sum, r) => sum + (Number(r.harga) || 0) * (r.qty || 1), 0);
                const dpTotal = mainRow.dpAmount || 0;
                const productTotal = dpTotal + tenorTotal;
                total += productTotal;
            });
        } else {
            const uniqueProductIds = [...new Set(dataSource.map(item => item.product_id).filter(id => id))];

            uniqueProductIds.forEach(productId => {
                const productRows = dataSource.filter(item => item.product_id === productId);
                const product = productList.find(p => p.id === productId);
                const originalPrice = product ? parseFloat(product.sell_price) || 0 : 0;
                const mainRow = productRows.find(item => !item.isTenor && !item.isDP) || productRows[0];

                if (selectedBrand === 'AUTO' && selectedTenorType === 'yearly') {
                    // Untuk tenor tahunan, gunakan harga yang sudah diinput user
                    const productTotal = productRows.reduce((sum, item) => {
                        return sum + calculateJumlah(item);
                    }, 0);
                    total += productTotal;
                } else {
                    const productTotal = productRows.reduce((sum, item) => {
                        return sum + calculateJumlah(item);
                    }, 0);
                    total += productTotal;
                }
            });
        }

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
            isPengajuan: brandValue === 'JAJAID' || brandValue === 'AUTO',
        }));
        setDataSource(newData);
    };

    const handleTenorTypeChange = (value) => {
        setSelectedTenorType(value);
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
            tenorCount: value === 'monthly' ? 1 : value === 'yearly' ? 1 : 0,
            isPengajuan: selectedBrand === 'JAJAID' || selectedBrand === 'AUTO',
        }));
        setDataSource(newData);
    };

    const showConfirmModal = () => {
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

            dataSource.forEach(item => {
                if (!item.isTenor && !item.isPengajuan) {
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
                            // Cicilan bulanan - use existing tenor data to preserve amounts
                            const existingTenorRows = dataSource.filter(dsItem =>
                                dsItem.product_id === item.product_id && dsItem.isTenor
                            );

                            for (let i = 0; i < tenorCount; i++) {
                                // Use existing tenor data if available, otherwise calculate
                                let ratePerUnit, tanggalTagih;
                                if (existingTenorRows[i]) {
                                    ratePerUnit = Number(existingTenorRows[i].harga) || 0;
                                    tanggalTagih = existingTenorRows[i].billingDate || startDate.add(i, 'month').format("YYYY-MM-DD");
                                } else {
                                    const cicilanPerBulan = Number(monthlyInstallment.toFixed(2));
                                    ratePerUnit = qty > 0 ? cicilanPerBulan / qty : cicilanPerBulan;
                                    tanggalTagih = startDate.add(i, 'month').format("YYYY-MM-DD");
                                }

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
                                    tanggal_tagih: tanggalTagih,
                                    tanggal_dp: null,
                                    created_date: values.tgl_order ? values.tgl_order.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
                                });
                            }
                            processedProducts.add(item.product_id);
                        }
                    } else if (selectedBrand === 'AUTO' && selectedTenorType === 'yearly') {
                        // Untuk tenor tahunan, proses semua row yang ada di dataSource sesuai dengan input user
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
                    } else {
                        // Transaksi biasa/cash
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

            const subtotal = transaksiDetails.reduce((sum, item) => {
                const baseAmount = item.price * (item.quantity || 1);
                const discountedAmount = baseAmount * (1 - (item.discount || 0) / 100);
                return sum + discountedAmount * (1 + (parseFloat(item.tax_type) || 0) / 100);
            }, 0);

            const selectedStatus = statusList.find(status => status.id_transaksi_status === values.id_status);
            const statusTransaksi = selectedStatus ? selectedStatus.name_status : "Booked";

            let batasPembayaran;
            if (values.brand === "AUTO") {
                batasPembayaran = values.rencana_tanggal_tagih
                    ? values.rencana_tanggal_tagih.format("YYYY-MM-DD")
                    : dayjs().add(30, 'day').format("YYYY-MM-DD");
            } else {
                batasPembayaran = values.tgl_order
                    ? values.tgl_order.add(30, 'day').format("YYYY-MM-DD")
                    : dayjs().add(30, 'day').format("YYYY-MM-DD");
            }

            const payload = {
                id_data: transactionId,
                billing_id: "BILL" + transactionId,
                faktur: "FAKTUR" + transactionId,
                id_toko: 103,
                waktu_pengiriman: "setiap saat",
                batas_pembayaran: batasPembayaran,
                created_date: values.tgl_order ? values.tgl_order.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
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
                brand: values.brand || selectedBrand,
                status_transaksi: statusTransaksi,
                koin: 0,
                biaya_asuransi: 0,
                erlangga: values.erlangga || 0,
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

            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            const token = localStorage.getItem("token");
            if (token) {
                myHeaders.append("Authorization", token.startsWith("Bearer ") ? token : `${token}`);
            }
            const requestOptions = {
                method: "PUT",
                headers: myHeaders,
                body: JSON.stringify(payload),
                redirect: "follow"
            };

            const response = await fetch(`${baseUrl}/nimda/transaksi/edit-transaksi/${transactionId}`, requestOptions);
            const result = await response.json();

            if (response.ok) {
                notification.success({
                    message: "Transaksi Berhasil Diperbarui",
                    description: "Data transaksi berhasil diperbarui."
                });
                navigate(`/dashboard/order/detail-order/${transactionId}`);
            } else {
                notification.error({
                    message: "Transaksi Gagal Diperbarui",
                    description: result.message || "Terjadi kesalahan saat memperbarui transaksi."
                });
            }
        } catch (error) {
            console.error("Error submitting order:", error);
            notification.error({
                message: "Transaksi Gagal Diperbarui",
                description: "Terjadi kesalahan saat memperbarui transaksi."
            });
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
                        filterOption={(input, option) => {
                            const p = productList.find((prod) => prod.id === option?.value);
                            const text = `${p?.product_code || ''} ${p?.name || ''}`.toLowerCase();
                            return text.includes((input || '').toLowerCase());
                        }}
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
                    placeholder={record.isDP ? "Down Payment" : record.isTenor ? "" : "Deskripsi"}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                />
            ),
        },
        {
            title: "Rencana Tanggal Tagih",
            dataIndex: "billingDate",
            width: 200,
            render: (_, record, index) => (
                (selectedBrand === 'AUTO' && selectedTenorType && selectedTenorType !== 'cash') && (
                    <DatePicker
                        format="DD/MM/YYYY"
                        value={record.billingDate ? dayjs(record.billingDate) : null}
                        onChange={(date) => handleInputChange(index, "billingDate", date)}
                        placeholder="Pilih Tanggal"
                        style={{ width: '100%' }}
                    />
                )
            ),
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
                        {selectedBrand === 'AUTO' && !record.isTenor && selectedTenorType === 'yearly' && tenorCount < MAX_YEARLY_TENORS && (
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
            isPengajuan: selectedBrand === 'JAJAID' || selectedBrand === 'AUTO',
            parentProductId: null,
            isTenor: false,
            billingDate: null,
            isDP: false,
            dpAmount: 0,
            dpDate: null,
            tenorCount: selectedBrand === 'AUTO' && selectedTenorType === 'monthly' ? 1 : selectedTenorType === 'yearly' ? 1 : 0,
        };
        setDataSource([...dataSource, newRow]);
    };

    const renderMonthlyTenor = (record, index) => {
        const product = productList.find(p => p.id === record.product_id);
        const stock = product ? product.stock : 0;
        const originalPrice = product ? parseFloat(product.sell_price) || 0 : 0;
        const qty = record.qty || 1;
        const dpAmount = record.dpAmount || 0;
        const tenorCount = Math.min(record.tenorCount || 1, MAX_MONTHLY_TENORS);

        // Derive totals from existing rows when product price is missing to avoid negatives
        // Filter by both product_id and the specific rate to get only the related tenor rows for this specific group
        const mainRowRate = record.harga; // Get the rate from the main row
        const relatedRows = dataSource.filter(r =>
            r.product_id === record.product_id &&
            r.isTenor &&
            Math.abs(Number(r.harga) - Number(mainRowRate)) < 0.01 // Match the same rate
        );
        const tenorRows = relatedRows;
        const totalTenorAmount = tenorRows.reduce((sum, r) => sum + (Number(r.harga) || 0) * (r.qty || 1), 0);

        // For edit mode, use the actual total from existing data
        // DP is additional, so total should be DP + tenor amounts
        const actualTotalPrice = dpAmount + totalTenorAmount;

        // Use actual total if available, otherwise fall back to original price calculation
        const effectiveTotalPrice = actualTotalPrice > 0 ? actualTotalPrice : (originalPrice * qty);

        // Calculate monthly installment from existing tenor data
        // For edit mode, use the actual tenor amount from existing data
        let monthlyInstallment = 0;
        if (tenorRows.length > 0) {
            // Use the actual rate from the first tenor row
            monthlyInstallment = Number(tenorRows[0].harga) || 0;
        } else {
            // Fallback calculation for new products
            monthlyInstallment = tenorCount > 0 ? totalTenorAmount / tenorCount : 0;
        }
        const totalPrice = effectiveTotalPrice;

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
                                    filterOption={(input, option) => {
                                        const p = productList.find((prod) => prod.id === option?.value);
                                        const text = `${p?.product_code || ''} ${p?.name || ''}`.toLowerCase();
                                        return text.includes((input || '').toLowerCase());
                                    }}
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
                                    placeholder="Deskripsi"
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
                                        max={MAX_MONTHLY_TENORS}
                                        value={record.tenorCount}
                                        onChange={(value) => handleInputChange(index, "tenorCount", value)}
                                        className="w-20 text-center"
                                    />
                                    <Button
                                        icon={<PlusCircleOutlined />}
                                        onClick={() => handleInputChange(index, "tenorCount", record.tenorCount + 1)}
                                        disabled={record.tenorCount >= MAX_MONTHLY_TENORS}
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
                <Card title={`EDIT PESANAN #${transactionId}`} className="mb-8">
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
                                        label="Erlangga"
                                        name="erlangga"
                                        rules={[{ required: true, message: "Pilih Erlangga atau Non-Erlangga" }]}
                                    >
                                        <Select placeholder="Pilih Erlangga" className="w-full">
                                            <Option value={1}>Erlangga (1)</Option>
                                            <Option value={0}>Non-Erlangga (0)</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={4}>
                                    <Form.Item label="No Referensi" name="no_referensi">
                                        <Input
                                            placeholder="Masukkan No Referensi"
                                            value={noReferensi}
                                            onChange={e => setNoReferensi(e.target.value)}
                                            className="w-full"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={16}>
                                    <Form.Item label="Keterangan" name="pesan_customer">
                                        <Input.TextArea
                                            placeholder="Masukkan Keterangan"
                                            rows={1}
                                            className="w-full"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
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
                                                if (val === "0" || val === "personal") {
                                                    form.setFieldsValue({ id_company: 1 });
                                                } else {
                                                    form.setFieldsValue({ id_company: undefined });
                                                }
                                            }}
                                        >
                                            <Option value="personal">B2C</Option>
                                            <Option value="corporate">B2B</Option>
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
                                            <Option value="ms">ms</Option>
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
                                <Col xs="24" sm="4">
                                    <Form.Item
                                        label="Nama Belakang"
                                        name="nama_belakang"
                                        rules={[{ message: "Masukkan Nama Belakang" }]}                                    >
                                        <Input placeholder="Masukkan Nama Belakang" className="w-full" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <div className="mt-4">
                                <h3 className="text-lg font-semibold">DETAIL PENGIRIMAN</h3>
                                <Row gutter="[8, 8]" className="flex flex-col sm:flex-row">
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
                                            rules={[{ required: true, message: "Masukkan Nomor Telepon Penerima" }]}
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
                                <Form.Item label="Jenis Tenor" className="w-full sm:w-1/4">
                                    <Select
                                        placeholder="Pilih Jenis Tenor"
                                        value={selectedTenorType}
                                        onChange={handleTenorTypeChange}
                                        className="w-full"
                                    >
                                        <Option value="monthly">Bulanan</Option>
                                        <Option value="yearly">Tahunan</Option>
                                        <Option value="cash">Cash</Option>
                                    </Select>
                                </Form.Item>
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
                            {selectedTenorType === 'monthly' && dataSource.filter(record => !record.isTenor).map((record, index) => {
                                const keyIndex = dataSource.findIndex(item => item.key === record.key);
                                return (
                                    <div key={record.key}>
                                        {renderMonthlyTenor(record, keyIndex)}
                                    </div>
                                );
                            })}
                            {(selectedTenorType === 'yearly' || selectedTenorType === 'cash') && (
                                <Table
                                    columns={columns}
                                    dataSource={dataSource}
                                    pagination={false}
                                    scroll={{ x: 'max-content' }}
                                    rowClassName={(record) => (record.isTenor ? 'bg-blue-50' : record.isDP ? 'bg-green-50' : '')}
                                />
                            )}
                            {selectedTenorType && (
                                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center">
                                    <Button
                                        type="dashed"
                                        onClick={handleAddRow}
                                        icon={<PlusIcon className="w-5 h-5 inline-block mr-2" />}
                                        className="mb-4 sm:mb-0"
                                    >
                                        Tambah Produk
                                    </Button>
                                    <div className="text-left sm:text-right mb-2">
                                        <strong>Grand Total: {calculateGrandTotal().toLocaleString('id-ID', {
                                            style: 'currency',
                                            currency: 'IDR',
                                            minimumFractionDigits: calculateGrandTotal() % 1 !== 0 ? 2 : 0,
                                            maximumFractionDigits: 2
                                        })}</strong>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    {selectedBrand !== 'AUTO' && (
                        <>
                            <Table
                                columns={columns}
                                dataSource={dataSource}
                                pagination={false}
                                scroll={{ x: 'max-content' }}
                                rowClassName={(record) => (record.isTenor ? 'bg-blue-50' : record.isDP ? 'bg-green-50' : '')}
                            />
                            <div className="mt-4 flex flex-col sm:flex-row justify-between items-center">
                                <Button
                                    type="dashed"
                                    onClick={handleAddRow}
                                    icon={<PlusIcon className="w-5 h-5 inline-block mr-2" />}
                                    className="mb-4 sm:mb-0"
                                >
                                    Tambah Produk
                                </Button>
                                <div className="text-left sm:text-right mb-2">
                                    <strong>Grand Total: {calculateGrandTotal().toLocaleString('id-ID', {
                                        style: 'currency',
                                        currency: 'IDR',
                                        minimumFractionDigits: calculateGrandTotal() % 1 !== 0 ? 2 : 0,
                                        maximumFractionDigits: 2
                                    })}</strong>
                                </div>
                            </div>
                        </>
                    )}
                </Card>

                <div className="flex justify-end mt-4">
                    <Button
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-md w-full sm:w-auto"
                        onClick={showConfirmModal}
                        loading={loading}
                        disabled={loading || isFetching}
                    >
                        Simpan Perubahan
                    </Button>
                </div>

                <Modal
                    title="Konfirmasi Perubahan Order"
                    open={modalVisible}
                    onOk={handleModalOk}
                    onCancel={handleModalCancel}
                    footer={[
                        <Button key="cancel" type="default" onClick={handleModalCancel}>
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
                        </Button>
                    ]}
                >
                    <p>Apakah Anda yakin ingin menyimpan perubahan pada order ini?</p>
                </Modal>
            </div>
        </Spin>
    );
};

export default EditOrder;