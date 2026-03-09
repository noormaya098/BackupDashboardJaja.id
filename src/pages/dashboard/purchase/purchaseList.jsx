import React, { useState, useEffect } from 'react';
import { Table, Button, Spin, Modal, Tooltip, Space, Card, Typography, Empty, Input, DatePicker, Select, message, ConfigProvider } from 'antd';
import { DeleteOutlined, PlusOutlined, ShoppingCartOutlined, FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, ExportOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { baseUrl } from '@/configs';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const PurchaseList = () => {
    const [dataSource, setDataSource] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalData, setTotalData] = useState(0);
    const [selectedBrand, setSelectedBrand] = useState('all');

    // Export modal states
    const [exportModalVisible, setExportModalVisible] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [selectedYear, setSelectedYear] = useState(dayjs().year());
    const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);

    const navigate = useNavigate();

    const fetchPurchaseList = async (brand = 'all') => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token tidak ditemukan. Silakan login terlebih dahulu.');
            }

            const url = brand === 'all'
                ? `${baseUrl}/nimda/purchase`
                : `${baseUrl}/nimda/purchase?brand=${brand.toLowerCase()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
            }

            const result = await response.json();
            if (result.data) {
                const formattedData = result.data.map((item, index) => {
                    const details = item.purchase_order_details && item.purchase_order_details[0];
                    let total = 0;

                    if (details) {
                        const subtotal = parseFloat(details.quantity) * parseFloat(details.rate);
                        const discount = details.discount ? (subtotal * details.discount) / 100 : 0;
                        total = subtotal - discount;
                    }

                    return {
                        key: item.id_purchase_order,
                        no: index + 1,
                        kodePurchase: item.transaction_no || 'PO-' + item.id_purchase_order,
                        tglPurchase: new Date(item.transaction_date).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        }),
                        supplierName: item.person_name || '-',
                        total: `Rp. ${total.toLocaleString('id-ID')}`,
                        status: item.is_shipped,
                        receiveNotes: item.isReceiveNotes ?? false,
                        id_purchase_order: item.id_purchase_order,
                        rawDate: item.transaction_date,
                        brand: item.tb_pengajuan?.allocation || item.warehouse_name || 'JAJAID'
                    };
                });

                const sortedData = formattedData
                    .sort((a, b) => b.id_purchase_order - a.id_purchase_order)
                    .map((item, index) => ({
                        ...item,
                        no: index + 1
                    }));

                setDataSource(sortedData);
                setFilteredData(sortedData);
                setTotalData(sortedData.length);
            }
        } catch (error) {
            console.error('Error fetching purchase list:', error);
            let errorMessage = error.message;
            if (errorMessage.includes('aliased associations')) {
                errorMessage = 'Terjadi kesalahan pada server: Konflik data penerimaan. Silakan hubungi administrator.';
            }
            setError(errorMessage);
            setDataSource([]);
            setFilteredData([]);
            setTotalData(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchaseList(selectedBrand);
    }, [selectedBrand]);

    const handleSearch = (value) => {
        setSearchText(value);
        const filtered = dataSource.filter((item) => {
            const kode = item.kodePurchase?.toLowerCase() || '';
            const tanggal = item.tglPurchase?.toLowerCase() || '';
            const supplier = item.supplierName?.toLowerCase() || '';
            const total = item.total?.toLowerCase() || '';
            const status = item.status ? 'dikirim' : 'belum dikirim';
            const receiveStatus = item.receiveNotes ? 'sudah diterima' : 'belum diterima';
            const brand = item.brand?.toLowerCase() || '';
            return (
                kode.includes(value.toLowerCase()) ||
                tanggal.includes(value.toLowerCase()) ||
                supplier.includes(value.toLowerCase()) ||
                total.includes(value.toLowerCase()) ||
                status.includes(value.toLowerCase()) ||
                receiveStatus.includes(value.toLowerCase()) ||
                brand.includes(value.toLowerCase())
            );
        });
        setFilteredData(filtered);
        setTotalData(filtered.length);
        setCurrentPage(1);
    };

    const handleBrandChange = (value) => {
        setSelectedBrand(value);
        setSearchText('');
        setCurrentPage(1);
    };

    const handleBuatPP = (id_purchase_order) => {
        navigate(`/dashboard/purchase/order/detail/${id_purchase_order}`);
    };

    const handleDeletePurchase = async (id_purchase_order) => {
        Modal.confirm({
            title: 'Konfirmasi Hapus',
            content: `Apakah Anda yakin ingin menghapus purchase order dengan ID ${id_purchase_order}?`,
            okText: 'Hapus',
            okType: 'danger',
            cancelText: 'Batal',
            onOk: async () => {
                try {
                    setLoading(true);
                    const token = localStorage.getItem('token');
                    if (!token) {
                        throw new Error('Token tidak ditemukan. Silakan login terlebih dahulu.');
                    }

                    const response = await fetch(`${baseUrl}/nimda/purchase/${id_purchase_order}`, {
                        method: 'DELETE',
                        headers: {
                            Authorization: `${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`Gagal menghapus purchase: ${response.status}`);
                    }

                    setDataSource(prevData => prevData.filter(item => item.id_purchase_order !== id_purchase_order));
                    setFilteredData(prevData => prevData.filter(item => item.id_purchase_order !== id_purchase_order));
                    setTotalData(prevData => prevData.length - 1);
                    Modal.success({
                        content: 'Purchase order berhasil dihapus',
                    });
                } catch (error) {
                    console.error('Error deleting purchase:', error);
                    Modal.error({
                        title: 'Error',
                        content: 'Gagal menghapus purchase order: ' + error.message,
                    });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleTambahPengajuan = () => {
        navigate('/dashboard/purchase/add');
    };

    const handleTableChange = (pagination) => {
        setCurrentPage(pagination.current);
        setPageSize(pagination.pageSize);
    };

    // Export Excel functions
    const handleExportClick = () => {
        setExportModalVisible(true);
    };

    const handleExportExcel = async () => {
        setExportLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token tidak ditemukan. Silakan login terlebih dahulu.');
            }

            const response = await fetch(`${baseUrl}/nimda/purchase/export?tahun=${selectedYear}&bulan=${selectedMonth}`, {
                method: 'GET',
                headers: {
                    Authorization: `${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
            }

            const result = await response.json();

            if (result.data && result.data.length > 0) {
                // Create and download Excel file
                await downloadExcelFile(result.data);
                message.success('File Excel berhasil diekspor!');
                setExportModalVisible(false);
            } else {
                message.warning('Tidak ada data untuk periode yang dipilih.');
            }
        } catch (error) {
            console.error('Error exporting Excel:', error);
            message.error('Gagal mengekspor file Excel: ' + error.message);
        } finally {
            setExportLoading(false);
        }
    };

    const downloadExcelFile = async (data) => {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Purchase Orders');

            // Set up the header row with modern styling
            const headers = [
                { header: 'No', key: 'no', width: 8 },
                { header: 'Tanggal', key: 'tgl', width: 15 },
                { header: 'Nama Vendor', key: 'nama_vendor', width: 30 },
                { header: 'Barang', key: 'barang', width: 50 },
                { header: 'Harga (Rp)', key: 'harga', width: 15 },
                { header: 'Qty', key: 'qty', width: 10 },
                { header: 'No PO', key: 'no_po', width: 20 },
                { header: 'Total (Rp)', key: 'total', width: 18 }
            ];

            worksheet.columns = headers;

            // Add data rows
            data.forEach((item, index) => {
                worksheet.addRow({
                    no: index + 1,
                    tgl: item.tgl,
                    nama_vendor: item.nama_vendor,
                    barang: item.barang,
                    harga: item.harga,
                    qty: item.qty,
                    no_po: item.no_po,
                    total: item.total
                });
            });

            // Style the header row
            const headerRow = worksheet.getRow(1);
            headerRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF10B981' } // Green color
                };
                cell.font = {
                    bold: true,
                    color: { argb: 'FFFFFFFF' }, // White text
                    size: 12
                };
                cell.alignment = {
                    horizontal: 'center',
                    vertical: 'middle'
                };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
                };
            });

            // Style data rows
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1) { // Skip header row
                    row.eachCell((cell) => {
                        cell.border = {
                            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
                        };
                        cell.font = { size: 11 };

                        // Center align number columns
                        if (cell.column === 1 || cell.column === 5 || cell.column === 6 || cell.column === 8) {
                            cell.alignment = { horizontal: 'center' };
                        }

                        // Right align price columns
                        if (cell.column === 5 || cell.column === 8) {
                            cell.alignment = { horizontal: 'right' };
                            cell.numFmt = '#,##0';
                        }

                        // Alternate row colors
                        if (rowNumber % 2 === 0) {
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFF9FAFB' } // Light gray
                            };
                        }
                    });
                }
            });

            // Add title and summary
            const titleRow = worksheet.insertRow(1, ['LAPORAN PURCHASE ORDER']);
            titleRow.height = 30;
            const titleCell = titleRow.getCell(1);
            titleCell.font = { bold: true, size: 16, color: { argb: 'FF1F2937' } };
            titleCell.alignment = { horizontal: 'center' };
            worksheet.mergeCells('A1:H1');

            const periodRow = worksheet.insertRow(2, [`Periode: ${monthOptions.find(m => m.value === selectedMonth)?.label} ${selectedYear}`]);
            periodRow.height = 25;
            const periodCell = periodRow.getCell(1);
            periodCell.font = { size: 12, color: { argb: 'FF6B7280' } };
            periodCell.alignment = { horizontal: 'center' };
            worksheet.mergeCells('A2:H2');

            const totalRow = worksheet.insertRow(data.length + 4, ['TOTAL', '', '', '', '', '', '', data.reduce((sum, item) => sum + item.total, 0)]);
            const totalCell = totalRow.getCell(8);
            totalCell.font = { bold: true, size: 12 };
            totalCell.numFmt = '#,##0';
            totalCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF10B981' }
            };
            totalCell.font.color = { argb: 'FFFFFFFF' };
            worksheet.mergeCells(`A${data.length + 4}:G${data.length + 4}`);

            // Generate and save the file
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `purchase_orders_${selectedYear}_${selectedMonth.toString().padStart(2, '0')}.xlsx`);
        } catch (error) {
            console.error('Error creating Excel file:', error);
            message.error('Gagal membuat file Excel: ' + error.message);
        }
    };

    const handleExportCancel = () => {
        setExportModalVisible(false);
        setSelectedYear(dayjs().year());
        setSelectedMonth(dayjs().month() + 1);
    };

    const monthOptions = [
        { value: 1, label: 'Januari' },
        { value: 2, label: 'Februari' },
        { value: 3, label: 'Maret' },
        { value: 4, label: 'April' },
        { value: 5, label: 'Mei' },
        { value: 6, label: 'Juni' },
        { value: 7, label: 'Juli' },
        { value: 8, label: 'Agustus' },
        { value: 9, label: 'September' },
        { value: 10, label: 'Oktober' },
        { value: 11, label: 'November' },
        { value: 12, label: 'Desember' }
    ];

    const columnsPurchase = [
        {
            title: 'No',
            dataIndex: 'no',
            key: 'no',
            width: 60,
            align: 'center',
            render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
        },
        {
            title: 'Kode Purchase',
            dataIndex: 'kodePurchase',
            key: 'kodePurchase',
            width: 150,
            render: (text, record) => (
                <span
                    className="text-blue-500 cursor-pointer hover:underline"
                    onClick={() => handleBuatPP(record.id_purchase_order)}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        const url = `/dashboard/purchase/order/detail/${record.id_purchase_order}`;
                        window.open(url, '_blank');
                    }}
                    title="Klik kiri untuk edit, klik kanan untuk buka di tab baru"
                >
                    {text}
                </span>
            )
        },
        {
            title: 'Nama Supplier',
            dataIndex: 'supplierName',
            key: 'supplierName',
            width: 200,
            render: text => (
                <Tooltip title={text}>
                    <span
                        className="text-gray-600"
                        style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                        {text}
                    </span>
                </Tooltip>
            ),
        },
        {
            title: 'Tanggal',
            dataIndex: 'tglPurchase',
            key: 'tglPurchase',
            width: 120,
            render: text => <span className="text-gray-600">{text}</span>
        },
        {
            title: 'Total',
            dataIndex: 'total',
            key: 'total',
            width: 150,
            align: 'right',
            render: text => <span className="text-green-600">{text}</span>
        },
        {
            title: 'Note',
            dataIndex: 'receiveNotes',
            key: 'receiveNotes',
            width: 100,
            align: 'center',
            render: (receiveNotes) => (
                <Tooltip title={receiveNotes ? 'Sudah Diterima' : 'Belum Diterima'}>
                    {receiveNotes ? (
                        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '14px' }} />
                    ) : (
                        <ClockCircleOutlined style={{ color: '#fa8c16', fontSize: '14px' }} />
                    )}
                </Tooltip>
            )
        },
        // {
        //     title: 'Aksi',
        //     key: 'action',
        //     width: 100,
        //     align: 'center',
        //     render: (_, record) => (
        //         <Space size="middle">
        //             <Button
        //                 type="primary"
        //                 danger
        //                 onClick={() => handleDeletePurchase(record.id_purchase_order)}
        //                 icon={<DeleteOutlined />}
        //                 className="rounded-md text-xs px-3 py-0"
        //                 size="middle"
        //             />
        //         </Space>
        //     )
        // }
    ];

    return (
        <ConfigProvider theme={{ token: { fontFamily: 'Plus Jakarta Sans' } }}>
            <Card
                className="shadow-sm rounded-lg w-full"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
                <div className="p-3 m-0 text-left">
                    <Title level={4} className="m-0 p-0 text-left flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        <FileTextOutlined style={{ fontSize: '24px', marginRight: '12px', color: '#1890ff' }} />
                        Daftar Purchase
                    </Title>
                </div>

                <div className="px-4 pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                        <div className="flex items-center gap-3">
                            <Select
                                value={selectedBrand}
                                onChange={handleBrandChange}
                                style={{ width: 140 }}
                                size="middle"
                            >
                                <Option value="all">Semua Brand</Option>
                                <Option value="JAJAID">JAJAID</Option>
                                <Option value="AUTO">AUTO</Option>
                            </Select>
                            <Search
                                placeholder="Cari berdasarkan kode, tanggal, supplier, total, status, atau penerimaan"
                                allowClear
                                onSearch={handleSearch}
                                onChange={(e) => handleSearch(e.target.value)}
                                style={{ width: 300 }}
                            />
                        </div>
                        <Tooltip title="Export Excel">
                            <Button
                                type="primary"
                                icon={<ExportOutlined />}
                                onClick={handleExportClick}
                                className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 border-0 shadow-lg"
                                style={{
                                    borderRadius: '12px',
                                    height: '40px',
                                    width: '40px',
                                    minWidth: '40px'
                                }}
                            />
                        </Tooltip>
                    </div>

                    {error && (
                        <div className="p-3">
                            <span className="text-red-600 text-xs">
                                {error.includes('HTTP error') ? 'Gagal mengambil data dari server. Silakan coba lagi nanti.' : error}
                            </span>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-10">
                            <Spin size="large" tip="Memuat data..." />
                        </div>
                    ) : filteredData.length === 0 ? (
                        <Empty
                            description="Tidak ada data purchase order"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    ) : (
                        <Table
                            dataSource={filteredData}
                            columns={columnsPurchase}
                            pagination={{
                                current: currentPage,
                                pageSize: pageSize,
                                total: totalData,
                                showSizeChanger: true,
                                pageSizeOptions: ['10', '20', '50'],
                                responsive: true
                            }}
                            scroll={{ x: false }}
                            rowClassName="hover:bg-gray-50"
                            className="ant-table-custom"
                            size="middle"
                            onChange={handleTableChange}
                        />
                    )}

                    {/* Export Modal */}
                    <Modal
                        title={
                            <div className="flex items-center gap-3">
                                <ExportOutlined style={{ color: '#10b981', fontSize: '20px' }} />
                                <span className="text-lg font-semibold text-gray-800">Export Excel</span>
                            </div>
                        }
                        open={exportModalVisible}
                        onCancel={handleExportCancel}
                        footer={null}
                        width={500}
                        centered
                        className="export-modal"
                    >
                        <div className="py-4">
                            <div className="space-y-6">
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                                        <ExportOutlined style={{ fontSize: '24px', color: '#10b981' }} />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Export Data Purchase Order</h3>
                                    <p className="text-sm text-gray-600">Pilih periode untuk mengekspor data ke Excel</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tahun
                                        </label>
                                        <Select
                                            value={selectedYear}
                                            onChange={setSelectedYear}
                                            className="w-full"
                                            size="large"
                                            style={{ borderRadius: '8px' }}
                                        >
                                            {Array.from({ length: 10 }, (_, i) => dayjs().year() - i).map(year => (
                                                <Option key={year} value={year}>{year}</Option>
                                            ))}
                                        </Select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Bulan
                                        </label>
                                        <Select
                                            value={selectedMonth}
                                            onChange={setSelectedMonth}
                                            className="w-full"
                                            size="large"
                                            style={{ borderRadius: '8px' }}
                                        >
                                            {monthOptions.map(month => (
                                                <Option key={month.value} value={month.value}>{month.label}</Option>
                                            ))}
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={handleExportCancel}
                                        className="flex-1 h-12 bg-red-500 hover:bg-red-600 border-0 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                                        size="large"
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="primary"
                                        onClick={handleExportExcel}
                                        loading={exportLoading}
                                        className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                                        size="large"
                                        icon={!exportLoading && <ExportOutlined />}
                                    >
                                        {exportLoading ? 'Mengekspor...' : 'Export Excel'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Modal>

                    <style jsx>{`
                .ant-table-custom .ant-table-thead > tr > th {
                    background-color: #f9fafb;
                    color: #374151;
                    font-weight: 600;
                    padding: 12px 8px;
                    border-bottom: 2px solid #e5e7eb;
                    font-size: 12px;
                    white-space: normal;
                    word-wrap: break-word;
                }
                .ant-table-custom .ant-table-tbody > tr > td {
                    padding: 12px 8px;
                    color: #4b5563;
                    font-size: 12px;
                    white-space: normal;
                    word-wrap: break-word;
                }
                .ant-table-custom .ant-table-tbody > tr:hover > td {
                    background-color: #f1f5f9;
                }
                .ant-table-custom .ant-pagination-item-active {
                    background-color: #1890ff;
                    border-color: #1890ff;
                }
                .ant-table-custom .ant-pagination-item-active a {
                    color: #fff;
                }
                
                /* Export Modal Styles */
                .export-modal .ant-modal-content {
                    border-radius: 16px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                }
                
                .export-modal .ant-modal-header {
                    border-bottom: 1px solid #e5e7eb;
                    padding: 20px 24px 16px;
                }
                
                .export-modal .ant-modal-body {
                    padding: 0 24px 24px;
                }
                
                .export-modal .ant-select-selector {
                    border-radius: 8px !important;
                    border: 1px solid #d1d5db !important;
                    transition: all 0.3s ease;
                }
                
                .export-modal .ant-select-focused .ant-select-selector {
                    border-color: #10b981 !important;
                    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2) !important;
                }
                
                .export-modal .ant-btn {
                    border-radius: 8px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }
                
                .export-modal .ant-btn:hover {
                    transform: translateY(-1px);
                }
            `}</style>
                </div>
            </Card>
        </ConfigProvider>
    );
};

export default PurchaseList;