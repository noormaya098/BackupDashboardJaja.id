import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Button,
  DatePicker,
  Input,
  Select,
  Table,
  Tag,
  Form,
  InputNumber,
  Typography,
  Card,
  Modal,
  notification,
  Spin
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  UserOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/id';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import LogoJaja from '../../../assets/LogoJaja.png';
import LogoJajaAuto from '../../../assets/JajaAuto.png';
import { baseUrl } from '@/configs';

moment.locale('id');
dayjs.locale('id');

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

// Helper function to format error messages
const formatErrorMessage = (result) => {
  let errorMessage = result.message || 'Terjadi kesalahan';

  // Check if there are detailed error messages
  if (result.error && result.error.error_full_messages && Array.isArray(result.error.error_full_messages)) {
    // Simplify the error messages for better readability
    const simplifiedDetails = result.error.error_full_messages.map(msg => {
      // Clean up common error message patterns
      if (msg.includes('Product di transaction lines attributes untuk baris ke-') && msg.includes('tidak tersedia')) {
        const match = msg.match(/baris ke-(\d+)/);
        if (match) {
          return `Product baris ke-${match[1]} di transaction tidak tersedia`;
        }
      }
      if (msg.includes('person') && msg.includes('not exist')) {
        return 'Customer tidak ditemukan di sistem';
      }
      return msg;
    });

    return {
      title: result.message,
      details: simplifiedDetails,
      hasDetails: true
    };
  } else if (result.error && typeof result.error === 'object') {
    // Handle other error object structures and simplify them
    const errorDetails = Object.entries(result.error)
      .filter(([key, value]) => key !== 'id' && value)
      .map(([key, value]) => {
        // Simplify common error patterns
        if (key.includes('Product di transaction_lines_attributes untuk baris ke-') && value === 'tidak tersedia') {
          const match = key.match(/baris ke-(\d+)/);
          if (match) {
            return `Product baris ke-${match[1]} di transaction tidak tersedia`;
          }
        }
        if (key.includes('person') && value === 'not exist') {
          return 'Customer tidak ditemukan di sistem';
        }
        return `${key}: ${value}`;
      });

    if (errorDetails.length > 0) {
      return {
        title: result.message,
        details: errorDetails,
        hasDetails: true
      };
    }
  }

  return {
    title: errorMessage,
    details: [],
    hasDetails: false
  };
};

const InvoicePage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState({});
  const [products, setProducts] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [editForm] = Form.useForm();
  const [isEditMode, setIsEditMode] = useState(false);
  const [productList, setProductList] = useState([]);
  const [companyList, setCompanyList] = useState([]);
  const [isModalLoading, setIsModalLoading] = useState(false);

  // Comment History State
  const [historyKomentar, setHistoryKomentar] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [newKomentar, setNewKomentar] = useState('');
  const [isSubmittingKomentar, setIsSubmittingKomentar] = useState(false);

  const { id_invoice } = useParams();

  const handleCompanyChange = (value) => {
    const selectedCompany = companyList.find(company => company.id_company === value);
    if (selectedCompany) {
      form.setFieldsValue({
        customerType: selectedCompany.id_company,
        customerFirstName: selectedCompany.person_first_name || "",
        customerMiddleName: selectedCompany.person_middle_name || "",
        customerLastName: selectedCompany.person_last_name || "",
        phoneNumber: selectedCompany.person_phone || "",
        customerAddress: selectedCompany.person_address || "",
      });
    }
  };

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const requestOptions = { method: "GET", redirect: "follow" };
        const response = await fetch(`${baseUrl}/nimda/company/get-company?limit=2000`, requestOptions);
        const result = await response.json();

        if (result.code === 200 && result.data) {
          setCompanyList(result.data);
          console.log("Total perusahaan yang diambil:", result.data.length);
        } else {
          console.error("Gagal mengambil data:", result.message || "Tidak ada data");
        }
      } catch (error) {
        console.error("Error fetching company data:", error);
      }
    };

    fetchCompany();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const requestOptions = { method: "GET", redirect: "follow" };
        const response = await fetch(
          `${baseUrl}/nimda/master_product?limit=50000`,
          requestOptions
        );
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
      }
    };
    fetchProducts();
  }, []);

  const fetchInvoiceData = async (invoiceId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseUrl}/nimda/invoice/detail-invoice?id_invoice=${invoiceId}`, {
        headers: {
          Authorization: token && token.startsWith('Bearer ') ? token : `${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (result.code === 200) {
        const data = result.data;

        // Parsing tanggal dengan format "DD MMM YYYY"
        const transactionDate = data.transaction_date
          ? dayjs(data.transaction_date, "DD MMM YYYY")
          : null;
        const dueDate = data.due_date
          ? dayjs(data.due_date, "DD MMM YYYY")
          : null;

        // Mengisi invoiceData dengan data dari API
        setInvoiceData({
          invoiceNumber: data.transaction_no || "N/A",
          mdNumber: data.transaction_no || "N/A",
          status: data.payment_status || "N/A",
          paymentStatus: data.payment_status || "Open",
          salesInfo: data.id_data ? `SLS-${data.id_data}` : "N/A",
          businessType: "",
          customerType: data.company?.id_company || "",
          customerFirstName: data.company?.person_first_name || "",
          customerMiddleName: data.company?.person_middle_name || "",
          customerLastName: data.company?.person_last_name || "",
          pengiriman: data.pengiriman || "Raja Cepat",
          phoneNumber: data.company?.person_phone || "",
          brand: data.brand || 'DEFAULT',
          transactionDate: transactionDate,
          paymentTerms: dueDate && transactionDate
            ? `Top ${dueDate.diff(transactionDate, "day")}`
            : "",
          dueDate: dueDate,
          customerAddress: data.shipping_address || "",
          note: data.memo || "",
          subtotal: Number(data.summary?.total_dpp ?? data.subtotal ?? 0),
          tax: Number(data.summary?.total_ppn ?? data.tax_price ?? 0),
          total_ongkir: Number(data.summary?.shipping_price ?? data.shipping_price ?? 0),
          grandTotal: Number(data.summary?.grand_total ?? data.grandtotal ?? 0),
          amount_remaining: Number(data.amount_remaining || 0),
          insurance: 0,
          discount: 0,
          point: 0,
          id_toko: data.company?.id_company || "",
          id_customer: data.id_data || "",
          platform: "Direct",
          companyEmail: data.company?.person_email || "finance@jaja.id",
          companyId: data.company?.id_company || "+624540647061000",
          companyName: data.company?.company_name,
          tracking_no: data.tracking_no || "JNE1234567890",
          shipping_date: data.shipping_date || "2024-06-01",
          id_sales_invoice: data.id_sales_invoice || null,
        });

        // Mapping produk dari dataProduk
        const mappedProducts = data.dataProduk && Array.isArray(data.dataProduk)
          ? data.dataProduk.map((detail, index) => ({
            key: detail.id_invoice_detail || Date.now() + index,
            no: index + 1,
            product: detail.product_name || "N/A",
            description: detail.product_description || "N/A",
            qty: parseInt(detail.quantity) || 0,
            unit: "Item",
            price: Number(detail.price || 0),
            dpp: Number(detail.dpp || 0),
            discount: Number(detail.discount || 0),
            tax: detail.tax_type || "N/A",
            ppn: Number(detail.ppn_nominal || 0), // Use ppn_nominal correctly
            amount: Number(detail.amount || 0),
            taxable: parseFloat(detail.tax_type) > 0 ? 1 : 0, // Derive taxable from tax_type
          }))
          : [];

        setProducts(mappedProducts);

        // Update nilai form dengan data terbaru
        form.setFieldsValue({
          invoiceNumber: data.transaction_no || "N/A",
          customerType: data.company?.id_company || "",
          customerFirstName: data.company?.person_first_name || "",
          customerMiddleName: data.company?.person_middle_name || "",
          customerLastName: data.company?.person_last_name || "",
          pengiriman: data.pengiriman || "Raja Cepat",
          phoneNumber: data.company?.person_phone || "",
          transactionDate: transactionDate,
          paymentTerms: dueDate && transactionDate
            ? `Top ${dueDate.diff(transactionDate, "day")}`
            : "",
          dueDate: dueDate,
          customerAddress: data.shipping_address || "",
          note: data.memo || "",
          paymentStatus: data.payment_status || "Open",
        });
      } else {
        console.error('Gagal mengambil data:', result.message);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (id_invoice && companyList.length > 0) {
      fetchInvoiceData(id_invoice);
    }
  }, [id_invoice, companyList]);

  // Fetch history komentar
  const fetchHistory = async () => {
    if (!id_invoice) return;
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${baseUrl}/nimda/delivery-order/invoice/history/${id_invoice}`,
        {
          headers: {
            Authorization: token && token.startsWith('Bearer ') ? token : `${token}`
          },
        }
      );
      if (response.data.status === 200) {
        setHistoryKomentar(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (id_invoice) {
      fetchHistory();
    }
  }, [id_invoice]);

  const handleSubmitKomentar = async () => {
    if (!newKomentar.trim()) return;
    setIsSubmittingKomentar(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        method: 'post',
        url: `${baseUrl}/nimda/delivery-order/invoice/history`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token && token.startsWith('Bearer ') ? token : `${token}`
        },
        data: JSON.stringify({
          "id_invoice": parseInt(id_invoice),
          "komentar": newKomentar
        })
      };

      const response = await axios.request(config);

      if (response.data.status === 200 || response.data.status === 201 || response.data.success) {
        notification.success({
          message: 'Sukses',
          description: response.data.message || 'Komentar berhasil ditambahkan'
        });
        setNewKomentar('');
        fetchHistory();
        await fetchInvoiceData(id_invoice);
      } else {
        throw new Error(response.data.message || 'Gagal menambahkan komentar');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      notification.error({
        message: 'Gagal',
        description: error.response?.data?.message || error.message || 'Terjadi kesalahan saat menambahkan komentar'
      });
    } finally {
      setIsSubmittingKomentar(false);
    }
  };

  const calculateAmount = (values) => {
    const qty = values.qty || 0;
    const price = values.price || 0;
    const discount = values.discount || 0;
    const tax = parseFloat(values.tax) || 0;

    const subtotal = qty * price;
    const taxAmount = subtotal * (tax / 100);
    const total = subtotal - discount + taxAmount;

    return total;
  };

  const handleAddItem = () => {
    setIsEditMode(false);
    setSelectedProduct(null);
    editForm.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setIsEditMode(true);
    setSelectedProduct(record);
    editForm.setFieldsValue({
      product: record.product,
      amount: record.amount,
      discount: record.discount,
      qty: record.qty,
      price: record.price,
      tax: record.tax === 'N/A' ? 0 : record.tax,
      description: record.description,
      taxable: parseFloat(record.tax) > 0 ? 1 : 0, // Map from tax value
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      setIsModalLoading(true);
      await editForm.validateFields();
      const values = editForm.getFieldsValue();
      const amount = calculateAmount(values);
      const token = localStorage.getItem('token');
      const cutoffDate = moment('2025-03-01');
      const createdDate = moment(invoiceData.transactionDate);
      const isAfterMarch2025 = createdDate.isAfter(cutoffDate);
      const isPlatformDirect = invoiceData.platform === "Direct";

      let payload;
      let apiUrl;
      let method;

      const selectedProductData = productList.find(p => p.id === values.product);

      if (isEditMode && selectedProduct) {
        apiUrl = `${baseUrl}/nimda/delivery-order/update-invoice-new`;
        payload = {
          "id_invoice": parseInt(id_invoice),
          "items": [
            {
              "id_invoice_detail": selectedProduct.key,
              "product_description": values.description,
              "taxable": values.taxable
            }
          ]
        };
        method = 'PUT';
      } else {
        if (isPlatformDirect) {
          apiUrl = `${baseUrl}/nimda/invoice/create-transaksi-direct`;
          payload = {
            id_invoice: parseInt(id_invoice),
            id_data: invoiceData.id_customer || "",
            product_id: values.product,
            product_name: selectedProductData?.name || '',
            product_description: values.description || '',
            quantity: values.qty || 0,
            rate: values.price || 0,
            discount: values.discount || 0,
            amount: amount || 0,
            tax_type: values.tax ? `${values.tax}.00` : '0.00'
          };
          method = 'POST';
        } else {
          apiUrl = `${baseUrl}/nimda/invoice/create-transaksi-detail`;
          payload = {
            id_invoice: id_invoice,
            id_data: invoiceData.id_customer || "",
            order_id: invoiceData.mdNumber || '',
            invoice: invoiceData.invoiceNumber || '',
            nama_produk: values.product || '',
            qty: values.qty || 0,
            harga_awal: values.price || 0,
            harga_aktif: values.price || 0,
            total: amount || 0,
            deskripsi: values.description || '',
            sub_total: (values.qty * values.price) || 0,
            ongkir: parseInt(invoiceData.total_ongkir) || 0,
            expedisi: invoiceData.pengiriman || 'Raja Cepat',
            nama_toko: invoiceData.details?.[0]?.nama_toko || '',
            id_toko: parseInt(invoiceData.id_toko) || 0,
            id_customer: parseInt(invoiceData.id_customer) || 0,
            created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
            discount: values.discount || 0,
            id_kategori: values.id_kategori || 1,
          };
          method = 'POST';
        }
      }

      console.log('Payload yang dikirim:', payload);

      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          Authorization: token && token.startsWith('Bearer ') ? token : `${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('Response dari API:', result);

      if ((response.status === 200 || response.status === 201) && (result.code === 200 || result.success)) {
        const newData = {
          key: isEditMode && selectedProduct ? selectedProduct.key : result.data.id_transaksi_direct,
          no: isEditMode && selectedProduct ? selectedProduct.no : products.length + 1,
          product: selectedProductData?.name || values.product,
          description: values.description || '',
          qty: values.qty || 0,
          unit: 'Item',
          price: values.price || 0,
          dpp: (values.qty || 0) * (values.price || 0),
          discount: values.discount || 0,
          tax: isPlatformDirect ? (values.tax ? `${values.tax}.00` : '0.00') : 'N/A',
          ppn: values.tax ? ((values.qty || 0) * (values.price || 0) * (parseFloat(values.tax) / 100)) : 0,
          amount: amount,
          taxable: values.taxable || 0,
        };

        console.log('Data baru untuk tabel:', newData);

        if (isEditMode && selectedProduct) {
          const updatedProducts = products.map(item =>
            item.key === selectedProduct.key ? newData : item
          );
          setProducts(updatedProducts);
        } else {
          setProducts(prevProducts => [...prevProducts, newData]);
        }

        await fetchInvoiceData(id_invoice);

        Modal.success({
          title: 'Sukses',
          content: result.message || (isEditMode ? 'Item berhasil diperbarui!' : 'Item berhasil ditambahkan!'),
          okButtonProps: { className: 'bg-blue-500 hover:bg-blue-600 text-white' },
        });
      } else {
        // Handle error response with detailed error messages
        const errorInfo = formatErrorMessage(result);

        let errorContent = errorInfo.title;
        if (errorInfo.hasDetails) {
          errorContent = (
            <div>
              <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>{errorInfo.title}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                <strong>Detail Error:</strong>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  {errorInfo.details.map((msg, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>{msg}</li>
                  ))}
                </ul>
              </div>
            </div>
          );
        }

        Modal.error({
          title: 'Gagal',
          content: errorContent,
          okButtonProps: { className: 'bg-red-500 hover:bg-red-600 text-white' },
          width: 500,
        });
        return; // Exit early to prevent further processing
      }

      setIsModalVisible(false);
    } catch (error) {
      console.error('Error handling item:', error);
      Modal.error({
        title: 'Gagal',
        content: error.message || 'Terjadi kesalahan saat memproses item',
        okButtonProps: { className: 'bg-red-500 hover:bg-red-600 text-white' },
      });
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleExportJournal = () => {
    Modal.confirm({
      title: 'Konfirmasi',
      content: 'Apakah Anda yakin ingin mengekspor invoice ini ke JurnalID?',
      okText: 'Yakin',
      okButtonProps: { className: 'bg-green-500 hover:bg-green-600 text-white' },
      cancelText: 'Batal',
      cancelButtonProps: { className: 'hover:bg-gray-100' },
      onOk: async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem('token');

          // Step 1: Try to create sales invoice
          const salesInvoicePayload = {
            id_invoice: parseInt(id_invoice),
          };

          const salesInvoiceResponse = await fetch(`${baseUrl}/nimda/new/invoice/create-sales-invoice`, {
            method: 'POST',
            headers: {
              Authorization: token && token.startsWith('Bearer ') ? token : `${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(salesInvoicePayload),
          });

          const salesInvoiceResult = await salesInvoiceResponse.json();
          console.log('Sales Invoice API Response:', { status: salesInvoiceResponse.status, result: salesInvoiceResult });

          if (salesInvoiceResponse.status === 200 && salesInvoiceResult.success !== false) {
            await fetchInvoiceData(id_invoice);
            Modal.success({
              title: 'Sukses',
              content: salesInvoiceResult.message || 'Invoice berhasil diekspor ke JurnalID!',
              okButtonProps: { className: 'bg-green-500 hover:bg-green-600 text-white' },
            });
          } else {
            // Check if error is "person not exist" (consider detailed messages too)
            const errorMessage = salesInvoiceResult.message || '';
            const detailedMessages = (salesInvoiceResult.error && salesInvoiceResult.error.error_full_messages && Array.isArray(salesInvoiceResult.error.error_full_messages))
              ? salesInvoiceResult.error.error_full_messages
              : (salesInvoiceResult.error && typeof salesInvoiceResult.error === 'object')
                ? Object.values(salesInvoiceResult.error)
                : [];
            const allMessages = [errorMessage, ...detailedMessages].filter(Boolean).map(String);
            const isPersonNotExist = allMessages.some(msg => /person\s*.*\s*not exist/i.test(msg) || /person does not exist/i.test(msg));

            if (isPersonNotExist) {
              // Step 2: Show error modal with green OK button and simplified error
              const formattedContent = (
                <div>
                  <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Gagal kirim ke Mekari</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    <strong>Detail Error:</strong>
                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                      {allMessages.length > 0 ? allMessages.map((msg, idx) => {
                        // Simplify the error message
                        let simplifiedMsg = msg;
                        if (msg.includes('Product di transaction lines attributes untuk baris ke-') && msg.includes('tidak tersedia')) {
                          const match = msg.match(/baris ke-(\d+)/);
                          if (match) {
                            simplifiedMsg = `Product baris ke-${match[1]} di transaction tidak tersedia`;
                          }
                        }
                        if (msg.includes('person') && msg.includes('not exist')) {
                          simplifiedMsg = 'Customer tidak ditemukan di sistem';
                        }
                        return <li key={idx} style={{ marginBottom: '4px' }}>{simplifiedMsg}</li>;
                      }) : <li>Tidak ada detail.</li>}
                    </ul>
                  </div>
                </div>
              );
              Modal.error({
                title: 'Gagal',
                content: formattedContent,
                okButtonProps: { className: 'bg-green-500 hover:bg-green-600 text-white' },
                onOk: async () => {
                  try {
                    setLoading(true);

                    // Step 3: Create customer in Jurnal
                    const createCustomerPayload = {
                      id_invoice: parseInt(id_invoice),
                    };

                    const createCustomerResponse = await fetch(`${baseUrl}/nimda/new/invoice/create-customer-jurnal`, {
                      method: 'POST',
                      headers: {
                        Authorization: token && token.startsWith('Bearer ') ? token : `${token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(createCustomerPayload),
                    });

                    const createCustomerResult = await createCustomerResponse.json();
                    console.log('Create Customer API Response:', { status: createCustomerResponse.status, result: createCustomerResult });

                    if (createCustomerResponse.status === 200 && createCustomerResult.success !== false) {
                      // Step 4: Wait 5 seconds, then try create sales invoice again
                      await new Promise(resolve => setTimeout(resolve, 5000));
                      const retrySalesInvoiceResponse = await fetch(`${baseUrl}/nimda/new/invoice/create-sales-invoice`, {
                        method: 'POST',
                        headers: {
                          Authorization: token && token.startsWith('Bearer ') ? token : `${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(salesInvoicePayload),
                      });

                      const retrySalesInvoiceResult = await retrySalesInvoiceResponse.json();
                      console.log('Retry Sales Invoice API Response:', { status: retrySalesInvoiceResponse.status, result: retrySalesInvoiceResult });

                      if (retrySalesInvoiceResponse.status === 200 && retrySalesInvoiceResult.success !== false) {
                        await fetchInvoiceData(id_invoice);
                        Modal.success({
                          title: 'Sukses',
                          content: retrySalesInvoiceResult.message || 'Invoice berhasil diekspor ke JurnalID!',
                          okButtonProps: { className: 'bg-green-500 hover:bg-green-600 text-white' },
                        });
                      } else {
                        const retryErrorInfo = formatErrorMessage(retrySalesInvoiceResult);

                        let retryErrorContent = retryErrorInfo.title;
                        if (retryErrorInfo.hasDetails) {
                          retryErrorContent = (
                            <div>
                              <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>{retryErrorInfo.title}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                <strong>Detail Error:</strong>
                                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                                  {retryErrorInfo.details.map((msg, index) => (
                                    <li key={index} style={{ marginBottom: '4px' }}>{msg}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          );
                        }

                        Modal.error({
                          title: 'Gagal',
                          content: retryErrorContent,
                          okButtonProps: { className: 'bg-red-500 hover:bg-red-600 text-white' },
                          width: 500,
                        });
                      }
                    } else {
                      const customerErrorInfo = formatErrorMessage(createCustomerResult);

                      let customerErrorContent = customerErrorInfo.title;
                      if (customerErrorInfo.hasDetails) {
                        customerErrorContent = (
                          <div>
                            <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>{customerErrorInfo.title}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              <strong>Detail Error:</strong>
                              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                                {customerErrorInfo.details.map((msg, index) => (
                                  <li key={index} style={{ marginBottom: '4px' }}>{msg}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      }

                      Modal.error({
                        title: 'Gagal',
                        content: customerErrorContent,
                        okButtonProps: { className: 'bg-red-500 hover:bg-red-600 text-white' },
                        width: 500,
                      });
                    }
                  } catch (error) {
                    console.error('Error in retry process:', error);
                    Modal.error({
                      title: 'Gagal',
                      content: error.message || 'Terjadi kesalahan saat memproses ulang',
                      okButtonProps: { className: 'bg-red-500 hover:bg-red-600 text-white' },
                    });
                  } finally {
                    setLoading(false);
                  }
                },
              });
            } else {
              // Handle other errors normally with simplified display
              const salesErrorInfo = formatErrorMessage(salesInvoiceResult);

              let salesErrorContent = salesErrorInfo.title;
              if (salesErrorInfo.hasDetails) {
                salesErrorContent = (
                  <div>
                    <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>{salesErrorInfo.title}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      <strong>Detail Error:</strong>
                      <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                        {salesErrorInfo.details.map((msg, index) => (
                          <li key={index} style={{ marginBottom: '4px' }}>{msg}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              }

              Modal.error({
                title: 'Gagal',
                content: salesErrorContent,
                okButtonProps: { className: 'bg-red-500 hover:bg-red-600 text-white' },
                width: 500,
              });
            }
          }
        } catch (error) {
          console.error('Error exporting to Sales Invoice:', error);
          Modal.error({
            title: 'Gagal',
            content: error.message || 'Terjadi kesalahan saat mengekspor invoice ke Sales Invoice',
            okButtonProps: { className: 'bg-red-500 hover:bg-red-600 text-white' },
          });
        } finally {
          setLoading(false);
        }
      },
      onCancel: () => {
        console.log('Ekspor ke JurnalID dibatalkan');
      },
    });
  };

  const handleProductChange = (value) => {
    const selectedProduct = productList.find((product) => product.id === value);
    if (selectedProduct) {
      editForm.setFieldsValue({
        product: selectedProduct.id,
        price: parseFloat(selectedProduct.sell_price) || 0,
      });
    }
  };

  const handlePrintInvoice = () => {
    const calculatedSubtotal = calculateSubtotal();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
    <html>
      <head>
        <title>Invoice - ${invoiceData.invoiceNumber}</title>
        <style>
          * {
            box-sizing: border-box;
          }
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              color: #000;
              width: 210mm;
              height: 297mm;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              background-color: #fff;
            }
            .invoice-container {
              width: 190mm;
              padding: 10mm;
              background-color: #fff;
              font-size: 10pt;
              margin: 0 auto;
            }
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #000;
            background-color: #fff;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
          }
          .invoice-container {
            width: 100%;
            max-width: 190mm;
            padding: 20px;
            background-color: #fff;
            font-size: 10pt;
            position: relative;
            margin: 0 auto;
          }
          .flex {
            display: flex;
            flex-wrap: wrap;
          }
          .justify-between {
            justify-content: space-between;
          }
          .items-center {
            align-items: center;
          }
          .mb-2 {
            margin-bottom: 8px;
          }
          .mb-3 {
            margin-bottom: 12px;
          }
          .text-xs {
            font-size: 9pt;
          }
          .text-sm {
            font-size: 10pt;
          }
          .text-md {
            font-size: 12pt;
          }
          .font-bold {
            font-weight: bold;
          }
          .font-semibold {
            font-weight: 600;
          }
          .mt-2 {
            margin-top: 8px;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .my-3 {
            margin-top: 12px;
            margin-bottom: 12px;
          }
          .flex-grow {
            flex-grow: 1;
          }
          .border-t {
            border-top: 1px solid;
          }
          .border-gray-300 {
            border-color: #d1d5db;
          }
          .mx-2 {
            margin-left: 8px;
            margin-right: 8px;
          }
          .border {
            border: 1px solid;
          }
          .border-gray-800 {
            border-color: #1f2937;
          }
          .p-1 {
            padding: 4px;
          }
          .w-full {
            width: 100%;
          }
          .border-collapse {
            border-collapse: collapse;
          }
          .w-12 {
            width: 48px;
          }
          .w-20 {
            width: 80px;
          }
          .justify-end {
            justify-content: flex-end;
          }
          .w-1/2 {
            width: 50%;
          }
          .border-b {
            border-bottom: 1px solid;
          }
          .py-1 {
            padding-top: 4px;
            padding-bottom: 4px;
          }
          .pt-1 {
            padding-top: 4px;
          }
          .inline-block {
            display: inline-block;
          }
          .w-48 {
            width: 192px;
          }
          .uppercase {
            text-transform: uppercase;
          }
          .footer-section {
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .notes-container {
            width: 60%;
          }
          .signature-container {
            width: 35%;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            height: 100%;
          }
          .signature-name {
            margin-top: 40px;
            margin-bottom: 0;
          }
          .logo-jaja {
            height: 40px; /* Match the height as specified */
            width: auto;
          }
          .company-address p {
            margin: 2px 0;
          }
          .box-wide {
            width: 49%;
            display: flex;
            flex-direction: column;
            height: 100%;
            min-height: 120px;
            box-sizing: border-box;
          }
          .flex-tight {
            gap: 8px;
            align-items: stretch;
          }
          .label-colon {
            display: inline-block;
            width: 100px;
          }
          .notes-box {
            border: 1px solid #1f2937;
            padding: 4px 8px;
            margin-bottom: 4px;
          }
          .notes-box h3 {
            margin: 0 0 2px 0;
            font-size: 10pt;
            font-weight: bold;
          }
          .notes-box p {
            margin: 0;
            font-size: 9pt;
            line-height: 1.2;
          }
          .customer-box, .due-date-box {
            border: 1px solid #1f2937;
            padding: 8px;
            min-height: 120px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            height: 100%;
            box-sizing: border-box;
            flex: 1 1 auto;
          }
          .box-title {
            margin-bottom: 4px;
            font-size: 10pt;
            font-weight: bold;
            margin-bottom: 0;
          }
          .customer-box p, .due-date-box p {
            margin: 4px 0;
            font-size: 9pt;
            display: flex;
            align-items: flex-start;
            margin-bottom: 0;
          }
          .label-colon {
            display: inline-block;
            width: 100px;
            flex-shrink: 0;
          }
          .content-text {
            flex: 1;
            word-wrap: break-word;
            word-break: break-word;
          }
          /* New styles for logo positioning */
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
          }
          .logo-container {
            text-align: right;
          }
          @media screen and (max-width: 600px) {
            body {
              padding: 10px;
              background-color: #fff;
            }
            .invoice-container {
              width: 100%;
              padding: 10px;
              font-size: 8pt;
            }
            .text-md {
              font-size: 10pt;
            }
            .text-sm {
              font-size: 8pt;
            }
            .text-xs {
              font-size: 7pt;
            }
            .mb-3 {
              margin-bottom: 8px;
            }
            .my-3 {
              margin-top: 8px;
              margin-bottom: 8px;
            }
            .p-1 {
              padding: 2px;
            }
            .flex {
              flex-direction: column;
            }
            .justify-between {
              justify-content: flex-start;
            }
            .text-right {
              text-align: left;
            }
            .w-1/2 {
              width: 100%;
            }
            .w-12 {
              width: 30px;
            }
            .w-20 {
              width: 60px;
            }
            .w-48 {
              width: 120px;
            }
            .footer-section {
              margin-top: 16px;
              flex-direction: column;
              align-items: flex-start;
            }
            .notes-container {
              width: 100%;
            }
            .signature-container {
              width: 100%;
              margin-top: 8px;
              text-align: center;
            }
            .signature-name {
              margin-top: 2px;
            }
            .logo-jaja {
              height: 30px;
            }
            .company-address p {
              margin: 1px 0;
            }
            .box-wide {
              width: 100%;
              display: flex;
              flex-direction: column;
              height: auto;
              min-height: 70px;
              box-sizing: border-box;
            }
            .flex-tight {
              gap: 4px;
            }
            .label-colon {
              width: 60px;
            }
            .notes-box {
              padding: 2px 4px;
              margin-bottom: 2px;
            }
            .notes-box h3 {
              font-size: 8pt;
              margin-bottom: 1px;
            }
            .notes-box p {
              font-size: 7pt;
              line-height: 1.1;
            }
            .customer-box, .due-date-box {
              padding: 4px;
              min-height: 70px;
              height: auto;
              box-sizing: border-box;
              flex: 1 1 auto;
              justify-content: center;
            }
            .box-title {
              font-size: 8pt;
            }
            .customer-box p, .due-date-box p {
              font-size: 7pt;
              display: flex;
              align-items: flex-start;
            }
            .label-colon {
              display: inline-block;
              width: 60px;
              flex-shrink: 0;
            }
            .content-text {
              flex: 1;
              word-wrap: break-word;
              word-break: break-word;
            }
            .header-container {
              flex-direction: column;
              align-items: center;
            }
            .logo-container {
              text-align: center;
              margin-top: 8px;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header -->
          <div class="header-container">
            <div style="width: 100%; display: flex; flex-direction: column; align-items: flex-start;">
              <img 
                src="${invoiceData.brand === 'AUTO' ? LogoJajaAuto : LogoJaja}" 
                alt="${invoiceData.brand === 'AUTO' ? 'JajaAuto' : 'Jaja.id'}" 
                style="height: 60px; margin-bottom: 8px;"
              />
              <h2 class="text-md font-bold" style="margin-bottom: 2px;">PT JAJA USAHA LAKU</h2>
              <div style="display: flex; width: 100%; justify-content: space-between; align-items: flex-start;">
                <div class="company-address">
                  <p class="text-xs">Jl. H. Baping No.100, RT.6/RW.9</p>
                  <p class="text-xs">Ciracas, Kec. Ciracas, Kota Jakarta Timur,</p>
                  <p class="text-xs">Daerah Khusus Ibukota Jakarta, 13740</p>
                  <p class="text-xs">Email: ${invoiceData.companyEmail || 'finance@jaja.id'}</p>
                  <p class="text-xs">www.jaja.id</p>
                </div>
                <div class="text-right" style="min-width: 180px;">
                  <p class="text-sm"><span class="font-semibold">FAKTUR #</span> : ${invoiceData.invoiceNumber || 'Tidak Tersedia'}</p>
                  <p class="text-sm"><span class="font-semibold">TANGGAL</span> : ${invoiceData.transactionDate ? invoiceData.transactionDate.format('DD-MM-YYYY') : 'Tidak Tersedia'}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Divider line with FAKTUR in the middle -->
          <div class="flex items-center my-3" style="justify-content: flex-start;">
            <div style="flex: 0 0 35%; border-top: 1.5px solid #d1d5db;"></div>
            <span class="mx-4 font-bold text-md" style="min-width: 120px; text-align: center;">FAKTUR</span>
            <div style="flex: 1; border-top: 1.5px solid #d1d5db;"></div>
          </div>

          <!-- Customer and Due Date Section -->
          <div class="flex flex-tight justify-between mb-3">
            <div class="box-wide">
              <h3 class="box-title">PELANGGAN</h3>
              <div class="customer-box">
                <p><span class="label-colon">Nama</span><span class="content-text">: ${invoiceData.customerFirstName || 'Tidak Tersedia'} ${invoiceData.customerMiddleName || ''} ${invoiceData.customerLastName || ''}</span></p>
                <p><span class="label-colon">Company</span><span class="content-text">: ${invoiceData.companyName}</span></p>
                <p><span class="label-colon">Alamat</span><span class="content-text">: ${invoiceData.customerAddress || 'Tidak Tersedia'}</span></p>
              </div>
            </div>
            <div class="box-wide">
              <h3 class="box-title">INFORMASI</h3>
              <div class="due-date-box">
                <p><span class="label-colon">JATUH TEMPO</span><span class="content-text">: ${invoiceData.dueDate ? invoiceData.dueDate.format('DD-MM-YYYY') : 'Tidak Tersedia'}</span></p>
                <p><span class="label-colon">TAGS</span><span class="content-text">: Jaja</span></p>
              </div>
            </div>
          </div>

          <!-- Invoice Table -->
          <table class="w-full border-collapse mb-3">
            <thead>
              <tr>
                <th class="border border-gray-800 p-1 text-center w-12 text-xs">NO.</th>
                <th class="border border-gray-800 p-1 text-center text-xs">KETERANGAN</th>
                <th class="border border-gray-800 p-1 text-center w-12 text-xs">QTY</th>
                <th class="border border-gray-800 p-1 text-center text-xs">Price</th>
                <th class="border border-gray-800 p-1 text-center w-20 text-xs">DISKON</th>
                <th class="border border-gray-800 p-1 text-center text-xs">PPN</th>
                <th class="border border-gray-800 p-1 text-center text-xs">JUMLAH</th>
              </tr>
            </thead>
            <tbody>
              ${products && products.length > 0
        ? products.map((item, index) => `
                      <tr>
                        <td class="border border-gray-800 p-1 text-center">${index + 1}</td>
                        <td class="border border-gray-800 p-1 text-xs">${item.product || 'N/A'}<br />${item.description || ''}</td>
                        <td class="border border-gray-800 p-1 text-center text-xs">${item.qty || 0} ${item.unit || 'Unit'}</td>
                        <td class="border border-gray-800 p-1 text-right text-xs">${Number(item.dpp || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="border border-gray-800 p-1 text-center text-xs">${item.discount ? `${item.discount.toLocaleString('id-ID')}%` : '0.0%'}</td>
                        <td class="border border-gray-800 p-1 text-right text-xs">${Number(item.ppn || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="border border-gray-800 p-1 text-right text-xs">${Number(item.amount || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    `).join('')
        : '<tr><td colspan="6" class="border border-gray-800 p-1 text-center text-xs">Tidak ada data produk</td></tr>'
      }
            </tbody>
          </table>

          <!-- Totals Section -->
         <div class="flex justify-end mb-3">
  <div class="w-1/2">
    <div class="py-1" style="border-bottom: 1px solid #000;">
      <div style="display: flex; align-items: center;">
        <span class="text-sm" style="min-width: 100px;">Subtotal</span>
        <span style="flex: 1 1 auto;"></span>
        <span class="text-sm" style="min-width: 120px; text-align: right;">${Number(invoiceData.subtotal || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    </div>
    <div class="py-1" style="border-bottom: 1px solid #000;">
      <div style="display: flex; align-items: center;">
        <span class="text-sm" style="min-width: 100px;">PPN</span>
        <span style="flex: 1 1 auto;"></span>
        <span class="text-sm" style="min-width: 120px; text-align: right;">${Number(invoiceData.tax || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    </div>
    <div class="py-1" style="border-bottom: 1px solid #000;">
      <div style="display: flex; align-items: center;">
        <span class="text-sm" style="min-width: 100px;">Ongkir</span>
        <span style="flex: 1 1 auto;"></span>
        <span class="text-sm" style="min-width: 120px; text-align: right;">${Number(invoiceData.total_ongkir || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    </div>
    <div class="py-1" style="border-bottom: 2.5px solid #000;">
      <div style="display: flex; align-items: center;">
        <span class="font-bold text-sm" style="min-width: 100px;">TOTAL</span>
        <span style="flex: 1 1 auto;"></span>
        <span class="font-bold text-sm" style="min-width: 120px; text-align: right;">${Number(invoiceData.grandTotal || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    </div>
    <div class="py-1" style="margin-bottom: 32px;">
      <div style="display: flex; align-items: center;">
        <span class="text-sm" style="min-width: 100px;">Sisa Tagihan</span>
        <span style="flex: 1 1 auto;"></span>
        <span class="text-sm" style="min-width: 120px; text-align: right;">${Number(invoiceData.amount_remaining || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    </div>
  </div>
</div>
          <!-- Footer Section (Notes and Signature) -->
          <div class="footer-section" style="display: flex; align-items: flex-start; justify-content: space-between;">
            <div class="notes-container">
              <div class="notes-box">
                <h3 class="font-bold text-sm">CATATAN</h3>
                <p class="text-xs">${invoiceData.note || 'Tidak ada catatan'}</p>
              </div>
              <div class="notes-box">
                <h3 class="font-bold text-sm">PESAN</h3>
                <p class="text-xs">Mandiri 121-00-0030307-7 a/n PT Jaja Usaha Laku</p>
              </div>
              <div class="notes-box">
                <h3 class="font-bold text-sm">TERBILANG</h3>
                <p class="text-xs uppercase">${convertToTerbilang(invoiceData.grandTotal || 0)}</p>
              </div>
            </div>
            <div class="signature-container" style="margin-top: 50px;">
              <div class="inline-block" style="margin-top: 0; width: 240px; text-align: center;">
                <div style="border-top: 1.5px solid #888; margin-top: 66px; margin-bottom: 2px; width: 240px; margin-left: auto; margin-right: auto;"></div>
                <p class="text-xs signature-name" style="margin-top: 2px; margin-bottom: 0; text-align: center;">Ernanto T.W</p>
                <p class="text-xs" style="margin-top: 0; text-align: center;">Dep. Keuangan</p>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const convertToTerbilang = (number) => {
    const units = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
    const teens = ['sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'];
    const tens = [' ', ' ', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'];
    const scales = [' ', 'ribu', 'juta', 'miliar'];

    if (number === 0) return 'nol rupiah';

    let num = number;
    let words = [];
    let scaleIndex = 0;

    while (num > 0) {
      let chunk = num % 1000;
      let chunkWords = [];

      if (chunk >= 100) {
        chunkWords.push(units[Math.floor(chunk / 100)]);
        chunkWords.push('ratus');
        chunk %= 100;
      }

      if (chunk >= 20) {
        chunkWords.push(tens[Math.floor(chunk / 10)]);
        chunk %= 10;
        if (chunk > 0) chunkWords.push(units[chunk]);
      } else if (chunk >= 10) {
        chunkWords.push(teens[chunk - 10]);
      } else if (chunk > 0) {
        chunkWords.push(units[chunk]);
      }

      if (chunkWords.length > 0 && scaleIndex > 0) {
        chunkWords.push(scales[scaleIndex]);
      }

      words = chunkWords.concat(words);
      num = Math.floor(num / 1000);
      scaleIndex++;
    }

    return words.join(' ') + ' rupiah';
  };

  const productColumns = [
    { title: 'No', dataIndex: 'no', key: 'no', width: 20 },
    { title: 'Produk', dataIndex: 'product', key: 'product', width: 200 },
    {
      title: 'Deskripsi',
      dataIndex: 'description',
      key: 'description',
      width: 220,
      render: (text, record) => {
        const isExpanded = expandedRows[record.key];
        return (
          <div>
            {text.length > 100 && !isExpanded ? (
              <>
                {text.substring(0, 100) + '... '}
                <Button
                  type="link"
                  size="small"
                  onClick={() => setExpandedRows(prev => ({
                    ...prev,
                    [record.key]: true
                  }))}
                >
                  See More
                </Button>
              </>
            ) : (
              <>
                {text}{' '}
                {text.length > 100 && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setExpandedRows(prev => ({
                      ...prev,
                      [record.key]: false
                    }))}
                  >
                    See Less
                  </Button>
                )}
              </>
            )}
          </div>
        );
      }
    },
    { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 50, align: 'center' },
    { title: 'Unit', dataIndex: 'unit', key: 'unit', width: 80 },
    {
      title: 'Price',
      dataIndex: 'dpp',
      key: 'dpp',
      width: 100,
      render: (dpp) => dpp ? dpp.toLocaleString() : '0'
    },
    {
      title: 'Discount(%)',
      dataIndex: 'discount',
      key: 'discount',
      width: 50,
      align: 'center',
      render: (discount) => discount.toLocaleString()
    },
    {
      title: 'PPN (%)',
      dataIndex: 'ppn',
      key: 'ppn',
      width: 100,
      align: 'center',
      render: (ppn) => ppn ? Math.round(ppn).toLocaleString() : '0'
    },
    {
      title: 'Taxable',
      dataIndex: 'taxable',
      key: 'taxable',
      width: 80,
      align: 'center',
      render: (taxable) => taxable === 1 ? <Tag color="green">Yes</Tag> : <Tag color="red">No</Tag>
    },
    {
      title: 'Jumlah',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      align: 'end',
      render: (amount) => amount.toLocaleString()
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <div className="flex space-x-2 flex justify-center">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className="hover:bg-blue-600 hover:text-white transition-colors"
          />
          <Button
            size="small"
            icon={<DeleteOutlined />}
            className="bg-red-500 text-white hover:bg-red-600 transition-colors"
          />
        </div>
      ),
    },
  ];

  const calculateSubtotal = () => {
    return products.reduce((sum, product) => {
      const itemSubtotal = (product.price || 0) * (product.qty || 0);
      return sum + itemSubtotal;
    }, 0);
  };

  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal();
    const fee = invoiceData.fee || 0;
    const ongkir = invoiceData.total_ongkir || 0;
    const tax = invoiceData.tax || 0;
    return subtotal + fee + ongkir + tax;
  };

  const handleCancelInvoice = () => {
    Modal.confirm({
      title: 'Konfirmasi Pembatalan',
      content: 'Apakah Anda yakin ingin membatalkan invoice ini?',
      okText: 'Batalkan Invoice',
      okButtonProps: { className: 'bg-red-500 hover:bg-red-600 text-white' },
      cancelText: 'Tidak',
      cancelButtonProps: { className: 'hover:bg-gray-100' },
      onOk: async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem('token');

          const payload = {
            id_invoice: parseInt(id_invoice),
            invoice_data: {
              transaction_no: invoiceData.invoiceNumber || "tes-no-INV",
              payment_status: "Cancel"
            }
          };

          console.log('Payload pembatalan:', JSON.stringify(payload, null, 2));

          const response = await fetch(`${baseUrl}/nimda/delivery-order/update-invoice-new`, {
            method: 'PUT',
            headers: {
              Authorization: `${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          const result = await response.json();
          console.log('API Cancel Response:', JSON.stringify(result, null, 2));

          if (response.status === 200 && result.success) {
            await fetchInvoiceData(id_invoice);
            Modal.success({
              title: 'Sukses',
              content: 'Invoice berhasil dibatalkan!',
              okButtonProps: { className: 'bg-green-500 hover:bg-green-600 text-white' },
            });
          } else {
            // Handle error response with detailed error messages
            const errorInfo = formatErrorMessage(result);

            let errorContent = errorInfo.title;
            if (errorInfo.hasDetails) {
              errorContent = (
                <div>
                  <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>{errorInfo.title}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    <strong>Detail Error:</strong>
                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                      {errorInfo.details.map((msg, index) => (
                        <li key={index} style={{ marginBottom: '4px' }}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            }

            Modal.error({
              title: 'Gagal',
              content: errorContent,
              okButtonProps: { className: 'bg-red-500 hover:bg-red-600 text-white' },
              width: 500,
            });
          }
        } catch (error) {
          console.error('Error canceling invoice:', error);
          Modal.error({
            title: 'Gagal',
            content: error.message || 'Terjadi kesalahan saat membatalkan invoice',
            okButtonProps: { className: 'bg-red-500 hover:bg-red-600 text-white' },
          });
        } finally {
          setLoading(false);
        }
      },
      onCancel: () => {
        console.log('Pembatalan invoice dibatalkan');
      },
    });
  };

  const handleUpdateInvoice = () => {
    Modal.confirm({
      title: 'Konfirmasi',
      content: 'Apakah Anda yakin ingin memperbarui invoice ini?',
      okText: 'Yakin',
      okButtonProps: { className: 'bg-blue-500 hover:bg-blue-600 text-white' },
      cancelText: 'Batal',
      cancelButtonProps: { className: 'hover:bg-gray-100' },
      onOk: async () => {
        try {
          setLoading(true);
          const values = await form.validateFields();

          // Debug: Log form values
          console.log('Form values.customerLastName:', values.customerLastName);
          console.log('Form values:', values);

          // Construct the dynamic payload
          const payload = {
            id_invoice: parseInt(id_invoice),
            invoice_data: {
              transaction_no: values.invoiceNumber || "",
              due_date: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : "",
              person_first_name: values.customerFirstName || "",
              person_middle_name: values.customerMiddleName || "",
              person_last_name: values.customerLastName || "",
              person_phone: values.phoneNumber || "",
              person_address: values.customerAddress || "",
              shipping_address: values.customerAddress || "",
              ship_via: values.pengiriman || "",
              tracking_no: "",
              shipping_date: values.transactionDate ? values.transactionDate.format('YYYY-MM-DD') : "",
              memo: values.note || "",
              payment_status: values.paymentStatus || "",
            },
          };

          console.log('Payload yang dikirim:', JSON.stringify(payload, null, 2));

          const token = localStorage.getItem('token');

          const response = await fetch(`${baseUrl}/nimda/delivery-order/update-invoice-new`, {
            method: 'PUT',
            headers: {
              Authorization: `${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          const result = await response.json();
          console.log('API Update Response:', JSON.stringify(result, null, 2));

          if (response.status === 200 && result.success) {
            await fetchInvoiceData(id_invoice);
            Modal.success({
              title: 'Sukses',
              content: result.message || 'Invoice berhasil diperbarui!',
              okButtonProps: { className: 'bg-blue-500 hover:bg-blue-600 text-white' },
            });
          } else {
            // Handle error response with detailed error messages
            const errorInfo = formatErrorMessage(result);

            let errorContent = errorInfo.title;
            if (errorInfo.hasDetails) {
              errorContent = (
                <div>
                  <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>{errorInfo.title}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    <strong>Detail Error:</strong>
                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                      {errorInfo.details.map((msg, index) => (
                        <li key={index} style={{ marginBottom: '4px' }}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            }

            Modal.error({
              title: 'Gagal',
              content: errorContent,
              okButtonProps: { className: 'bg-red-500 hover:bg-red-600 text-white' },
              width: 500,
            });
            return; // Exit early to prevent further processing
          }
        } catch (error) {
          console.error('Error updating invoice:', error);
          Modal.error({
            title: 'Gagal',
            content: error.message || 'Terjadi kesalahan saat memperbarui invoice',
            okButtonProps: { className: 'bg-red-500 hover:bg-red-600 text-white' },
          });
        } finally {
          setLoading(false);
        }
      },
      onCancel: () => {
        console.log('Pembaruan invoice dibatalkan');
      },
    });
  };

  useEffect(() => {
    // Only set form values on initial load or when invoice data changes from server
    if (invoiceData.invoiceNumber) {
      form.setFieldsValue({
        invoiceNumber: invoiceData.invoiceNumber,
        customerType: invoiceData.customerType,
        customerFirstName: invoiceData.customerFirstName,
        customerMiddleName: invoiceData.customerMiddleName,
        customerLastName: invoiceData.customerLastName || "",
        pengiriman: invoiceData.pengiriman || 'Raja Cepat',
        phoneNumber: invoiceData.phoneNumber || "",
        transactionDate: invoiceData.transactionDate,
        paymentTerms: invoiceData.paymentTerms,
        dueDate: invoiceData.dueDate,
        customerAddress: invoiceData.customerAddress || "",
        note: invoiceData.note || "",
        paymentStatus: invoiceData.paymentStatus,
      });
    }
  }, [invoiceData.invoiceNumber, form]); // Only re-run when invoiceNumber changes

  const paymentHistoryColumns = [
    { title: 'No', dataIndex: 'no', key: 'no', width: 70 },
    { title: '#', dataIndex: 'number', key: 'number', width: 70 },
    { title: 'Deposit to', dataIndex: 'depositTo', key: 'depositTo', width: 150 },
    { title: 'Payment Method', dataIndex: 'paymentMethod', key: 'paymentMethod', width: 150 },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 150,
      render: (total) => total ? total.toLocaleString() : '0'
    },
    { title: 'Note', dataIndex: 'note', key: 'note', width: 200 },
    { title: 'Date Receive', dataIndex: 'dateReceive', key: 'dateReceive', width: 150 },
  ];

  return (
    <div className="sm:p-0 min-h-screen">
      <Card className="mb-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <Title level={4} className="m-0 text-center sm:text-left">Detail Invoices</Title>
          <div className="flex flex-wrap justify-center sm:justify-end gap-2 mt-4 sm:mt-0">
            <Button
              icon={<UserOutlined />}
              className="bg-yellow-500 text-white hover:bg-yellow-600 transition-colors w-full sm:w-auto"
              disabled
            />
            <Button
              icon={<ExportOutlined />}
              className={invoiceData.id_sales_invoice ? "bg-gray-400 text-white cursor-not-allowed w-full sm:w-auto" : "bg-green-500 text-white hover:bg-green-600 transition-colors w-full sm:w-auto"}
              onClick={invoiceData.id_sales_invoice ? undefined : handleExportJournal}
              loading={loading}
              disabled={!!invoiceData.id_sales_invoice}
            >
              EXPORT JURNALID
            </Button>
            <Button
              className={invoiceData.id_sales_invoice ? "bg-blue-500 text-white hover:bg-blue-600 transition-colors w-full sm:w-auto" : "bg-gray-400 text-white cursor-not-allowed w-full sm:w-auto"}
              onClick={invoiceData.id_sales_invoice ? handlePrintInvoice : undefined}
              disabled={!invoiceData.id_sales_invoice}
            >
              PRINT
            </Button>
            <Button
              className="bg-blue-500 text-white hover:bg-blue-600 transition-colors w-full sm:w-auto"
              onClick={handleUpdateInvoice}
              loading={loading}
            >
              UPDATE INVOICE
            </Button>
            <Button
              className="bg-red-500 text-white hover:bg-red-600 transition-colors w-full sm:w-auto"
              onClick={handleCancelInvoice}
              loading={loading}
            >
              BATALKAN
            </Button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-md">
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-4 sm:space-y-0">
                <div className="text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center mb-2">
                    <span className="font-bold mr-0 sm:mr-2">{invoiceData.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-center sm:justify-start items-center mb-2">
                    <Tag color="green">{invoiceData.paymentStatus}</Tag>
                  </div>
                </div>
              </div>

              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  ...invoiceData,
                  transactionDate: invoiceData.transactionDate,
                  dueDate: invoiceData.dueDate,
                  pengiriman: "Raja Cepat",
                  paymentTerms: invoiceData.paymentTerms || "Top 30",
                  paymentStatus: invoiceData.paymentStatus || "Open",
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <Form.Item label="No Invoice" name="invoiceNumber">
                      <Input size="small" style={{ height: '32px' }} />
                    </Form.Item>
                    <Form.Item label="Nama depan" name="customerFirstName">
                      <Input size="small" style={{ height: '32px' }} />
                    </Form.Item>
                    <Form.Item label="Tgl Transaksi" name="transactionDate">
                      <DatePicker
                        className="w-full"
                        format="DD MMM YYYY"
                        placeholder="Pilih tanggal transaksi"
                        size="small"
                        style={{ height: '32px' }}
                      />
                    </Form.Item>
                  </div>
                  <div className="sm:col-span-2">
                    <Form.Item label="Corporate" name="customerType">
                      <Select
                        showSearch
                        placeholder="Cari dan Pilih Company"
                        loading={loading}
                        allowClear
                        onChange={handleCompanyChange}
                        filterOption={(input, option) =>
                          option.label?.toLowerCase().includes(input.toLowerCase())
                        }
                        options={companyList.map((company) => ({
                          value: company.id_company,
                          label: `${company.company_name}`,
                        }))}
                        className="w-full"
                        size="small"
                        style={{ height: '32px' }}
                      />
                    </Form.Item>
                    <div className="grid grid-cols-2 gap-4">
                      <Form.Item label="Nama tengah" name="customerMiddleName">
                        <Input size="small" style={{ height: '32px' }} />
                      </Form.Item>
                      <Form.Item label="Nama belakang" name="customerLastName">
                        <Input size="small" style={{ height: '32px' }} />
                      </Form.Item>
                    </div>
                    <Form.Item label="Tgl Jatuh Tempo" name="dueDate">
                      <DatePicker
                        className="w-full"
                        format="DD MMM YYYY"
                        placeholder="Pilih tanggal jatuh tempo"
                        size="small"
                        style={{ height: '32px' }}
                      />
                    </Form.Item>
                  </div>
                  <div>
                    <Form.Item label="Pengiriman" name="pengiriman">
                      <Select
                        placeholder="Pilih Pengiriman"
                        className="w-full"
                        defaultValue="Raja Cepat"
                        size="small"
                        style={{ height: '32px' }}
                      >
                        <Option value="Raja Cepat">Raja Cepat</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="Syarat Bayar" name="paymentTerms">
                      <Select
                        placeholder="Pilih Syarat Bayar"
                        className="w-full"
                        size="small"
                        style={{ height: '32px' }}
                      >
                        <Option value="Top 30">Top 30</Option>
                        <Option value="Top 15">Top 15</Option>
                        <Option value="Top 60">Top 60</Option>
                        <Option value="Cash on Delivery">Cash on Delivery</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      label="Status Pembayaran"
                      name="paymentStatus"
                      rules={[{ message: "Pilih status pembayaran!" }]}
                    >
                      <Select
                        placeholder="Pilih Status Pembayaran"
                        className="w-full"
                        size="small"
                        style={{ height: '32px' }}
                      >
                        <Option value="Open">Open</Option>
                        <Option value="Partial">Partial</Option>
                        <Option value="Paid">Paid</Option>
                        <Option value="Cancel">Cancel</Option>
                      </Select>
                    </Form.Item>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <Form.Item label="Alamat Pelanggan" name="customerAddress">
                    <TextArea rows={4} />
                  </Form.Item>
                  <Form.Item label="Note" name="note">
                    <TextArea rows={4} />
                  </Form.Item>
                </div>
              </Form>

              <div className="mb-4 flex justify-center sm:justify-start">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddItem}
                  className="bg-blue-500 hover:bg-blue-600 transition-colors w-full sm:w-auto"
                >
                  Tambah Item
                </Button>
              </div>

              <Table
                columns={productColumns}
                dataSource={products}
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
                bordered
                className="overflow-x-auto"
              />

              <div className="flex flex-col sm:flex-row sm:justify-between mt-4 gap-4">
                <div className="w-full sm:w-1/3 text-center sm:text-left">
                  <div className="mb-2">
                    <span className="font-bold">Ket:</span>
                  </div>
                  <div className="mb-1">
                    <span className="mr-2">Asuransi:</span>
                    <span>{invoiceData.insurance?.toLocaleString() || 0}</span>
                  </div>
                  <div className="mb-1">
                    <span className="mr-2">Diskon:</span>
                    <span>{invoiceData.discount?.toLocaleString() || 0}</span>
                  </div>
                  <div>
                    <span className="mr-2">Poin:</span>
                    <span>{invoiceData.point?.toLocaleString() || 0}</span>
                  </div>
                </div>

                <div className="w-full sm:w-1/3 text-right">
                  <div className="flex mb-2">
                    <span className="text-sm w-[120px] text-left">Subtotal</span>
                    <span className="text-sm flex-1 text-right">
                      {(invoiceData.subtotal || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex mb-2">
                    <span className="text-sm w-[120px] text-left">Fee</span>
                    <span className="text-sm flex-1 text-right">
                      {(invoiceData.fee || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex mb-2">
                    <span className="text-sm w-[120px] text-left">Ongkir</span>
                    <span className="text-sm flex-1 text-right">
                      {(invoiceData.total_ongkir || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex mb-2">
                    <span className="text-sm w-[120px] text-left">PPN</span>
                    <span className="text-sm flex-1 text-right">
                      {(invoiceData.tax || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex mb-2">
                    <span className="text-sm font-bold w-[120px] text-left">Grand Total</span>
                    <span className="text-sm font-bold flex-1 text-right bg-gray-200 px-3 py-1 rounded">
                      {(invoiceData.grandTotal || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>


      {/* History Komentar Section */}
      <Card className="shadow-md mt-6">
        <div className="flex items-center justify-between mb-6">
          <Title level={5} className="m-0">Riwayat Komentar</Title>
          <Button
            type="link"
            icon={<ReloadOutlined />}
            onClick={fetchHistory}
            loading={historyLoading}
            className="text-blue-500 font-medium"
          >
            Refresh
          </Button>
        </div>

        {/* Input Komentar */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <TextArea
                placeholder="Tulis komentar atau catatan internal untuk invoice ini..."
                value={newKomentar}
                onChange={(e) => setNewKomentar(e.target.value)}
                rows={3}
                className="rounded-lg border-gray-200 focus:border-blue-400 focus:shadow-none transition-all"
                style={{ resize: 'none' }}
              />
              <div className="flex justify-end mt-3">
                <Button
                  type="primary"
                  onClick={handleSubmitKomentar}
                  loading={isSubmittingKomentar}
                  disabled={!newKomentar.trim()}
                  className="rounded-md px-6 bg-blue-500 hover:bg-blue-600 border-none shadow-sm"
                >
                  Kirim Komentar
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="table-modern">
          <Table
            dataSource={historyKomentar}
            loading={historyLoading}
            pagination={{ pageSize: 5 }}
            size="small"
            locale={{ emptyText: <div className="py-6 text-gray-400">Belum ada riwayat komentar</div> }}
            rowKey={(record, index) => record.id_invoice_history || index}
            columns={[
              {
                title: 'Waktu',
                dataIndex: 'tgl',
                key: 'tgl',
                width: 180,
                render: (tgl) => (
                  <div className="text-gray-600 text-xs">
                    <div className="font-semibold">{tgl ? new Date(tgl).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</div>
                    <div className="text-[10px] opacity-70">{tgl ? new Date(tgl).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                  </div>
                )
              },
              {
                title: 'User',
                key: 'user',
                width: 200,
                render: (_, record) => (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                      {record.nama_lengkap?.charAt(0) || <UserOutlined />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-gray-700 text-xs truncate">{record.nama_lengkap || 'System'}</div>
                      <div className="text-[10px] text-gray-400 truncate">@{record.username || 'system'}</div>
                    </div>
                  </div>
                )
              },
              {
                title: 'Komentar',
                dataIndex: 'komentar',
                key: 'komentar',
                render: (text) => (
                  <div className="text-gray-700 text-sm py-1 leading-relaxed">
                    {text}
                  </div>
                )
              }
            ]}
          />
        </div>
      </Card>

      <Modal
        title={isEditMode ? "Edit Item" : "Tambah Item"}
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        okButtonProps={{ className: 'bg-blue-500 hover:bg-blue-600' }}
        cancelButtonProps={{ className: 'hover:bg-gray-100' }}
        confirmLoading={isModalLoading}
        width="90%"
        style={{ maxWidth: '800px' }}
      >
        <Form
          form={editForm}
          layout="vertical"
          onValuesChange={(changedValues, allValues) => {
            const amount = calculateAmount(allValues);
            editForm.setFieldsValue({ amount });
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              name="product"
              label="Produk"
              rules={[{ required: true, message: "Pilih produk terlebih dahulu!" }]}
              className="sm:col-span-2"
            >
              <Select
                showSearch
                placeholder="Pilih Produk"
                onChange={handleProductChange}
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
                className="w-full"
                style={{ width: '100%' }}
              >
                {productList.map((product) => (
                  <Option key={product.id} value={product.id}>
                    {product.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item name="qty" label="Qty" initialValue={0}>
              <InputNumber className="w-full" disabled />
            </Form.Item>
            <Form.Item name="price" label="Price" initialValue={0}>
              <InputNumber className="w-full" disabled />
            </Form.Item>
          </div>

          {invoiceData.platform !== "Direct" && (
            <div className="grid grid-cols-1 gap-4">
              <Form.Item name="id_kategori" label="Kategori" rules={[{ required: true }]}>
                <Select placeholder="Pilih kategori">
                  <Option value={1}>Kategori 1</Option>
                  <Option value={2}>Kategori 2</Option>
                </Select>
              </Form.Item>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4">
            <Form.Item name="taxable" label="Taxable" initialValue={0}>
              <Select placeholder="Pilih status pajak">
                <Option value={1}>Ya (Taxable)</Option>
                <Option value={0}>Tidak (Non-taxable)</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="description" label="Description">
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InvoicePage;