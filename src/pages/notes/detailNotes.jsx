import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Spin,
  Table,
  message,
  Space,
  Divider
} from 'antd';
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LogoJaja from '../../assets/LogoJaja.png';
import JajaAuto from '../../assets/JajaAuto.png';
import { baseUrl } from '@/configs';

const { Title, Text } = Typography;

const responsiveStyles = `
  /* Base styles for larger screens */
  .mobile-responsive {
    padding: 16px;
  }

  .mobile-responsive .ant-table {
    width: 100%;
  }

  /* Mobile adjustments */
  @media (max-width: 768px) {
    .mobile-responsive {
      padding: 8px;
    }

    .mobile-responsive .ant-typography {
      font-size: 18px !important;
      margin-bottom: 8px;
    }

    .mobile-responsive .ant-card {
      margin: 0 4px;
      padding: 8px !important;
      border-radius: 6px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }

    .mobile-responsive .ant-card-body {
      padding: 8px !important;
    }

    /* Table responsiveness */
    .mobile-responsive .ant-table {
      overflow-x: auto;
      font-size: 13px !important;
    }

    .mobile-responsive .ant-table-thead > tr > th {
      font-size: 12px;
      padding: 6px 8px;
      background: #f5f5f5;
      white-space: nowrap;
    }

    .mobile-responsive .ant-table-tbody > tr {
      border-bottom: 1px solid #e8e8e8;
    }

    .mobile-responsive .ant-table-tbody > tr > td {
      padding: 6px 8px;
      font-size: 13px;
      border: none;
    }

    /* Ensure table doesn't break layout */
    .mobile-responsive .ant-table-content {
      min-width: 100%;
      overflow-x: auto;
    }

    /* Buttons */
    .mobile-responsive .ant-btn {
      width: 100%;
      margin-bottom: 8px;
      font-size: 13px;
      padding: 6px;
      height: auto;
      border-radius: 4px;
    }

    .mobile-responsive .ant-space {
      flex-direction: column;
      width: 100%;
    }

    /* Grid layout */
    .mobile-responsive .grid-cols-2 {
      grid-template-columns: 1fr;
      gap: 8px;
    }
  }

  @media (max-width: 480px) {
    .mobile-responsive .ant-typography {
      font-size: 16px !important;
    }

    .mobile-responsive .ant-table-thead > tr > th {
      font-size: 11px;
      padding: 4px 6px;
    }

    .mobile-responsive .ant-table-tbody > tr > td {
      font-size: 12px;
      padding: 4px 6px;
    }

    .mobile-responsive .ant-btn {
      font-size: 12px;
      padding: 4px;
    }
  }
`;

const ReceiveNoteDetail = () => {
  const [receiveNote, setReceiveNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id_notes } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReceiveNoteDetail = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${baseUrl}/nimda/receive-notes/${id_notes}/detail`, {
          headers: {
            Authorization: `${token}`,
          },
        });

        if (response.data.success) {
          setReceiveNote(response.data.data);
        } else {
          message.error('Failed to fetch receive note details');
        }
      } catch (error) {
        console.error('Error fetching receive note detail:', error);
        message.error('Error fetching data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchReceiveNoteDetail();
  }, [id_notes]);

  const handleGoBack = () => {
    navigate('/dashboard/notes');
  };

  const handleEdit = () => {
    navigate(`/dashboard/notes/edit-notes/${id_notes}`);
  };

  const handlePrint = () => {
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      alert('Pop-up window was blocked. Please allow pop-ups for this site to print.');
      return;
    }

    const printStyles = `
      @page {
        size: A4;
        margin: 10mm;
      }
      body {
        font-family: 'Plus Jakarta Sans', sans-serif;
        line-height: 1.5;
        color: #333;
        background: #fff;
        margin: 0;
        padding: 0;
      }
      .print-container {
        max-width: 190mm;
        margin: 0 auto;
        padding: 10mm;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 4px 8px;
        font-size: 12px;
      }
      th {
        background-color: #f5f5f5;
      }
      .ant-divider {
        margin: 12px 0;
        border-top: 1px solid #ddd;
      }
      .text-right {
        text-align: right;
      }
      .text-center {
        text-align: center;
      }
      h4 {
        margin: 0 0 8px 0;
        font-size: 18px;
      }
      p {
        margin: 0 0 4px 0;
      }
      .text-xs {
        font-size: 10px;
      }
      .text-sm {
        font-size: 12px;
      }
      .font-bold {
        font-weight: bold;
      }
      .grid {
        display: grid;
      }
      .grid-cols-2 {
        grid-template-columns: 1fr 1fr;
      }
      .gap-4 {
        gap: 16px;
      }
      .mb-1 {
        margin-bottom: 4px;
      }
      .mb-2 {
        margin-bottom: 8px;
      }
      .mb-4 {
        margin-bottom: 16px;
      }
      .mt-6 {
        margin-top: 24px;
      }
      .p-3 {
        padding: 12px;
      }
      .border {
        border: 1px solid #ddd;
      }
      .rounded {
        border-radius: 4px;
      }
      .italic {
        font-style: italic;
      }
      @media print {
        .no-print {
          display: none;
        }
        button {
          display: none;
        }
      }
    `;

    const logoUrl = receiveNote?.brand === 'AUTO' ? JajaAuto : LogoJaja;
    const pengirimNama = receiveNote?.vendor_name || receiveNote?.supplier_name || receiveNote?.brand || 'Jaja';

    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receive Note - ${receiveNote?.receive_note_no || 'RN'}</title>
        <style>${printStyles}</style>
      </head>
      <body>
        <div id="print-root"></div>
        <div className="no-print" style="position: fixed; top: 20px; right: 20px;">
          <button onclick="window.print()" style="padding: 8px 16px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Print
          </button>
        </div>
      </body>
      </html>
    `);

    const formatReceiveNoteHTML = () => {
      const products = receiveNote?.details?.map((item, index) => `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td>${item.product_name || '-'}</td>
          <td style="text-align: center;">${item.uom || '-'}</td>
          <td style="text-align: right;">${item.quantity || '-'}</td>
          <td style="text-align: center;">${item.batch_code || '-'}</td>
          <td style="text-align: center;">${item.expired_date || '-'}</td>
          <td>${item.remarks || '-'}</td>
        </tr>
      `).join('') || '';

      return `
        <div class="print-container">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
            <div>
              <h4 style="margin: 0;">RECEIVE NOTE</h4>
              <p class="text-sm">No. Receive Note: ${receiveNote?.receive_note_no || 'N/A'}</p>
              <p class="text-sm">Tanggal: ${receiveNote?.receive_note_date || ''}</p>
            </div>
            <div style="text-align: right;">
              <img src="${logoUrl}" alt="${receiveNote?.brand || 'JajaID'}" style="height: 64px;">
            </div>
          </div>
          
          <hr style="margin: 12px 0; border: 0; border-top: 1px solid #ddd;">
          
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div class="mb-2">
                <p class="text-sm font-bold">Pengirim:</p>
                <p class="text-sm">${pengirimNama}</p>
              </div>
              
              <div class="mb-2">
                <p class="text-sm font-bold">Detail Penerima:</p>
                <p class="text-sm">${receiveNote?.person_name || 'N/A'}</p>
              </div>
            </div>
            
            <div>
              <div class="mb-2">
                <p class="text-sm font-bold">Pengiriman:</p>
                <p class="text-sm">${receiveNote?.ship_via || 'Tidak tersedia'}</p>
              </div>
              
              <div class="mb-2">
                <p class="text-sm font-bold">Detail Pengiriman:</p>
                <p class="text-sm">Alamat: ${receiveNote?.shipping_address || 'N/A'}</p>
                <p class="text-sm">Nomor Resi: ${receiveNote?.tracking_no || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">No</th>
                <th style="width: 25%; text-align: left;">Nama Barang</th>
                <th style="width: 10%; text-align: center;">Satuan</th>
                <th style="width: 10%; text-align: right;">Qty</th>
                <th style="width: 15%; text-align: center;">Kode Batch</th>
                <th style="width: 15%; text-align: center;">Tanggal Kadaluarsa</th>
                <th style="width: 20%; text-align: left;">Catatan</th>
              </tr>
            </thead>
            <tbody>
              ${products}
            </tbody>
          </table>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="mb-2">
                <p class="text-sm font-bold">Catatan:</p>
                <p class="text-sm italic">${receiveNote?.remarks || 'Tidak ada catatan'}</p>
              </div>
            </div>
            <div></div>
          </div>
        </div>
      `;
    };

    const printContent = newWindow.document.getElementById('print-root');
    if (printContent) {
      printContent.innerHTML = formatReceiveNoteHTML();
    }

    newWindow.document.close();
    newWindow.onload = function () {
      setTimeout(() => { }, 500);
    };
  };

  if (loading) {
    return (
      <div className="max-w-8xl mx-auto mobile-responsive">
        <Card bordered={false}>
          <div>Loading...</div>
        </Card>
      </div>
    );
  }

  if (!receiveNote) {
    return (
      <div className="max-w-8xl mx-auto mobile-responsive">
        <Card bordered={false}>
          <div className="flex justify-between items-center mb-6">
            <Title level={3}>Detail Receive Note</Title>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleGoBack}
              >
                Kembali
              </Button>
            </Space>
          </div>
          <div>Data tidak ditemukan</div>
        </Card>
      </div>
    );
  }

  const productData = receiveNote.details?.map((item, index) => ({
    key: item.id_receive_note_detail,
    no: index + 1,
    product: item.product_name || '-',
    satuan: item.uom || '-',
    quantity: item.quantity || '-',
    batch_code: item.batch_code || '-',
    expired_date: item.expired_date || '-',
    remarks: item.remarks || '-',
  })) || [];

  const columns = [
    { title: 'No', key: 'no', dataIndex: 'no', align: 'center', width: '5%' },
    {
      title: 'Nama Barang',
      key: 'product',
      dataIndex: 'product',
      render: text => <Text strong>{text}</Text>,
      width: '25%',
    },
    { title: 'Satuan', key: 'satuan', dataIndex: 'satuan', align: 'center', width: '10%' },
    { title: 'Qty', key: 'quantity', dataIndex: 'quantity', align: 'right', width: '10%' },
    { title: 'Kode Batch', key: 'batch_code', dataIndex: 'batch_code', align: 'center', width: '15%' },
    { title: 'Tanggal Kadaluarsa', key: 'expired_date', dataIndex: 'expired_date', align: 'center', width: '15%' },
    { title: 'Catatan', key: 'remarks', dataIndex: 'remarks', width: '20%' },
  ];

  return (
    <>
      <style>{responsiveStyles}</style>
      <div className="max-w-8xl mx-auto mobile-responsive">
        <Card bordered={false} className="mobile-responsive-card">
          <div className="flex justify-between items-center mb-6 flex-wrap">
            <Title level={3} className="m-0">Detail Receive Note</Title>
            <Space direction="horizontal" className="w-full sm:w-auto mt-4 sm:mt-0">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleGoBack}
              >
                Kembali
              </Button>
              <Button
                type="primary"
                icon={<EditOutlined />}
                className="bg-green-500"
                onClick={handleEdit}
              >
                Edit
              </Button>
              <Button
                type="primary"
                icon={<PrinterOutlined />}
                className="bg-blue-500 print-button"
                onClick={handlePrint}
              >
                Print
              </Button>
            </Space>
          </div>

          <div className="flex justify-between mb-6">
            <div>
              <div className="mb-1">
                <span className="text-gray-500">Nomor Receive Note</span>
                <span className="ml-4">: {receiveNote.receive_note_no || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">Tanggal Penerimaan</span>
                <span className="ml-1">: {receiveNote.receive_note_date || '-'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <div className="mb-2 text-gray-600 font-semibold">Detail Penerima</div>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex">
                  <span className="text-gray-500 min-w-[80px] sm:min-w-[100px]">Nama</span>
                  <span>: {receiveNote.person_name || '-'}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 min-w-[80px] sm:min-w-[100px]">Alamat</span>
                  <span>: {receiveNote.shipping_address || '-'}</span>
                </div>
              </div>
            </div>
            <div>
              <div className="mb-2 text-gray-600 font-semibold">Detail Pengiriman</div>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex">
                  <span className="text-gray-500 min-w-[80px] sm:min-w-[100px]">Pengirim</span>
                  <span>: {receiveNote.vendor_name || receiveNote.person_name || receiveNote.brand || 'Jaja'}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 min-w-[80px] sm:min-w-[100px]">Alamat</span>
                  <span>: {receiveNote.address || '-'}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 min-w-[80px] sm:min-w-[100px]">Nomor Resi</span>
                  <span>: {receiveNote.tracking_no || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={productData}
            pagination={false}
            rowKey="key"
            className="mb-6"
            scroll={{ x: 'max-content' }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="mb-2 text-gray-600 text-sm">Catatan :</div>
              <div className="text-gray-500 italic text-sm">{receiveNote.remarks || 'Tidak ada catatan'}</div>
            </div>
            <div></div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default ReceiveNoteDetail;