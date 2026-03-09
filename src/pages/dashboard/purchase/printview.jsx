import React from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircleFilled } from '@ant-design/icons';
// import LogoJaja from '../../../assets/LogoJaja.png';
// import JajaAuto from '../../../assets/JajaAuto.png';

const PrintPOView = () => {
  const { type } = useParams();
  
  const orderData = {
    nomorPO: 'PC/2025020207/PO',
    nomorDPP: 'PC-JKT/2025020004/SOI',
    nomorPP: 'PC/2025020314/PP',
    nomorPPLain: 'PC/2025020315/PP',
    tanggalPO: '10 Feb 2025',
    supplier: {
      name: 'PT SUMA ALPHA INDONESIA',
      contact: 'Ibu Dina',
      address: 'Jl. Raya Poncol No. 11 RT 001 RW 007, Kelurahan Susukan, Kec. Ciracas, Kota Adm. Jakarta Timur, 13750 Indonesia'
    },
    deliveryAddress: 'JL. H. Baping Raya No. 100 Ciracas, Jakarta Timur 13740',
    payment: {
      npwp: '-',
      top: 'Kredit 30 Hari',
      tanggalKirim: '10 Feb 2025',
      tanggalKadaluarsa: '10 Mar 2025'
    },
    items: [
      {
        no: 1,
        namaBarang: 'Kertas Fotocopy Uk. A4 75 gr - untuk kebutuhan Purch, Legal, dan MD GT',
        satuan: 'Rim',
        qty: 20.00,
        harga: 61000,
        disc: '10%',
        total: 1098000
      }
    ],
    summary: {
      subtotal: 1098000,
      ppn: 0,
      pph: 0,
      biayaLain: 0,
      grandTotal: 1098000
    },
    terbilang: 'Satu Juta Sembilan Puluh Delapan Ribu Rupiah',
    note: 'Mohon dikirim segera..',
    approvals: [
      { name: 'Ferdy Ardiansyah S', position: 'Staff Purchasing', date: '10-02-2025 14:32:37' },
      { name: 'M. Rahadian Rasyad', position: 'Koord Purchasing', date: '12-02-2025 16:05:03' },
      { name: 'Vitri Yeni', position: 'KA Dept Partnership', date: '10-02-2025 17:31:19' },
      { name: 'Ernanto Triatmojo', position: 'ASM Akt', date: '13-02-2025 17:26:13' },
      { name: 'Adriansyah', position: 'Kepala Cabang', date: '14-02-2025 15:37:48' }
    ],
    colorCodes: [
      { code: "1", description: "Akunting - Putih" },
      { code: "2", description: "Pengadaan - Merah" },
      { code: "3", description: "Gudang - Biru" },
      { code: "4", description: "Supplier - Hijau" },
    ]
  };

  // Determine which logo to use based on allocation
  // For this example, we'll default to 'jajaid'
  const allocation = 'jajaid';
  
  let logoSrc, logoAlt, logoWidth, logoHeight;
  if (allocation.includes('jajaid')) {
    logoSrc = LogoJaja;
    logoAlt = 'JAJAID Logo';
    logoWidth = '170px';
    logoHeight = '120px';
  } else if (allocation.includes('auto')) {
    logoSrc = JajaAuto;
    logoAlt = 'Jaja Auto Logo';
    logoWidth = '220px';
    logoHeight = '120px';
  } else {
    logoSrc = LogoJaja;
    logoAlt = 'JAJAID Logo';
    logoWidth = '100px';
    logoHeight = '50px';
  }

  const getVisibleApprovals = () => {
    switch(type) {
      case 'no_ttd':
      case 'printpo_nobulat':
        return [];
      case 'kacab':
        return orderData.approvals.slice(0, 1);
      case 'BA':
        return orderData.approvals.slice(0, 4);
      case 'ba_noTTD':
        return [];
      default:
        return orderData.approvals;
    }
  };

  const visibleApprovals = getVisibleApprovals();

  React.useEffect(() => {
    setTimeout(() => {
      window.print();
    }, 500);
  }, []);

  return (
    <div className="p-4 print:p-2 bg-white max-w-4xl mx-auto shadow-md print:shadow-none">
      <div className="flex justify-between items-start mb-4 print:mb-2">
        <div className="flex items-center">
          <img 
            src={logoSrc} 
            alt={logoAlt} 
            style={{ 
              width: logoWidth, 
              height: logoHeight, 
              objectFit: 'contain' 
            }} 
          />
        </div>
        <div className="text-right text-xs bg-gray-50 p-2 rounded print:bg-transparent print:p-0">
          <div>JL. H. BAPING RAYA NO. 100,</div>
          <div>CIRACAS PASAR REBO, JAKARTA 13740</div>
          <div>TELP (021) 87796010 FAX (021) 87790903</div>
          <div>JAJAID@gmail.com</div>
        </div>
      </div>
      
      <hr className="border-b-2 border-blue-600 mb-3" />
      
      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold text-blue-700">PURCHASE ORDER</h2>
        <div className="text-sm text-gray-600">JAJA ID</div>
      </div>

      <div className="flex mb-3 text-sm">
        <div className="w-1/2 bg-gray-50 p-2 rounded-l border-l-4 border-blue-500 print:bg-transparent print:border-l-0">
          <div className="mb-1"><span className="font-semibold">Nomor PO:</span> {orderData.nomorPO}</div>
          <div className="mb-1"><span className="font-semibold">Nomor DPP:</span> {orderData.nomorDPP}</div>
          <div className="mb-1"><span className="font-semibold">Nomor PP:</span> {orderData.nomorPP}</div>
          <div className="mb-1"><span className="font-semibold"></span> {orderData.nomorPPLain}</div>
          <div><span className="font-semibold">Tanggal PO:</span> {orderData.tanggalPO}</div>
        </div>
        <div className="w-1/2 bg-gray-50 p-2 rounded-r print:bg-transparent">
          <div className="font-semibold mb-1">Kepada Yth.</div>
          <div className="font-bold text-blue-700">{orderData.supplier.name}</div>
          <div>UP: {orderData.supplier.contact}</div>
          <div className="text-xs">{orderData.supplier.address}</div>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div><span className="font-semibold">NPWP:</span> {orderData.payment.npwp}</div>
            <div><span className="font-semibold">T.O.P:</span> {orderData.payment.top}</div>
            <div><span className="font-semibold">Tanggal Kirim:</span> {orderData.payment.tanggalKirim}</div>
            <div><span className="font-semibold">Tanggal Kadaluarsa:</span> {orderData.payment.tanggalKadaluarsa}</div>
          </div>
        </div>
      </div>

      <div className="mb-3 text-sm bg-gray-50 p-3 rounded print:bg-transparent print:p-0">
        <p>Dengan Hormat,</p>
        <p>Bersama ini kami sampaikan order pembelian untuk dikirimkan ke:</p>
        <p className="font-bold text-blue-700">{orderData.deliveryAddress}</p>
      </div>

      <div className="mb-4">
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-blue-50 print:bg-gray-100">
              <th className="py-2 px-3 border">No</th>
              <th className="py-2 px-3 border">Nama Barang</th>
              <th className="py-2 px-3 border">Satuan</th>
              <th className="py-2 px-3 border">Qty</th>
              <th className="py-2 px-3 border">Harga @</th>
              <th className="py-2 px-3 border">Disc</th>
              <th className="py-2 px-3 border">Total</th>
            </tr>
          </thead>
          <tbody>
            {orderData.items.map((item) => (
              <tr key={item.no} className="hover:bg-gray-50 print:hover:bg-transparent">
                <td className="py-2 px-3 border text-center">{item.no}</td>
                <td className="py-2 px-3 border">{item.namaBarang}</td>
                <td className="py-2 px-3 border text-center">{item.satuan}</td>
                <td className="py-2 px-3 border text-right">{item.qty.toFixed(2)}</td>
                <td className="py-2 px-3 border text-right">{item.harga.toLocaleString()}</td>
                <td className="py-2 px-3 border text-center">{item.disc}</td>
                <td className="py-2 px-3 border text-right font-semibold">{item.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex mb-4 text-sm">
        <div className="w-2/3 pr-4">
          <div className="mb-2"><span className="font-bold">Terbilang:</span> <span className="italic">{orderData.terbilang}</span></div>
          <div className="p-2 bg-gray-50 rounded border-l-4 border-yellow-400 print:bg-transparent print:border-l-0">
            <span className="font-semibold">Catatan:</span> {orderData.note}
          </div>
        </div>
        <div className="w-1/3">
          <table className="w-full border">
            <tbody>
              <tr className="bg-gray-50 print:bg-transparent">
                <td className="py-2 px-3 border">Subtotal</td>
                <td className="py-2 px-3 border text-right">{orderData.summary.subtotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 border">Ppn</td>
                <td className="py-2 px-3 border text-right">{orderData.summary.ppn ? `${orderData.summary.ppn}%` : '-'}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 border">Pph</td>
                <td className="py-2 px-3 border text-right">{orderData.summary.pph ? `${orderData.summary.pph}%` : '-'}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 border">Biaya Lain-lain</td>
                <td className="py-2 px-3 border text-right">{orderData.summary.biayaLain ? orderData.summary.biayaLain.toLocaleString() : '0'}</td>
              </tr>
              <tr className="bg-blue-50 print:bg-gray-100">
                <td className="py-2 px-3 border font-bold">Grand Total</td>
                <td className="py-2 px-3 border text-right font-bold">{orderData.summary.grandTotal.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between mb-4 text-sm">
        {visibleApprovals.map((approval, index) => (
          <div key={index} className="text-center w-1/5 bg-gray-50 p-2 rounded print:bg-transparent print:p-0">
            <div className="text-gray-600">{index === 0 ? 'Dibuat,' : 'Disetujui oleh,'}</div>
            <div className="my-2">
              <div className="border-2 border-green-600 rounded-lg p-1 mx-auto w-20 h-20 flex flex-col items-center justify-center bg-white">
                <CheckCircleFilled className="text-2xl text-green-600" />
                <div className="text-green-600 font-bold text-xs mt-1">APPROVED</div>
              </div>
              <div className="text-xs mt-1 text-gray-500">{approval.date}</div>
            </div>
            <div className="font-bold text-blue-700">{approval.name}</div>
            <div className="text-gray-600">{approval.position}</div>
          </div>
        ))}
      </div>

      <div className="border-t-2 border-blue-600 pt-2 mt-2 text-sm">
        <div className="flex flex-wrap bg-gray-50 p-2 rounded print:bg-transparent print:p-0">
          {orderData.colorCodes.map((code, index) => (
            <div key={index} className="w-1/2 mb-1">
              <span className="font-semibold">{code.code}.</span> {code.description}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media print {
          body {
            font-size: 12px;
            line-height: 1.3;
          }
          @page {
            size: A4;
            margin: 0.75cm;
          }
          .w-1\\/5 {
            width: 19%;
            margin-right: 1%;
          }
          .text-sm {
            font-size: 12px;
          }
          .text-xs {
            font-size: 10px;
          }
          table {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintPOView;