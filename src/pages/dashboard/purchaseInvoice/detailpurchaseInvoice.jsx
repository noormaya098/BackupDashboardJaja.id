import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Dropdown, Menu, Table, Card, Typography, Input, Spin, Modal } from 'antd';
import { PrinterOutlined, EditOutlined, SendOutlined } from '@ant-design/icons';
import axios from 'axios';
import LogoJaja from "../../../assets/LogoJaja.png";
import JajaAuto from "../../../assets/JajaAuto.png";
import { baseUrl } from '@/configs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PurchaseInvoiceDetail = () => {
  const { id_purchase_invoice } = useParams();
  const navigate = useNavigate();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to calculate total_product
  const calculateTotalProduct = (rate, quantity, discount, tax) => {
    const subtotal = (parseFloat(rate) || 0) * (parseFloat(quantity) || 0);
    const discountAmount = subtotal * ((parseFloat(discount) || 0) / 100);
    const totalAfterDiscount = subtotal - discountAmount;
    const taxAmount = parseFloat(tax) || 0;
    return totalAfterDiscount + taxAmount;
  };

  // Function to convert number to Indonesian text
  const numberToText = (num) => {
    const units = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
    const teens = [
      'sepuluh',
      'sebelas',
      'dua belas',
      'tiga belas',
      'empat belas',
      'lima belas',
      'enam belas',
      'tujuh belas',
      'delapan belas',
      'sembilan belas',
    ];
    const tens = ['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'];
    const thousands = ['', 'ribu', 'juta', 'miliar', 'triliun'];

    if (num === 0) return 'nol rupiah';

    let words = [];
    let chunkCount = 0;

    while (num > 0) {
      let chunk = num % 1000;
      let chunkWords = [];

      if (chunk > 0) {
        if (chunk >= 100) {
          let hundred = Math.floor(chunk / 100);
          if (hundred === 1) {
            chunkWords.push('seratus');
          } else {
            chunkWords.push(`${units[hundred]} ratus`);
          }
          chunk %= 100;
        }

        if (chunk >= 10 && chunk <= 19) {
          chunkWords.push(teens[chunk - 10]);
        } else if (chunk >= 20) {
          let ten = Math.floor(chunk / 10);
          let unit = chunk % 10;
          if (unit > 0) {
            chunkWords.push(`${tens[ten]} ${units[unit]}`);
          } else {
            chunkWords.push(tens[ten]);
          }
        } else if (chunk > 0) {
          if (chunk === 1 && chunkCount === 1) {
            chunkWords.push('seribu');
          } else {
            chunkWords.push(units[chunk]);
          }
        }

        if (chunkWords.length > 0 && chunkCount > 0) {
          chunkWords.push(thousands[chunkCount]);
        }
      }

      words.unshift(...chunkWords);
      num = Math.floor(num / 1000);
      chunkCount++;
    }

    return words.join(' ').trim() + ' rupiah';
  };

  useEffect(() => {
    const fetchInvoiceData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${baseUrl}/nimda/purchase-invoice/${id_purchase_invoice}`, {
          headers: {
            // Tambahkan header autentikasi jika diperlukan, misalnya:
            // Authorization: `Bearer ${yourToken}`
          },
        });

        const apiData = response.data.data;

        // Transformasi data API agar sesuai dengan struktur yang diharapkan
        const transformedData = {
          id_purchase_invoice: apiData.id_purchase_invoice,
          invoice_no: apiData.transaction_no || 'N/A',
          invoice_date: apiData.transaction_date || 'N/A',
          supplier_name: apiData.person_name || 'N/A',
          email: apiData.email || 'N/A',
          term_name: apiData.term_name || 'N/A',
          shipping_address: apiData.address || 'N/A',
          address: apiData.address || 'N/A',
          shipping_date: apiData.transaction_date || 'N/A',
          due_date: apiData.due_date || 'N/A',
          warehouse_name: 'Auto',
          shipping_price: parseFloat(apiData.deposit) || 0,
          remarks: apiData.message || 'N/A',
          id_vendor: apiData.id_vendor, // Add this line to include id_vendor
          invoice_details: apiData.tb_purchase_invoice_details.map(detail => ({
            product_id: detail.id_purchase_invoice_detail,
            product_name: detail.product_name || 'N/A',
            quantity: parseFloat(detail.quantity) || 0,
            rate: parseFloat(detail.rate) || 0,
            discount: parseFloat(detail.discount) || 0,
            taxable: detail.tax !== '0.00',
            ppn: parseFloat(detail.tax) || 0,
            total_product: parseFloat(detail.total_price) || 0,
          })),
        };

        setInvoiceData(transformedData);
      } catch (error) {
        console.error('Error fetching invoice data:', error);
        setError('Gagal memuat data invoice. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [id_purchase_invoice]);

  const handleExportJournal = () => {
    Modal.confirm({
      title: 'Konfirmasi Ekspor',
      content: 'Apakah Anda yakin ingin mengekspor invoice ini ke JurnalID?',
      okText: 'Ekspor',
      okButtonProps: { className: 'bg-green-500 hover:bg-green-600 text-white' },
      cancelText: 'Batal',
      cancelButtonProps: { className: 'hover:bg-gray-100' },
      onOk: async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem('token');

          const requestJson = async (url, options) => {
            const res = await fetch(url, options);
            let data = null;
            try {
              data = await res.json();
            } catch (e) {
              // ignore json parse error
            }
            return { ok: res.status === 200, status: res.status, data };
          };

          const getErrorFullMessages = (data, fallback = 'Terjadi kesalahan') => {
            const messages = data?.error?.error_full_messages;
            return Array.isArray(messages) && messages.length > 0 ? messages.join('\n') : (data?.message || fallback);
          };

          const confirmAsync = (title, content, okText = 'Lanjut', cancelText = 'Batal') =>
            new Promise((resolve) => {
              Modal.confirm({
                title,
                content,
                okText,
                cancelText,
                okButtonProps: { className: 'bg-blue-600 hover:bg-blue-700 text-white' },
                cancelButtonProps: { className: 'hover:bg-gray-100' },
                onOk: () => resolve(true),
                onCancel: () => resolve(false),
              });
            });

          const purchaseInvoicePayload = {
            id_purchase_invoice: parseInt(id_purchase_invoice),
          };

          // Step 1: nimda/purchase-invoice/export
          const step1 = await requestJson(`${baseUrl}/nimda/purchase-invoice/export`, {
            method: 'POST',
            headers: {
              Authorization: `${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(purchaseInvoicePayload),
          });

          if (step1.ok) {
            Modal.success({
              title: 'Sukses',
              content: step1.data?.message || 'Invoice berhasil diekspor ke JurnalID!',
              okButtonProps: { className: 'bg-green-500 hover:bg-green-600 text-white' },
            });
            return;
          }

          // Show single confirm including error message, then ask to continue to step 2
          setLoading(false);
          const step1Err = getErrorFullMessages(step1.data, 'Gagal mengekspor invoice');
          const proceedStep2 = await confirmAsync(
            'Lanjut ke Langkah 2 (Export Vendor)?',
            `${step1Err}\n\nEkspor invoice gagal. Ingin melanjutkan untuk export vendor ke Jurnal?`
          );
          if (!proceedStep2) return;
          setLoading(true);

          // Step 2: nimda/vendor/export/send
          const step2 = await requestJson(`${baseUrl}/nimda/vendor/export/send`, {
            method: 'POST',
            headers: {
              Authorization: `${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id_vendor: invoiceData.id_vendor }), // Use dynamic id_vendor
          });

          if (step2.ok) {
            Modal.success({
              title: 'Sukses',
              content: step2.data?.message || 'Vendor berhasil diekspor!',
              okButtonProps: { className: 'bg-green-500 hover:bg-green-600 text-white' },
            });
            return;
          }

          // Show single confirm including error message, then ask to continue to step 3
          setLoading(false);
          const step2Err = getErrorFullMessages(step2.data, 'Gagal export vendor');
          const proceedStep3 = await confirmAsync(
            'Lanjut ke Langkah 3 (Ulangi Export Invoice)?',
            `${step2Err}\n\nExport vendor gagal. Ingin mencoba ulang export invoice?`
          );
          if (!proceedStep3) return;
          setLoading(true);

          // Step 3: nimda/purchase-invoice/export (retry)
          const step3 = await requestJson(`${baseUrl}/nimda/purchase-invoice/export`, {
            method: 'POST',
            headers: {
              Authorization: `${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(purchaseInvoicePayload),
          });

          if (step3.ok) {
            Modal.success({
              title: 'Sukses',
              content: step3.data?.message || 'Invoice berhasil diekspor ke JurnalID!',
              okButtonProps: { className: 'bg-green-500 hover:bg-green-600 text-white' },
            });
            return;
          }

          // Show final error from step 3 (single modal)
          setLoading(false);
          Modal.error({
            title: 'Gagal',
            content: getErrorFullMessages(step3.data, 'Gagal mengekspor invoice (ulang)'),
            okButtonProps: { className: 'bg-red-500 hover:bg-red-600 text-white' },
          });
        } catch (error) {
          console.error('Error in export flow:', error);
          Modal.error({
            title: 'Gagal',
            content: error.message || 'Terjadi kesalahan tak terduga saat proses ekspor',
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

  const formatNumber = (num, isQty = false) => {
    if (isQty) {
      return parseInt(num).toLocaleString('id-ID');
    }
    return parseFloat(num).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePrintOption = (option, type) => {
    if (!invoiceData) return;

    const printWindow = window.open('', '_blank');

    const items = invoiceData?.invoice_details?.map((detail, index) => ({
      no: index + 1,
      namaBarang: detail.product_name || 'N/A',
      satuan: 'Unit',
      qty: parseFloat(detail.quantity) || 0,
      harga: parseFloat(detail.rate) || 0,
      disc: `${parseFloat(detail.discount) || 0}%`,
      ppn: detail.taxable ? `${parseFloat(detail.ppn) || 0}%` : '0%',
      total: parseFloat(detail.total_product) || 0,
    })) || [];

    const total = items.reduce((acc, item) => acc + item.total, 0);
    const shippingPrice = invoiceData?.shipping_price || 0;
    const grandTotal = total + shippingPrice;

    const allocation = invoiceData?.warehouse_name?.toLowerCase();
    const logoSrc = allocation === 'auto' ? JajaAuto : LogoJaja;

    const logoHTML = `
      <div class="logo">
        <img src="${logoSrc}" alt="Logo Jaja" style="max-height: 70px; width: auto;">
      </div>
    `;

    let signatureHTML = '';
    if (type === 'printpo_bulat') {
      signatureHTML = `
        <div class="signature-section" style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 11px;">
          <div class="signature-box" style="text-align: center; width: 45%;">
            <p style="margin: 0; font-weight: 500;">Diperiksa oleh:</p>
            <br/><br/><br/><br/>
            <div style="border-bottom: 2px solid #1e40af; width: 180px; margin: 15px auto 10px;"></div>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">Filma Andry</p>
          </div>
          <div class="signature-box" style="text-align: center; width: 45%;">
            <p style="margin: 0; font-weight: 500;">Diperiksa oleh:</p>
            <br/><br/><br/><br/>
            <div style="border-bottom: 2px solid #1e40af; width: 180px; margin: 15px auto 10px;"></div>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">Ernanto T.W</p>
          </div>
        </div>
      `;
    } else if (type === 'kacab') {
      signatureHTML = `
        <div class="signature-section" style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 11px;">
          <div class="signature-box" style="text-align: center; width: 30%;">
            <p style="margin: 0; font-weight: 500;">Diperiksa oleh:</p>
            <br/><br/><br/><br/>
            <div style="border-bottom: 2px solid #1e40af; width: 180px; margin: 15px auto 10px;"></div>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">Filma Andry</p>
          </div>
          <div class="signature-box" style="text-align: center; width: 30%;">
            <p style="margin: 0; font-weight: 500;">Diperiksa oleh:</p>
            <br/><br/><br/><br/>
            <div style="border-bottom: 2px solid #1e40af; width: 180px; margin: 15px auto 10px;"></div>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">Ernanto T.W</p>
          </div>
          <div class="signature-box" style="text-align: center; width: 30%;">
            <p style="margin: 0; font-weight: 500;">Disetujui oleh:</p>
            <br/><br/><br/><br/>
            <div style="border-bottom: 2px solid #1e40af; width: 180px; margin: 15px auto 10px;"></div>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">Adriansyah</p>
          </div>
        </div>
      `;
    } else if (type === 'BA') {
      signatureHTML = `
        <div class="signature-section" style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 11px;">
          <div class="signature-box" style="text-align: center; width: 22%;">
            <p style="margin: 0; font-weight: 500;">Diperiksa oleh:</p>
            <br/><br/><br/><br/>
            <div style="border-bottom: 2px solid #1e40af; width: 180px; margin: 15px auto 10px;"></div>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">Filma Andry</p>
          </div>
          <div class="signature-box" style="text-align: center; width: 22%;">
            <p style="margin: 0; font-weight: 500;">Diperiksa oleh:</p>
            <br/><br/><br/><br/>
            <div style="border-bottom: 2px solid #1e40af; width: 180px; margin: 15px auto 10px;"></div>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">Ernanto T.W</p>
          </div>
          <div class="signature-box" style="text-align: center; width: 22%;">
            <p style="margin: 0; font-weight: 500;">Disetujui oleh:</p>
            <br/><br/><br/><br/>
            <div style="border-bottom: 2px solid #1e40af; width: 180px; margin: 15px auto 10px;"></div>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">Adriansyah</p>
          </div>
          <div class="signature-box" style="text-align: center; width: 22%;">
            <p style="margin: 0; font-weight: 500;">Disetujui Oleh:</p>
            <br/><br/><br/><br/>
            <div style="border-bottom: 2px solid #1e40af; width: 180px; margin: 15px auto 10px;"></div>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">Willianoes S</p>
          </div>
        </div>
      `;
    } else if (type === 'printpo_nobulat' || type === 'no_ttd' || type === 'ba_noTTD') {
      signatureHTML = '';
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Invoice - ${invoiceData?.invoice_no || 'N/A'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
            body { 
              font-family: 'Plus Jakarta Sans', sans-serif; 
              margin: 20px; 
              color: #333;
              line-height: 1.4;
              font-size: 12px;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              margin-bottom: 15px; 
            }
            @media (max-width: 768px) {
              .header {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
              }
            }
            .title { 
              font-size: 18px; 
              font-weight: 700; 
              color: #1e40af;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .company-info { 
              text-align: right; 
              font-size: 11px;
              line-height: 1.5;
              color: #555;
              margin-bottom: 15px;
            }
            hr { 
              border: none;
              height: 2px;
              background: #2563eb;
              margin: 15px 0; 
            }
            .info-section { 
              margin-bottom: 15px; 
              font-size: 11px;
              padding: 12px;
              background: #f8fafc;
              border-radius: 6px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            @media (max-width: 768px) {
              .info-grid {
                grid-template-columns: 1fr;
                gap: 10px;
              }
            }
            .info-item {
              margin-bottom: 8px;
            }
            .info-item label {
              font-weight: 500;
              color: #4b5563;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 15px; 
              font-size: 11px;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              overflow: hidden;
            }
            @media (max-width: 768px) {
              table {
                font-size: 9px;
              }
              th, td {
                padding: 4px 2px !important;
              }
            }
            th, td { 
              padding: 8px; 
              text-align: left; 
              border-bottom: 1px solid #e2e8f0;
            }
            th { 
              background-color: #1e40af; 
              color: white;
              font-weight: 500;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            tr:hover {
              background-color: #f1f5f9;
            }
            .totals { 
              margin-top: 15px; 
              font-size: 11px;
              text-align: right;
            }
            .totals table {
              width: 50%;
              margin-left: auto;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
            }
            @media (max-width: 768px) {
              .totals table {
                width: 100%;
                margin-left: 0;
              }
            }
            .totals table td {
              padding: 6px 8px;
            }
            .totals table tr:last-child {
              background-color: #dbeafe;
              font-weight: bold;
            }
            .remarks {
              margin: 15px 0;
              font-size: 11px;
              font-style: italic;
              color: #475569;
            }
            .signature-section {
              margin-top: 30px;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
            }
            .signature-box {
              text-align: center;
            }
            @media print {
              body { 
                margin: 0.5cm; 
                font-size: 10px; 
                line-height: 1.3; 
              }
              @page { 
                size: A4; 
                margin: 0.5cm; 
              }
              .info-section {
                background-color: #f8fafc !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              th {
                background-color: #1e40af !important;
                color: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              tr:nth-child(even) {
                background-color: #f9fafb !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .totals table tr:last-child {
                background-color: #dbeafe !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">PURCHASE INVOICE</div>
            ${logoHTML}
          </div>
          <div class="company-info">
            JL. H. BAPING RAYA NO. 100,<br>
            CIRACAS PASAR REBO, JAKARTA 13740<br>
            TELP (021) 87796010 FAX (021) 87790903<br>
            JAJAID@gmail.com
          </div>
          <hr />
          <div class="info-section">
            <div class="info-grid">
              <div>
                <div class="info-item"><label>Nomor Invoice:</label> ${invoiceData?.invoice_no || 'N/A'}</div>
                <div class="info-item"><label>Tanggal Invoice:</label> ${invoiceData?.invoice_date || 'N/A'}</div>
                <div class="info-item"><label>Email:</label> ${invoiceData?.email || 'N/A'}</div>
                <div class="info-item"><label>T.O.P:</label> ${invoiceData?.term_name || 'N/A'}</div>
              </div>
              <div>
                <div class="info-item"><label>Kepada Yth:</label> ${invoiceData?.supplier_name || 'N/A'}</div>
                <div class="info-item"><label>Alamat Pengiriman:</label> ${invoiceData?.shipping_address || 'N/A'}</div>
                <div class="info-item"><label>Tanggal Kirim:</label> ${invoiceData?.shipping_date || '-'}</div>
                <div class="info-item"><label>Jatuh Tempo:</label> ${invoiceData?.due_date || '-'}</div>
              </div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Barang</th>
                <th>Qty</th>
                <th>Satuan</th>
                <th>Harga @</th>
                <th>Disc</th>
                <th>PPN</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${items
        .map(
          (item) => `
                <tr>
                  <td>${item.no}</td>
                  <td>${item.namaBarang}</td>
                  <td style="text-align: right;">${formatNumber(item.qty, true)}</td>
                  <td style="text-align: center;">${item.satuan}</td>
                  <td style="text-align: right;">${formatNumber(item.harga)}</td>
                  <td style="text-align: center;">${item.disc}</td>
                  <td style="text-align: center;">${item.ppn}</td>
                  <td style="text-align: right;">${formatNumber(item.total)}</td>
                </tr>
              `
        )
        .join('')}
            </tbody>
          </table>
          <div class="totals">
            <table>
              <tr>
                <td>Total</td>
                <td style="text-align: right;">${formatNumber(total)}</td>
              </tr>
              <tr>
                <td>Ongkos Kirim</td>
                <td style="text-align: right;">${formatNumber(shippingPrice)}</td>
              </tr>
              <tr>
                <td>Grand Total</td>
                <td style="text-align: right;">${formatNumber(grandTotal)}</td>
              </tr>
            </table>
          </div>
          <div class="remarks">
            <div><strong>Terbilang:</strong> ${numberToText(Math.floor(grandTotal))}</div>
            <div><strong>Catatan:</strong> ${invoiceData?.remarks || 'Mohon proses pembayaran segera.'}</div>
          </div>
          ${signatureHTML}
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const menu = (
    <Menu>
      <Menu.Item key="1" onClick={() => handlePrintOption('Cetak Total Pembulatan', 'printpo_bulat')}>
        Cetak Total Pembulatan
      </Menu.Item>
      <Menu.Item key="2" onClick={() => handlePrintOption('Cetak Total Tanpa TTD', 'printpo_nobulat')}>
        Cetak Total Tanpa TTD
      </Menu.Item>
      <Menu.Item key="3" onClick={() => handlePrintOption('Cetak Tanpa TTD', 'no_ttd')}>
        Cetak Tanpa TTD
      </Menu.Item>
      <Menu.Item key="4" onClick={() => handlePrintOption('Cetak hingga Kacab', 'kacab')}>
        Cetak hingga Kacab
      </Menu.Item>
      <Menu.Item key="5" onClick={() => handlePrintOption('Cetak hingga BA', 'BA')}>
        Cetak hingga BA
      </Menu.Item>
      <Menu.Item key="6" onClick={() => handlePrintOption('Cetak BA Tanpa TTD', 'ba_noTTD')}>
        Cetak BA Tanpa TTD
      </Menu.Item>
    </Menu>
  );

  const columns = [
    { title: 'No', dataIndex: 'no', key: 'no', width: 50, align: 'center' },
    { title: 'Nama Barang', dataIndex: 'namaBarang', key: 'namaBarang' },
    { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 100, align: 'right' },
    { title: 'Satuan', dataIndex: 'satuan', key: 'satuan', width: 100, align: 'center' },
    { title: 'Harga @', dataIndex: 'harga', key: 'harga', width: 120, align: 'right' },
    { title: 'Disc', dataIndex: 'disc', key: 'disc', width: 80, align: 'center' },
    { title: 'PPN', dataIndex: 'ppn', key: 'ppn', width: 80, align: 'center' },
    { title: 'Total', dataIndex: 'total', key: 'total', width: 120, align: 'right' },
  ];

  const data = invoiceData?.invoice_details?.map((detail, index) => ({
    key: `${index + 1}`,
    no: `${index + 1}`,
    namaBarang: detail.product_name || 'N/A',
    qty: formatNumber(parseFloat(detail.quantity) || 0, true),
    satuan: 'Unit',
    harga: formatNumber(parseFloat(detail.rate) || 0),
    disc: `${parseFloat(detail.discount) || 0}%`,
    ppn: detail.taxable ? `${parseFloat(detail.ppn) || 0}%` : '0%',
    total: formatNumber(parseFloat(detail.total_product) || 0),
  })) || [];

  const receiveNoteColumns = [
    {
      title: 'Receive Note No',
      dataIndex: 'receive_note_no',
      key: 'receive_note_no',
      render: (text, record) => (
        <a
          onClick={() => navigate(`/dashboard/notes/detail-order/${record.id_receive_note}`)}
          style={{ color: '#1e40af', cursor: 'pointer' }}
        >
          {text}
        </a>
      ),
    },
    { title: 'Tanggal', dataIndex: 'receive_note_date', key: 'receive_note_date', width: 120 },
    { title: 'Nama', dataIndex: 'person_name', key: 'person_name', width: 150 },
    { title: 'Catatan', dataIndex: 'remarks', key: 'remarks' },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Memuat data..." />
      </div>
    );
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;
  }

  if (!invoiceData) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: Data tidak ditemukan</div>;
  }

  const total = invoiceData?.invoice_details?.reduce((acc, item) => acc + parseFloat(item.total_product) || 0, 0) || 0;
  const shippingPrice = parseFloat(invoiceData.shipping_price) || 0;
  const grandTotal = total + shippingPrice;

  const allocation = invoiceData?.warehouse_name?.toLowerCase();
  const logoSrc = allocation === 'auto' ? JajaAuto : LogoJaja;

  return (
    <Card bordered={false} className="shadow-md rounded-lg w-full responsive-card" style={{ padding: '16px' }}>
      <div className="header responsive-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Title level={3} className="responsive-title" style={{ margin: 0, color: '#1e40af' }}>Purchase Invoice</Title>
        <img src={logoSrc} alt={allocation === 'auto' ? 'Jaja Auto' : 'Jaja ID'} className="responsive-logo" style={{ maxHeight: '70px', width: 'auto' }} />
      </div>

      <div className="responsive-button-group" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <Button
          type="default"
          icon={<SendOutlined />}
          onClick={handleExportJournal}
          className="responsive-button"
          size="small"
        >
          <span className="button-text">Export Jurnal ID</span>
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
          onClick={() => navigate(`/dashboard/purchaseinvoice/edit/${id_purchase_invoice}`)}
          className="responsive-button"
          size="small"
        >
          <span className="button-text">Edit</span>
        </Button>
        <Dropdown overlay={menu} placement="bottomLeft">
          <Button type="primary" ghost icon={<PrinterOutlined />} className="responsive-button" size="small">
            <span className="button-text">Opsi Cetak</span>
          </Button>
        </Dropdown>
      </div>

      <div className="info-section responsive-info-section" style={{ background: '#f8fafc', padding: '16px', borderRadius: '6px', marginBottom: '16px' }}>
        <div className="responsive-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <div style={{ marginBottom: '8px' }}><Text strong>Nomor Invoice:</Text> {invoiceData.invoice_no || '-'}</div>
            <div style={{ marginBottom: '8px' }}><Text strong>Tanggal Invoice:</Text> {invoiceData.invoice_date || '-'}</div>
            <div style={{ marginBottom: '8px' }}><Text strong>Email:</Text> {invoiceData.email || '-'}</div>
            <div style={{ marginBottom: '8px' }}><Text strong>T.O.P:</Text> {invoiceData.term_name || '-'}</div>
          </div>
          <div>
            <div style={{ marginBottom: '8px' }}><Text strong>Kepada Yth:</Text> {invoiceData.supplier_name || '-'}</div>
            <div style={{ marginBottom: '8px' }}><Text strong>Alamat Pengiriman:</Text> {invoiceData.shipping_address || '-'}</div>
            <div style={{ marginBottom: '8px' }}><Text strong>Tanggal Kirim:</Text> {invoiceData.shipping_date || '-'}</div>
            <div style={{ marginBottom: '8px' }}><Text strong>Jatuh Tempo:</Text> {invoiceData.due_date || '-'}</div>
          </div>
        </div>
      </div>

      <div className="responsive-table-container">
        <Table
          columns={columns}
          dataSource={data}
          bordered
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
          style={{ marginBottom: '16px' }}
          rowClassName="hover:bg-gray-50"
          className="responsive-table"
        />
      </div>

      <div className="totals responsive-totals" style={{ textAlign: 'right', marginBottom: '16px' }}>
        <Table
          columns={[
            { title: 'Item', dataIndex: 'item', key: 'item', width: '50%' },
            { title: 'Nilai', dataIndex: 'nilai', key: 'nilai', align: 'right' },
          ]}
          dataSource={[
            { key: '1', item: 'Total', nilai: formatNumber(total) },
            { key: '2', item: 'Ongkos Kirim', nilai: formatNumber(shippingPrice) },
            { key: '3', item: 'Grand Total', nilai: formatNumber(grandTotal) },
          ]}
          bordered
          pagination={false}
          size="small"
          showHeader={false}
          style={{ width: '50%', marginLeft: 'auto' }}
          className="responsive-totals-table"
        />
      </div>

      <div className="remarks responsive-remarks" style={{ marginBottom: '16px' }}>
        <div><Text strong>Terbilang:</Text> {numberToText(Math.floor(grandTotal))}</div>
        <div><Text strong>Catatan:</Text> {invoiceData.remarks || 'Mohon proses pembayaran segera.'}</div>
      </div>

      <div className="responsive-comment-section" style={{ marginBottom: '16px' }}>
        <TextArea rows={4} placeholder="Tambahkan catatan atau komentar..." style={{ marginBottom: '8px' }} />
        <Button
          type="primary"
          icon={<SendOutlined />}
          style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
          className="responsive-button"
        >
          <span className="button-text">Kirim Komentar</span>
        </Button>
      </div>

      {/* <div>
        <Title level={4} style={{ marginBottom: '8px' }}>Receive Notes</Title>
        <Table
          columns={receiveNoteColumns}
          dataSource={invoiceData?.tb_receive_notes?.map((note) => ({
            key: note.id_receive_note,
            id_receive_note: note.id_receive_note,
            receive_note_no: note.receive_note_no,
            receive_note_date: note.receive_note_date,
            person_name: note.person_name,
            remarks: note.remarks,
          })) || []}
          bordered
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
        />
      </div> */}

      <style jsx>{`
        .ant-table-thead > tr > th {
          background-color: #1e40af;
          color: white;
          font-weight: 500;
          font-size: 12px;
        }
        .ant-table-tbody > tr > td {
          font-size: 12px;
          color: #4b5563;
        }
        .ant-table-tbody > tr:hover > td {
          background-color: #f1f5f9;
        }
        .ant-btn {
          font-size: 12px;
        }

        /* Responsive Styles */
        .responsive-card {
          padding: 8px !important;
        }

        .responsive-header {
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 12px;
        }

        .responsive-title {
          font-size: 18px !important;
          margin-bottom: 8px !important;
        }

        .responsive-logo {
          max-height: 50px !important;
          align-self: flex-end;
        }

        .responsive-button-group {
          flex-direction: row !important;
          gap: 6px !important;
          align-items: center !important;
        }

        .responsive-button {
          width: 100% !important;
          margin-bottom: 4px !important;
        }

        .button-text {
          display: inline;
        }

        .responsive-info-section {
          padding: 12px !important;
        }

        .responsive-info-grid {
          grid-template-columns: 1fr !important;
          gap: 12px !important;
        }

        .responsive-table-container {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .responsive-table {
          min-width: 600px;
        }

        .responsive-totals {
          text-align: left !important;
        }

        .responsive-totals-table {
          width: 100% !important;
          margin-left: 0 !important;
        }

        .responsive-remarks {
          font-size: 12px;
          line-height: 1.4;
        }

        .responsive-comment-section {
          width: 100%;
        }

        /* Mobile specific styles */
        @media (max-width: 768px) {
          .responsive-card {
            padding: 4px !important;
            margin: 4px !important;
          }

          .responsive-header {
            margin-bottom: 12px !important;
          }

          .responsive-title {
            font-size: 16px !important;
          }

          .responsive-logo {
            max-height: 40px !important;
          }

          .responsive-button-group {
            margin-bottom: 12px !important;
            flex-direction: row !important;
            justify-content: flex-end !important;
            align-items: center !important;
            gap: 6px !important;
          }

          .responsive-button {
            font-size: 11px !important;
            height: 28px !important;
          }

          .responsive-info-section {
            padding: 8px !important;
            margin-bottom: 12px !important;
          }

          .responsive-info-grid {
            gap: 8px !important;
          }

          .responsive-table {
            font-size: 10px !important;
            min-width: 500px;
          }

          .responsive-table .ant-table-thead > tr > th {
            font-size: 10px !important;
            padding: 4px 2px !important;
          }

          .responsive-table .ant-table-tbody > tr > td {
            font-size: 10px !important;
            padding: 4px 2px !important;
          }

          .responsive-totals-table {
            font-size: 11px !important;
          }

          .responsive-remarks {
            font-size: 11px !important;
            margin-bottom: 12px !important;
          }

          .responsive-comment-section {
            margin-bottom: 12px !important;
          }

          .responsive-comment-section .ant-input {
            font-size: 12px !important;
          }
        }

        /* Extra small devices */
        @media (max-width: 480px) {
          .responsive-card {
            padding: 2px !important;
            margin: 2px !important;
          }

          .responsive-title {
            font-size: 14px !important;
          }

          .responsive-logo {
            max-height: 35px !important;
          }

          .responsive-button {
            font-size: 10px !important;
            height: 32px !important;
          }

          .responsive-info-section {
            padding: 6px !important;
          }

          .responsive-table {
            font-size: 9px !important;
            min-width: 450px;
          }

          .responsive-table .ant-table-thead > tr > th {
            font-size: 9px !important;
            padding: 2px 1px !important;
          }

          .responsive-table .ant-table-tbody > tr > td {
            font-size: 9px !important;
            padding: 2px 1px !important;
          }

          .responsive-totals-table {
            font-size: 10px !important;
          }

          .responsive-remarks {
            font-size: 10px !important;
          }
        }

        /* Very small devices */
        @media (max-width: 360px) {
          .responsive-title {
            font-size: 12px !important;
          }

          .responsive-logo {
            max-height: 30px !important;
          }

          .responsive-button {
            font-size: 9px !important;
            height: 28px !important;
          }

          .responsive-table {
            font-size: 8px !important;
            min-width: 400px;
          }

          .responsive-table .ant-table-thead > tr > th {
            font-size: 8px !important;
            padding: 1px !important;
          }

          .responsive-table .ant-table-tbody > tr > td {
            font-size: 8px !important;
            padding: 1px !important;
          }

          .responsive-totals-table {
            font-size: 9px !important;
          }

          .responsive-remarks {
            font-size: 9px !important;
          }
        }

        /* Landscape orientation for mobile */
        @media (max-width: 768px) and (orientation: landscape) {
          .responsive-header {
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
          }

          .responsive-title {
            font-size: 14px !important;
            margin-bottom: 0 !important;
          }

          .responsive-logo {
            max-height: 35px !important;
          }

          .responsive-button-group {
            flex-direction: row !important;
            flex-wrap: wrap !important;
            justify-content: flex-end !important;
          }

          .responsive-button {
            width: auto !important;
            min-width: 80px !important;
            margin-right: 4px !important;
          }
        }

        /* Print styles remain unchanged */
        @media print {
          .responsive-button-group {
            display: none !important;
          }
          
          .responsive-comment-section {
            display: none !important;
          }
        }
      `}</style>
    </Card>
  );
};

export default PurchaseInvoiceDetail;