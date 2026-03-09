import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Dropdown, Menu, Table, Tabs, Input, ConfigProvider, Typography, Space } from 'antd';
import { PrinterOutlined, EditOutlined, SendOutlined, PlusOutlined } from '@ant-design/icons';
import LogoJaja from '../../../assets/LogoJaja.png';
import JajaAuto from '../../../assets/JajaAuto.png';
import { baseUrl } from '@/configs';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Title } = Typography;

const PurchaseOrderDetail = () => {
  const { id_purchase_order } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('1');
  const [purchaseData, setPurchaseData] = useState(null);
  const [pengajuanData, setPengajuanData] = useState(null);
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to calculate total_product
  const calculateTotalProduct = (rate, quantity, discount, taxable, ppn) => {
    const subtotal = (parseFloat(rate) || 0) * (parseFloat(quantity) || 0);
    const discountAmount = subtotal * ((parseFloat(discount) || 0) / 100);
    const totalAfterDiscount = subtotal - discountAmount;
    const ppnAmount = taxable ? totalAfterDiscount * ((parseFloat(ppn) || 0) / 100) : 0;
    return totalAfterDiscount + ppnAmount;
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
    const fetchData = async () => {
      if (!id_purchase_order) {
        console.error('id_purchase_order tidak ditemukan!');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token tidak ditemukan. Silakan login terlebih dahulu.');
        }

        // Fetch Products
        const productResponse = await fetch(
          `${baseUrl}/nimda/master_product?limit=500000`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `${token}`,
            },
          }
        );
        const productResult = await productResponse.json();
        if (productResult.code === 200) {
          const transformedProducts = productResult.data.map(product => ({
            product_id: product.id,
            product_name: product.name,
            ...product
          }));
          setProductList(transformedProducts);
        } else {
          console.error('Product API Error:', productResult);
        }

        // Fetch Purchase Order
        const purchaseResponse = await fetch(
          `${baseUrl}/nimda/purchase/${id_purchase_order}?t=${Date.now()}`,
          {
            headers: {
              Authorization: `${token}`,
            },
          }
        );

        if (!purchaseResponse.ok) {
          throw new Error(`HTTP error! status: ${purchaseResponse.status}`);
        }

        const purchaseResult = await purchaseResponse.json();

        // Fetch Pengajuan
        const idPengajuan = purchaseResult.data.id_pengajuan;
        let updatedPurchaseData = purchaseResult.data;

        if (idPengajuan) {
          const pengajuanResponse = await fetch(
            `${baseUrl}/nimda/pengajuan/${idPengajuan}?t=${Date.now()}`,
            {
              headers: {
                Authorization: `${token}`,
              },
            }
          );

          if (!pengajuanResponse.ok) {
            throw new Error(`HTTP error fetching pengajuan! status: ${pengajuanResponse.status}`);
          }

          const pengajuanResult = await pengajuanResponse.json();
          setPengajuanData(pengajuanResult.data);

          // Update purchase order details with product names and calculated totals
          updatedPurchaseData = {
            ...purchaseResult.data,
            purchase_order_details: purchaseResult.data.purchase_order_details.map(detail => {
              const pengajuanItem = pengajuanResult.data.tb_pengajuan_vendors[
                pengajuanResult.data.selected
              ]?.tb_pengajuan_pilihans.find(p => p.product_id === detail.product_id);
              const product = productResult.code === 200 ? productResult.data.find(p => p.id === detail.product_id) : null;
              const taxable = pengajuanItem ? pengajuanItem.taxable : detail.taxable ?? false;
              const ppn = pengajuanItem ? parseFloat(pengajuanItem.ppn) : parseFloat(detail.ppn ?? 0);
              const total_product = parseFloat(detail.total_product) || calculateTotalProduct(
                detail.rate,
                detail.quantity,
                detail.discount,
                taxable,
                ppn
              );
              return {
                ...detail,
                product_name: product ? product.name : detail.product_name || `ID ${detail.product_id} tidak ditemukan`,
                taxable,
                ppn,
                total_product,
              };
            }),
          };
        }

        console.log('Updated Purchase Details:', updatedPurchaseData.purchase_order_details);
        setPurchaseData(updatedPurchaseData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [id_purchase_order]);

  const formatNumber = (num, isQty = false) => {
    if (isQty) {
      return parseInt(num).toLocaleString('id-ID');
    }
    return parseFloat(num).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePrintOption = (option, type) => {
    if (!purchaseData || !pengajuanData) return;

    const printWindow = window.open('', '_blank');

    const selectedVendor = pengajuanData.tb_pengajuan_vendors[pengajuanData.selected];
    const items = purchaseData?.purchase_order_details?.map((detail, index) => {
      return {
        no: index + 1,
        namaBarang: detail.product_name || 'N/A',
        satuan: 'Unit',
        qty: parseFloat(detail.quantity) || 0,
        harga: parseFloat(detail.rate) || 0,
        disc: `${parseFloat(detail.discount) || 0}%`,
        total: parseFloat(detail.total_product) || 0,
      };
    }) || [];

    const total = items.reduce((acc, item) => acc + item.total, 0);
    const shippingPrice = purchaseData?.shipping_price || 0;
    const grandTotal = total + shippingPrice;

    const allocation = purchaseData?.warehouse_name?.toLowerCase();
    const logoSrc = allocation === 'auto' ? JajaAuto : LogoJaja;

    const logoHTML = `
      <div class="logo">
        <img src="${logoSrc}" alt="Logo Jaja" style="max-height: 70px; width: auto;">
      </div>
    `;

    // Define signature section based on print type
    let signatureHTML = '';
    if (type === 'printpo_bulat') {
      // Include TTD for yazid and Anggi
      signatureHTML = `
        <div class="signature-section" style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 11px;">
          <div class="signature-box" style="text-align: center; width: 45%;">
            <p style="margin: 0; font-weight: 500;">Diperiksa oleh:</p>
            <br/>
            <br/>
            <br/>
            <br/>
            <div style="border-bottom: 2px solid #1e40af; width: 180px; margin: 15px auto 10px;"></div>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">Muhammad Beyazid Yeldrim Alhaziva</p>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">PARTNERSHIP</p>
          </div>
          <div class="signature-box" style="text-align: center; width: 45%;">
            <p style="margin: 0; font-weight: 500;">Diperiksa oleh:</p>
                        <br/>
            <br/>
            <br/>
            <br/>
            <div style="border-bottom: 2px solid #1e40af; width: 180px; margin: 15px auto 10px;"></div>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">Eviyana Nuraini</p>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">KOOR. LEGALITAS EUREKA GROUP</p>
          </div>
        </div>
      `;
    } else if (type === 'kacab') {
      // Include TTD for Muhammad Beyazid Yeldrim Alhaziva, Anggi, and Adriansyah
      signatureHTML = `
        <div class="signature-section" style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 11px;">
          <div class="signature-box" style="text-align: center; width: 30%;">
            <p style="margin: 0; font-weight: 500;">Diperiksa oleh:</p>
                        <br/>
            <br/>
            <br/>
            <br/>
            <div style="border-bottom: 2px solid #1e40af; width: 180px; margin: 15px auto 10px;"></div>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">Muhammad Beyazid Yeldrim Alhaziva</p>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">PARTNERSHIP</p>
          </div>
          <div class="signature-box" style="text-align: center; width: 30%;">
            <p style="margin: 0; font-weight: 500;">Diperiksa oleh:</p>
                        <br/>
            <br/>
            <br/>
            <br/>
            <div style="border-bottom: 2px solid #1e40af; width: 180px; margin: 15px auto 10px;"></div>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">Eviyana Nuraini</p>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">KOOR. LEGALITAS EUREKA GROUP</p>
          </div>
          <div class="signature-box" style="text-align: center; width: 30%;">
            <p style="margin: 0; font-weight: 500;">Diperiksa oleh:</p>
                        <br/>
            <br/>
            <br/>
            <br/>
            <div style="border-bottom: 2px solid #1e40af; width: 180px; margin: 15px auto 10px;"></div>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">Adriansyah</p>
          </div>
        </div>
      `;
    } else if (type === 'BA') {
      // Include TTD for Muhammad Beyazid Yeldrim Alhaziva, Anggi, Adriansyah, and Willy (last)
      signatureHTML = `
        <div class="signature-section" style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 11px;">
          <div class="signature-box" style="text-align: center; width: 22%;">
            <p style="margin: 0; font-weight: 500;">Diperiksa oleh:</p>
                        <br/>
            <br/>
            <br/>
            <br/>
            <div style="border-bottom: 2px solid #1e40af; width: 180px; margin: 15px auto 10px;"></div>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">Muhammad Beyazid Yeldrim Alhaziva</p>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">PARTNERSHIP</p>
          </div>
          <div class="signature-box" style="text-align: center; width: 22%;">
            <p style="margin: 0; font-weight: 500;">Diperiksa oleh:</p>
                        <br/>
            <br/>
            <br/>
            <br/>
            <div style="border-bottom: 2px solid #1e40af; width: 180px; margin: 15px auto 10px;"></div>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">Eviyana Nuraini</p>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">KOOR. LEGALITAS EUREKA GROUP</p>
          </div>
          <div class="signature-box" style="text-align: center; width: 22%;">
            <p style="margin: 0; font-weight: 500;">Disetujui oleh:</p>
                        <br/>
            <br/>
            <br/>
            <br/>
            <div style="border-bottom: 2px solid #1e40af; width: 180px; margin: 15px auto 10px;"></div>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">Adriansyah</p>
          </div>
          <div class="signature-box" style="text-align: center; width: 22%;">
            <p style="margin: 0; font-weight: 500;">Disetujui Oleh</p>
                        <br/>
            <br/>
            <br/>
            <br/>
            <div style="border-bottom: 2px solid #1e40af; width: 180px; margin: 15px auto 10px;"></div>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">Willianoes S</p>
          </div>
        </div>
      `;
    } else if (type === 'printpo_nobulat' || type === 'no_ttd' || type === 'ba_noTTD') {
      // No signature section for these options
      signatureHTML = '';
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Order - ${purchaseData?.transaction_no || 'N/A'}</title>
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
            .title { 
              font-size: 18px; 
              font-weight: 700; 
              color: #1e40af;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .logo {
              display: flex;
              align-items: center;
            }
            .company-info { 
              text-align: right; 
              font-size: 11px;
              line-height: 1.5;
              color: #555;
            }
            hr { 
              border: none;
              height: 3px;
              background: linear-gradient(to right, #2563eb, #dc2626);
              margin-bottom: 15px; 
              border-radius: 2px;
            }
            .info { 
              display: flex; 
              margin-bottom: 15px; 
              font-size: 11px;
              background-color: #f1f5f9;
              border-radius: 6px;
              padding: 12px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            .info-left, .info-right { 
              width: 50%; 
            }
            .info-right div, .info-left div {
              margin-bottom: 4px;
            }
            .delivery { 
              margin-bottom: 15px; 
              font-size: 11px;
              background-color: #fff;
              border-left: 3px solid #3b82f6;
              padding: 8px 12px;
              border-radius: 0 4px 4px 0;
              box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            }
            .delivery p {
              margin: 5px 0;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 15px; 
              font-size: 11px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              border-radius: 6px;
              overflow: hidden;
            }
            th, td { 
              border: 1px solid #e2e8f0; 
              padding: 8px; 
              text-align: center; 
            }
            th { 
              background-color: #1e40af; 
              color: white;
              font-weight: 500;
              font-size: 11px;
            }
            tr:nth-child(even) {
              background-color: #f1f5f9;
            }
            tr:hover {
              background-color: #e2e8f0;
            }
            .summary { 
              display: flex; 
              margin-bottom: 15px; 
              font-size: 11px;
            }
            .summary-left { 
              width: 66%;
              padding: 10px;
              background-color: #f1f5f9;
              border-radius: 6px;
              font-style: italic;
              color: #475569;
            }
            .summary-right { 
              width: 34%;
              padding-left: 15px;
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
            .signature-box p {
              margin: 5px 0;
            }
            .summary-right table { 
              width: 100%;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.08);
            }
            .summary-right table tr:last-child {
              background-color: #dbeafe;
              font-weight: bold;
              color: #1e40af;
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
              .info, .delivery, .summary-left {
                background-color: #f1f5f9 !important;
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
                background-color: #f1f5f9 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .summary-right table tr:last-child {
                background-color: #dbeafe !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">PURCHASE ORDER</div>
            <div class="logo">${logoHTML}</div>
          </div>
          <hr />
          <div class="company-info">
            JL. H. BAPING RAYA NO. 100,<br>
            CIRACAS PASAR REBO, JAKARTA 13740<br>
            TELP (021) 87796010 FAX (021) 87790903<br>
            JAJAID@gmail.com
          </div>
          <div class="info">
            <div class="info-left">
              <div><strong>Nomor PO:</strong> ${purchaseData?.transaction_no || 'N/A'}</div>
              <div><strong>Tanggal PO:</strong> ${purchaseData?.transaction_date || 'N/A'}</div>
              <div><strong>Email:</strong> ${purchaseData?.email || 'N/A'}</div>
              <div><strong>T.O.P:</strong> ${purchaseData?.term_name || 'N/A'}</div>
              <div><strong>Gudang:</strong> ${purchaseData?.warehouse_name || 'N/A'}</div>
            </div>
            <div class="info-right">
              <div><strong>Dari:</strong></div>
              <div><strong>${purchaseData?.person_name || 'N/A'}</strong></div>
              <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
                <div><strong>Kepada Yth.</strong></div>
                <div><strong>PT. Jaja Indonesia</strong></div>
                <div>JL. H. BAPING RAYA NO. 100,<br/>CIRACAS PASAR REBO, JAKARTA 13740<br/>TELP (021) 87796010 FAX (021) 87790903<br/>JAJAID@gmail.com</div>
                <div style="margin-top: 6px;">
                  <div><strong>Tanggal Kirim:</strong> ${purchaseData?.shipping_date || '-'}</div>
                  <div><strong>Tanggal Kadaluarsa:</strong> ${purchaseData?.due_date || '-'}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="delivery">
            <p>Dengan Hormat,</p>
            <p>Bersama ini kami sampaikan order pembelian untuk dikirimkan ke:</p>
            <p style="font-weight: bold; color: #1e40af;">${purchaseData?.address || 'N/A'}</p>
            ${purchaseData?.tags ? `<div style="margin-top: 10px; padding: 8px; background-color: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 0 4px 4px 0;"><strong>Keterangan:</strong> ${purchaseData.tags}</div>` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Barang</th>
                <th>Satuan</th>
                <th>Qty</th>
                <th>Harga @</th>
                <th>Disc</th>
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
                  <td>${item.satuan}</td>
                  <td style="text-align: center;">${formatNumber(item.qty, true)}</td>
                  <td style="text-align: center;">${formatNumber(item.harga)}</td>
                  <td style="text-align: center;">${item.disc}</td>
                  <td style="text-align: center;">${formatNumber(item.total)}</td>
                </tr>
              `
        )
        .join('')}
            </tbody>
          </table>
          <div class="summary">
            <div class="summary-left">
              <div><span style="font-weight: bold;">Terbilang:</span> ${numberToText(Math.floor(grandTotal))}</div>
              <div>${purchaseData?.tags || 'Mohon dikirim segera..'}</div>
            </div>
            <div class="summary-right">
              <table>
                <tbody>
                  <tr>
                    <td style="font-weight: bold;">Grand Total</td>
                    <td style="text-align: right;">${formatNumber(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
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
      <Menu.Item key="1" onClick={() => handlePrintOption('Cetak Total Pembuatan', 'printpo_bulat')}>
        Cetak Total Pembulatan
      </Menu.Item>
      <Menu.Item key="2" onClick={() => handlePrintOption('Cetak Total Pembuatan No TTD', 'printpo_nobulat')}>
        Cetak Total Pembuatan No TTD
      </Menu.Item>
      <Menu.Item key="3" onClick={() => handlePrintOption('Cetak tanpa TTD', 'no_ttd')}>
        Cetak tanpa TTD
      </Menu.Item>
      <Menu.Item key="4" onClick={() => handlePrintOption('Cetak hingga Kacab', 'kacab')}>
        Cetak hingga Kacab
      </Menu.Item>
      <Menu.Item key="5" onClick={() => handlePrintOption('Cetak hingga BA', 'BA')}>
        Cetak hingga BA
      </Menu.Item>
      <Menu.Item key="6" onClick={() => handlePrintOption('Cetak hingga BA No TTD', 'ba_noTTD')}>
        Cetak hingga BA No TTD
      </Menu.Item>
    </Menu>
  );

  const columns = [
    {
      title: 'No',
      dataIndex: 'no',
      key: 'no',
      width: 60,
      align: 'center',
      render: (text) => <span className="text-sm font-medium">{text}</span>
    },
    {
      title: 'Nama Barang',
      dataIndex: 'namaBarang',
      key: 'namaBarang',
      render: (text) => <span className="text-sm break-words">{text}</span>
    },
    {
      title: 'Qty',
      dataIndex: 'qty',
      key: 'qty',
      width: 80,
      align: 'right',
      render: (text) => <span className="text-sm">{text}</span>
    },
    {
      title: 'Satuan',
      dataIndex: 'satuan',
      key: 'satuan',
      width: 80,
      align: 'center',
      render: (text) => <span className="text-sm">{text}</span>
    },
    {
      title: 'Harga @',
      dataIndex: 'harga',
      key: 'harga',
      width: 120,
      align: 'right',
      render: (text) => <span className="text-sm">{text}</span>
    },
    {
      title: 'Disc',
      dataIndex: 'disc',
      key: 'disc',
      width: 80,
      align: 'center',
      render: (text) => <span className="text-sm">{text}</span>
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 120,
      align: 'right',
      render: (text) => <span className="text-sm font-semibold">{text}</span>
    },
  ];

  const data = purchaseData?.purchase_order_details?.map((detail, index) => {
    return {
      key: `${index + 1}`,
      no: `${index + 1}`,
      namaBarang: detail.product_name || 'N/A',
      satuan: 'Unit',
      qty: formatNumber(parseFloat(detail.quantity) || 0, true),
      harga: formatNumber(parseFloat(detail.rate) || 0),
      disc: `${parseFloat(detail.discount) || 0}%`,
      total: formatNumber(parseFloat(detail.total_product) || 0),
    };
  }) || [];

  const commentColumns = [
    {
      title: 'Tanggal',
      dataIndex: 'tanggal',
      key: 'tanggal',
      width: 100,
      render: (text) => <span className="text-sm">{text}</span>
    },
    {
      title: 'Nama',
      dataIndex: 'nama',
      key: 'nama',
      width: 120,
      render: (text) => <span className="text-sm break-words">{text}</span>
    },
    {
      title: 'Komentar',
      dataIndex: 'komentar',
      key: 'komentar',
      render: (text) => <span className="text-sm break-words">{text}</span>
    },
    {
      title: 'Hapus',
      key: 'hapus',
      width: 80,
      render: () => (
        <Button type="text" danger size="small" className="text-xs">
          <span className="hidden sm:inline">Delete</span>
          <span className="sm:hidden">Del</span>
        </Button>
      ),
    },
  ];

  const commentData = [];

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!purchaseData) {
    return <div>Error: Data tidak ditemukan</div>;
  }

  const total = purchaseData?.purchase_order_details?.reduce((acc, item) => acc + parseFloat(item.total_product) || 0, 0) || 0;
  const shippingPrice = parseFloat(purchaseData.shipping_price) || 0;
  const grandTotal = total + shippingPrice;

  const allocation = purchaseData?.warehouse_name?.toLowerCase();
  const logoSrc = allocation === 'auto' ? JajaAuto : LogoJaja;

  return (
    <ConfigProvider>
      <div className="px-2 sm:px-4 lg:px-6" style={{ minHeight: '100vh' }}>
        <div className="w-full" style={{ backgroundColor: 'white', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
          {/* Header Section - Responsive */}
          <div className="flex justify-between items-center mb-6 flex-wrap">
            <Title level={3} className="m-0" style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
              PURCHASE ORDER
            </Title>
            <Space direction="horizontal" className="w-full sm:w-auto mt-4 sm:mt-0" wrap>
              <Dropdown overlay={menu} placement="bottomLeft">
                <Button type="primary" ghost icon={<PrinterOutlined />}>
                  Opsi Cetak
                </Button>
              </Dropdown>
              <Button
                type="primary"
                icon={<EditOutlined />}
                style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                onClick={() => navigate(`/dashboard/purchase/order/edit/${id_purchase_order}`)}
              >
                Edit
              </Button>
              <Button
                type="default"
                icon={<SendOutlined />}
                onClick={() => navigate(`/dashboard/notes/create-notes/${id_purchase_order}`)}
              >
                Tambah Receive Note
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
                onClick={() => navigate(`/dashboard/purchaseinvoice/add/${id_purchase_order}`)}
              >
                Purchase Invoice
              </Button>
            </Space>
          </div>

          {/* <div className="border-b border-gray-200 pb-2 mb-4" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '16px' }}>
            <div className="flex flex-col sm:flex-row sm:items-center">
            </div>
          </div> */}



          {/* Info Grid - Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Left Column - Purchase Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <div className="text-sm font-medium text-gray-600 w-20 sm:w-24">Nomor PO:</div>
                  <div className="text-sm font-semibold break-all">{purchaseData.transaction_no || '-'}</div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <div className="text-sm font-medium text-gray-600 w-20 sm:w-24">Tanggal PO:</div>
                  <div className="text-sm">{purchaseData.transaction_date || '-'}</div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <div className="text-sm font-medium text-gray-600 w-20 sm:w-24">Email:</div>
                  <div className="text-sm break-all">{purchaseData.email || '-'}</div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <div className="text-sm font-medium text-gray-600 w-20 sm:w-24">TOP:</div>
                  <div className="text-sm">{purchaseData.term_name || '-'}</div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <div className="text-sm font-medium text-gray-600 w-20 sm:w-24">Gudang:</div>
                  <div className="text-sm">{purchaseData.warehouse_name || '-'}</div>
                </div>
              </div>
            </div>

            {/* Right Column - Vendor and Company Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-600">Dari:</div>
                <div className="text-sm font-semibold text-gray-800">{purchaseData.person_name || '-'}</div>
                <div className="mt-3 pt-2 border-t border-blue-200">
                  <div className="text-sm font-medium text-gray-600">Kepada Yth.</div>
                  <div className="text-sm font-semibold text-gray-800">PT. Jaja Indonesia</div>
                  <div className="text-sm text-gray-600 break-words">
                    JL. H. BAPING RAYA NO. 100,<br />
                    CIRACAS PASAR REBO, JAKARTA 13740<br />
                    TELP (021) 87796010 FAX (021) 87790903<br />
                    JAJAID@gmail.com
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tags Section */}
          {purchaseData.tags && (
            <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
              <div className="text-sm font-medium text-gray-700 mb-1">Keterangan:</div>
              <div className="text-sm text-gray-600 break-words">{purchaseData.tags}</div>
            </div>
          )}

          {/* <div className="mb-4" style={{ marginBottom: '16px' }}>
            <p>Dengan Hormat,</p>
            <p>Bersama ini kami sampaikan order pembelian untuk dikirimkan ke:</p>
            <p className="font-medium" style={{ fontWeight: '500' }}>{purchaseData.address || '-'}</p>
          </div> */}

          {/* Products Table - Responsive */}
          <div className="mb-4 overflow-x-auto">
            <div className="min-w-full">
              <Table
                columns={columns}
                dataSource={data}
                bordered
                pagination={false}
                size="small"
                scroll={{ x: 800 }}
                className="responsive-table"
                components={{
                  header: {
                    cell: (props) => (
                      <th
                        {...props}
                        style={{
                          backgroundColor: '#f0f2f5',
                          textAlign: 'center',
                          fontWeight: '600',
                          fontSize: '12px',
                          padding: '8px 4px'
                        }}
                      />
                    ),
                  },
                }}
              />
            </div>
          </div>

          {/* Summary Section - Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2">
              {/* <div className="flex flex-col sm:flex-row mb-2" style={{ display: 'flex', marginBottom: '8px' }}>
                <div className="font-medium" style={{ fontWeight: '500' }}>Terbilang:</div>
                <div className="ml-0 sm:ml-2" style={{ marginLeft: '8px' }}>{numberToText(Math.floor(grandTotal))}</div>
              </div> */}
              {/* <div>{purchaseData.tags || 'Mohon dikirim segera..'}</div> */}
            </div>
            <div className="w-full">
              <div className="bg-gray-50 p-4 rounded-lg">
                <Table
                  columns={[
                    { title: 'Item', dataIndex: 'item', key: 'item', width: '50%' },
                    { title: 'Nilai', dataIndex: 'nilai', key: 'nilai', align: 'right' },
                  ]}
                  dataSource={[
                    { key: '5', item: 'Grand Total', nilai: formatNumber(grandTotal) },
                  ]}
                  bordered
                  pagination={false}
                  size="small"
                  showHeader={false}
                  className="summary-table"
                />
              </div>
            </div>
          </div>

          {/* Tabs Section - Responsive */}
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className="responsive-tabs"
            tabBarStyle={{
              fontSize: '14px',
              marginBottom: '16px'
            }}
          >
            <TabPane tab="Komentar" key="1">
              {/* Comment Form - Responsive */}
              <div className="mb-4 space-y-3">
                <TextArea
                  rows={3}
                  placeholder="Tuliskan komentar anda disini..."
                  className="w-full text-sm"
                />
                <div className="flex justify-end">
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                    className="w-full sm:w-auto text-sm"
                  >
                    <span className="hidden sm:inline">SUBMIT KOMENTAR</span>
                    <span className="sm:hidden">SUBMIT</span>
                  </Button>
                </div>
              </div>

              {/* Comments Table - Responsive */}
              <div className="overflow-x-auto mb-6">
                <Table
                  columns={commentColumns}
                  dataSource={commentData}
                  bordered
                  pagination={false}
                  size="small"
                  scroll={{ x: 600 }}
                  className="responsive-table"
                />
              </div>

              {/* Receive Notes Section - Responsive */}
              <div className="mt-6">
                <h3 className="text-base sm:text-lg font-medium mb-3">
                  Receive Notes
                </h3>
                <div className="overflow-x-auto">
                  <Table
                    columns={[
                      {
                        title: 'Receive Note No',
                        dataIndex: 'receive_note_no',
                        key: 'receive_note_no',
                        width: 150,
                        render: (text, record) => (
                          <a
                            onClick={() => navigate(`/dashboard/notes/detail-order/${record.id_receive_note}`)}
                            style={{ color: '#1e40af', cursor: 'pointer' }}
                            className="text-sm break-all"
                          >
                            {text}
                          </a>
                        ),
                      },
                      {
                        title: 'Date',
                        dataIndex: 'receive_note_date',
                        key: 'receive_note_date',
                        width: 120,
                        render: (text) => <span className="text-sm">{text}</span>
                      },
                      {
                        title: 'Name',
                        dataIndex: 'person_name',
                        key: 'person_name',
                        width: 150,
                        render: (text) => <span className="text-sm">{text}</span>
                      },
                      {
                        title: 'Remarks',
                        dataIndex: 'remarks',
                        key: 'remarks',
                        render: (text) => <span className="text-sm break-words">{text}</span>
                      },
                    ]}
                    dataSource={purchaseData?.tb_receive_notes?.map((note) => ({
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
                    scroll={{ x: 800 }}
                    className="responsive-table"
                  />
                </div>
              </div>
            </TabPane>
            <TabPane tab="Lampiran" key="2">
              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                <p className="text-sm">Lampiran dokumen akan ditampilkan di sini</p>
              </div>
            </TabPane>
          </Tabs>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default PurchaseOrderDetail;