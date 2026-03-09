import React, { useState, useEffect } from 'react';

import { Select, Button, Table, Tag, Typography, Input, Modal, Card, ConfigProvider } from 'antd';
import { useNavigate } from 'react-router-dom';
import { FileTextOutlined } from '@ant-design/icons';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { baseUrl } from '@/configs';

const { Option } = Select;
const { Title } = Typography;

const Invoice = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalData, setTotalData] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [year, setYear] = useState(null);
  const [status, setStatus] = useState(null);
  const [corporateName, setCorporateName] = useState(null);
  const [brand, setBrand] = useState(null);
  const [companyList, setCompanyList] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  const navigate = useNavigate();

  const reverseStatusMapping = {
    Paid: 'PAID',
    Unpaid: 'UNPAID',
    Partial: 'PARTIAL',
    Cancel: 'CANCEL',
    Open: 'OPEN',
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 10; i++) {
      years.push(currentYear - i);
    }
    return years;
  };

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseUrl}/nimda/company/get-company?limit=300`, {
        method: 'GET',
        headers: {
          Authorization: `${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (result.code === 200) {
        setCompanyList(result.data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchAllInvoices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Ambil semua data dengan limit besar atau loop melalui semua halaman
      const response = await fetch(
        `${baseUrl}/nimda/invoice/get-invoice?page=1&limit=1000`,
        {
          method: 'GET',
          headers: {
            Authorization: `${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const result = await response.json();
      if (result.code === 200) {
        const formattedData = result.data.map((item) => ({
          key: item.id_invoice,
          id_invoice: item.id_invoice,
          date_created: item.created_date,
          no_invoice: item.transaction_no || 'N/A',
          no_order: item.no_order || 'N/A',
          name: item.nama_customer || 'N/A',
          brand: item.brand || 'N/A',
          status: reverseStatusMapping[item.payment_status] || item.payment_status || 'N/A',
          total: item.grandtotal.toLocaleString('id-ID'),
          sisa: item.amount_remaining.toLocaleString('id-ID'),
          exported: item.is_exported || false,
        }));
        const sortedData = formattedData.sort((a, b) => b.id_invoice - a.id_invoice);
        setInvoices(sortedData);
        setFilteredInvoices(sortedData);
        setTotalData(result.totalData);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchAllInvoices();
  }, []);

  useEffect(() => {
    // Filter invoices berdasarkan searchTerm, year, status, corporateName, dan brand
    let filtered = invoices;

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (invoice) =>
          invoice.no_invoice.toLowerCase().includes(lowerSearch) ||
          invoice.no_order.toLowerCase().includes(lowerSearch) ||
          invoice.name.toLowerCase().includes(lowerSearch)
      );
    }

    if (year) {
      filtered = filtered.filter((invoice) =>
        invoice.date_created.includes(year.toString())
      );
    }

    if (status) {
      filtered = filtered.filter((invoice) => invoice.status === status);
    }

    if (corporateName) {
      filtered = filtered.filter((invoice) =>
        invoice.name.toLowerCase().includes(corporateName.toLowerCase())
      );
    }

    if (brand) {
      filtered = filtered.filter((invoice) =>
        invoice.brand.toLowerCase() === brand.toLowerCase()
      );
    }

    setFilteredInvoices(filtered);
    setTotalData(filtered.length);
    setCurrentPage(1); // Reset ke halaman 1 saat filter berubah
  }, [searchTerm, year, status, corporateName, brand, invoices]);

  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset ke halaman 1 saat pencarian
  };

  const handleDetail = (id_invoice) => {
    navigate(`/dashboard/invoice/detail-invoice/${id_invoice}`);
  };

  // Helper functions for abbreviations
  const getCategoryAbbreviation = (category) => {
    const abbreviations = {
      'VOUCHER': 'VO',
      'PASSENGER CAR': 'PA',
      'COMMERCIAL CAR': 'CO',
      'SPARE PART MOBIL': 'SP',
      'OTHERS': 'OT',
      'LAPTOP': 'LA',
      'LAIN - LAIN': 'LA',
      'FOOD AND BEVERAGE': 'FO',
      'SHOES': 'SH',
      'CLOTHES': 'CL',
      'KARANGAN BUNGA': 'KA',
      'POWERBANK': 'PO',
      'BAG': 'BA'
    };
    return abbreviations[category] || category.substring(0, 2).toUpperCase();
  };

  const getVendorAbbreviation = (vendor) => {
    const words = vendor.split(' ');
    if (words.length >= 2) {
      return (words[0].substring(0, 1) + words[1].substring(0, 1)).toUpperCase();
    }
    return vendor.substring(0, 2).toUpperCase();
  };

  const handleExportExcel = () => {
    Modal.confirm({
      title: 'Konfirmasi Export Excel',
      content: 'Apakah Anda yakin ingin mengekspor data invoice ke Excel?',
      okText: 'Export',
      okButtonProps: { className: 'bg-green-500 hover:bg-green-600 text-white' },
      cancelText: 'Batal',
      cancelButtonProps: { className: 'bg-red-500 hover:bg-red-600 text-white' },
      onOk: async () => {
        try {
          setExportLoading(true);
          const token = localStorage.getItem('token');

          // Use the new API for all data export
          const apiUrl = `${baseUrl}/nimda/invoice/report-penjualan-all?status=exported`;

          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              Authorization: `${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const result = await response.json();

          if (!Array.isArray(result)) {
            throw new Error('Invalid response data - expected array');
          }

          // Create Excel workbook
          const workbook = new ExcelJS.Workbook();

          // Tab 1: All Data
          const allDataSheet = workbook.addWorksheet('All DATA');

          // Add title
          allDataSheet.addRow(['LAPORAN SEMUA DATA INVOICE']);
          allDataSheet.addRow([]);
          allDataSheet.addRow(['ID Invoice', 'Transaction No', 'ID Sales Invoice', 'Customer Name', 'Grand Total', 'Sales', 'Brand', 'Product', 'SKU']);

          // Style the main title to prevent truncation
          allDataSheet.getRow(1).font = { bold: true, size: 16, color: { argb: 'FF000000' } };
          allDataSheet.getRow(1).alignment = { horizontal: 'center' };
          allDataSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6F3FF' }
          };
          // Merge cells for the title to prevent truncation
          allDataSheet.mergeCells(1, 1, 1, 10);

          // Add data from the new API response
          let allDataRow = 4;
          result.forEach(invoice => {
            if (invoice.details && invoice.details.length > 0) {
              invoice.details.forEach(detail => {
                allDataSheet.getCell(allDataRow, 1).value = invoice.id_invoice;
                allDataSheet.getCell(allDataRow, 2).value = invoice.transaction_no;
                allDataSheet.getCell(allDataRow, 3).value = invoice.id_sales_invoice;
                allDataSheet.getCell(allDataRow, 4).value = invoice.customer_name;
                allDataSheet.getCell(allDataRow, 5).value = invoice.grandtotal;
                allDataSheet.getCell(allDataRow, 6).value = invoice.sales;
                allDataSheet.getCell(allDataRow, 7).value = invoice.brand;
                allDataSheet.getCell(allDataRow, 8).value = detail.product;
                allDataSheet.getCell(allDataRow, 9).value = detail.sku;
                allDataRow++;
              });
            } else {
              // If no details, add one row with empty product/sku
              allDataSheet.getCell(allDataRow, 1).value = invoice.id_invoice;
              allDataSheet.getCell(allDataRow, 2).value = invoice.transaction_no;
              allDataSheet.getCell(allDataRow, 3).value = invoice.id_sales_invoice;
              allDataSheet.getCell(allDataRow, 4).value = invoice.customer_name;
              allDataSheet.getCell(allDataRow, 5).value = invoice.grandtotal;
              allDataSheet.getCell(allDataRow, 6).value = invoice.sales;
              allDataSheet.getCell(allDataRow, 7).value = invoice.brand;
              allDataSheet.getCell(allDataRow, 8).value = '-';
              allDataSheet.getCell(allDataRow, 9).value = '-';
              allDataRow++;
            }
          });

          // Style the sheets
          [allDataSheet].forEach(sheet => {
            // Style headers
            sheet.getRow(1).font = { bold: true, size: 16, color: { argb: 'FF000000' } };
            sheet.getRow(1).alignment = { horizontal: 'center' };
            sheet.getRow(1).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE6F3FF' }
            };

            // Style column headers and data
            sheet.eachRow((row, rowNumber) => {
              // Style column headers (row 3 with ID Invoice, Transaction No, etc.)
              if (rowNumber === 3) {
                row.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
                row.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FF87CEEB' } // Sky blue color
                };
                row.alignment = { horizontal: 'center' };

                // Add borders
                row.eachCell((cell) => {
                  cell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                  };
                });
              }

              // Style data rows
              else if (rowNumber > 3 && row.values && row.values.length > 1) {
                row.font = { size: 11, color: { argb: 'FF000000' } };
                row.alignment = { horizontal: 'left' };

                // Alternate row colors for better readability
                if (rowNumber % 2 === 0) {
                  row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF2F2F2' }
                  };
                } else {
                  row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFFFFF' }
                  };
                }

                // Add borders to data cells
                row.eachCell((cell, colNumber) => {
                  cell.border = {
                    top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                    left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                    bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                    right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
                  };

                  // Right align numeric values
                  if (colNumber > 2 && typeof cell.value === 'number') {
                    cell.alignment = { horizontal: 'right' };
                    cell.numFmt = '#,##0';
                  }
                });
              }
            });

            // Set column widths for All DATA sheet
            sheet.columns.forEach((column, index) => {
              if (index === 0) column.width = 15; // ID Invoice
              else if (index === 1) column.width = 25; // Transaction No
              else if (index === 2) column.width = 20; // ID Sales Invoice
              else if (index === 3) column.width = 30; // Customer Name
              else if (index === 4) column.width = 20; // Grand Total
              else if (index === 5) column.width = 15; // Sales
              else if (index === 6) column.width = 15; // Brand
              else if (index === 7) column.width = 50; // Product
              else if (index === 8) column.width = 25; // SKU
              else column.width = 15;
            });
          });

          // Generate and download file
          const buffer = await workbook.xlsx.writeBuffer();
          const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });

          const fileName = `laporan_invoice_all_data_${new Date().toISOString().split('T')[0]}.xlsx`;
          saveAs(blob, fileName);

          Modal.success({
            title: 'Sukses',
            content: 'Data berhasil diekspor ke Excel!',
            okButtonProps: { className: 'bg-green-500 hover:bg-green-600 text-white' },
          });

        } catch (error) {
          console.error('Error exporting Excel:', error);
          Modal.error({
            title: 'Gagal',
            content: `Gagal mengekspor Excel: ${error.message}`,
            okButtonProps: { className: 'bg-red-500 hover:bg-red-600 text-white' },
          });
        } finally {
          setExportLoading(false);
        }
      },
      onCancel: () => {
        console.log('Export Excel dibatalkan');
      },
    });
  };

  const columns = [
    {
      title: 'No',
      key: 'index',
      width: 60,
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: 'Invoice ID',
      dataIndex: 'no_invoice',
      key: 'no_invoice',
      width: 180,
      render: (text, record) => (
        <div>
          <a
            href={`/dashboard/invoice/detail-invoice/${record.id_invoice}`}
            className="text-blue-500 hover:text-blue-700"
            onClick={(e) => {
              e.preventDefault();
              handleDetail(record.id_invoice);
            }}
          >
            {text}
          </a>
          <div style={{ marginTop: 6 }}>
            <span style={{
              backgroundColor: record.exported ? '#e6f9ec' : '#f3f4f6',
              color: record.exported ? '#166534' : '#6b7280',
              padding: '4px 8px',
              borderRadius: '8px',
              display: 'inline-block',
              fontSize: '11px'
            }}>{record.exported ? 'Exported' : 'Not Exported'}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'No Order',
      dataIndex: 'no_order',
      key: 'no_order',
      width: 250,
      ellipsis: false,
      render: (text) => (
        <div style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
          <span style={{
            backgroundColor: '#fff0f6',
            color: '#9f1239',
            padding: '6px 10px',
            borderRadius: '10px',
            display: 'inline-block',
            fontSize: '12px'
          }}>{text}</span>
        </div>
      ),
    },
    {
      title: 'Nama Customer',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      ellipsis: false,
      render: (text) => <div style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>{text}</div>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const tagColor =
          status === 'PAID' ? 'green' :
            status === 'PARTIAL' ? 'blue' :
              status === 'CANCEL' ? 'red' :
                status === 'OPEN' ? 'orange' : 'default';
        return <Tag color={tagColor}>{status}</Tag>;
      },
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 120,
    },
    {
      title: 'Sisa',
      dataIndex: 'sisa',
      key: 'sisa',
      width: 120,
    },
    {
      title: 'Tanggal',
      dataIndex: 'date_created',
      key: 'date_created',
      width: 150,
    },
  ];

  return (
    <ConfigProvider theme={{ token: { fontFamily: 'Plus Jakarta Sans' } }}>
      <div className="mb-8 px-2 sm:px-0" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <Card className="shadow-sm">
          <div className="p-3 m-0 text-left">
            <Title level={4} className="m-0 p-0 text-left flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <FileTextOutlined style={{ fontSize: '24px', marginRight: '12px', color: '#1890ff' }} />
              Daftar Invoice
            </Title>
          </div>
          <div className="px-4 pb-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between mb-4">
              <div className="flex flex-wrap items-end gap-2 flex-grow">
                <div className="flex flex-col w-full sm:w-auto">
                  <label htmlFor="year" className="font-medium mb-1 text-xs">Pilih Tahun</label>
                  <Select
                    id="year"
                    value={year}
                    placeholder="Pilih Tahun"
                    style={{ width: 100 }}
                    onChange={(value) => setYear(value)}
                    allowClear
                    className="w-full sm:w-[100px]"
                  >
                    {generateYears().map((year) => (
                      <Option key={year} value={year}>{year}</Option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-col w-full sm:w-auto">
                  <label htmlFor="status" className="font-medium mb-1 text-xs">Pilih Status</label>
                  <Select
                    id="status"
                    placeholder="Pilih Status"
                    style={{ width: 130 }}
                    onChange={(value) => setStatus(value)}
                    allowClear
                    className="w-full sm:w-[130px]"
                  >
                    <Option value="PAID">Telah Dibayar</Option>
                    <Option value="OPEN">Belum Dibayar</Option>
                    <Option value="PARTIAL">Sebagian</Option>
                    <Option value="CANCEL">Dibatalkan</Option>
                  </Select>
                </div>
                <div className="flex flex-col w-full sm:w-auto">
                  <label htmlFor="company" className="font-medium mb-1 text-xs">Pilih Perusahaan</label>
                  <Select
                    id="company"
                    placeholder="Pilih atau Cari Perusahaan"
                    style={{ width: 150 }}
                    dropdownStyle={{ width: 480 }}
                    onChange={(value) => setCorporateName(value)}
                    allowClear
                    loading={companyList.length === 0}
                    showSearch
                    filterOption={(input, option) =>
                      option.children.toLowerCase().includes(input.toLowerCase())
                    }
                    className="w-full sm:w-[150px]"
                  >
                    {companyList.map((company) => (
                      <Option key={company.id_company} value={company.company_name}>
                        {company.company_name}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-col w-full sm:w-auto">
                  <label htmlFor="brand" className="font-medium mb-1 text-xs">Pilih Brand</label>
                  <Select
                    id="brand"
                    value={brand}
                    placeholder="Pilih Brand"
                    style={{ width: 120 }}
                    onChange={(value) => setBrand(value)}
                    allowClear
                    className="w-full sm:w-[120px]"
                  >
                    <Option value="JajaID">Jaja</Option>
                    <Option value="Auto">Auto</Option>
                  </Select>
                </div>
                <div className="flex flex-col w-full sm:w-auto">
                  <label htmlFor="search" className="font-medium mb-1 text-xs">Cari Invoice</label>
                  <div className="flex items-center w-full sm:w-[250px]">
                    <Input
                      id="search"
                      placeholder="Cari Invoice ID, No Order, atau Nama Customer"
                      className="border border-gray-300 rounded-md px-4 py-2 w-full text-xs focus:outline-none focus:border-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onPressEnter={handleSearch}
                    />
                  </div>
                </div>
              </div>
              <Button
                style={{ backgroundColor: '#28A745', borderColor: '#28A745', fontSize: '12px' }}
                className="w-full sm:w-auto text-white mt-4 lg:mt-0"
                onClick={handleExportExcel}
                loading={exportLoading}
              >
                {exportLoading ? 'Exporting...' : 'Export Excel'}
              </Button>
            </div>
            <Table
              columns={columns}
              dataSource={filteredInvoices.slice(
                (currentPage - 1) * pageSize,
                currentPage * pageSize
              )}
              rowKey="id_invoice"
              loading={loading}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalData,
                showSizeChanger: true,
              }}
              onChange={handleTableChange}
              scroll={{ x: false }}
              className="ant-table-custom"
            />
          </div>
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
          `}</style>
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default Invoice;