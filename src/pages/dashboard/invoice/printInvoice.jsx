import React, { useRef, useEffect } from 'react';
import { Button } from 'antd';
import { useReactToPrint } from 'react-to-print';
import LogoJaja from  '../../../assets/LogoJaja.png';
import '../../../assets/css/invoice.css'

// Komponen Tampilan Print
const InvoicePrint = React.forwardRef((props, ref) => {
  return (
    <div ref={ref} style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }} className='body-print-invoice'>
        <div className='w-1/2 flex justify-start'>
            <img src={LogoJaja} alt="" className='w-48 h-24' />
        </div>
        <div style={{ display: 'flex', marginBottom: '20px' }}>
        <div style={{ width: '50%', textAlign: 'left' }}>
            <h2 className="text-xl font-semibold">PT. JAJA USAHA LAKU</h2>
            <p>
            Jl. H. Baping Raya No. 100, Ciracas Jakarta Timur, JAKARTA TIMUR, DKI JAKARTA
            <br />
            Telp: 0218779610 | Email: info@masterdiskon.com
            </p>
        </div>
        
        <div style={{ width: '50%', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <span style={{ fontWeight: 'bold', width: "50%"}}>Faktur1#</span>
            <span>: MDINV250100270</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <span style={{ fontWeight: 'bold', width: "50%"}}>Tanggal</span>
            <span>: 02/01/2025</span>
            </div>
        </div>
        </div>


        <div>
        <hr style={{ border: '2px solid black', marginBottom: '20px' }} />
        
        <table 
            width="100%" 
            border="1" 
            cellSpacing="8" 
            cellPadding="8" 
            style={{ marginBottom: '20px', borderCollapse: 'separate', borderSpacing: '8px' }}
        >
            <tbody>
            <tr>
                <td width="50%" style={{ border: '1px solid black', padding: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <span style={{ fontWeight: 'bold', width: '50%' }}>NAMA</span>
                    <span>: LILI SUMARNI</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <span style={{ fontWeight: 'bold', width: '50%' }}>ALAMAT</span>
                    <span>: </span>
                </div>
                </td>
                <td width="50%" style={{ border: '1px solid black', padding: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <span style={{ fontWeight: 'bold', width: '50%' }}>JATUH TEMPO</span>
                    <span>: 16-01-2025</span>
                </div>
                </td>
            </tr>
            </tbody>
        </table>
        </div>

        <table 
            width="100%" 
            cellSpacing="0" 
            cellPadding="8" 
            style={{ 
                marginBottom: '20px', 
                border: '1px solid black', 
                borderCollapse: 'collapse' 
            }}
            >
            <thead>
                <tr style={{ border: '1px solid black' }}>
                <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>NO.</th>
                <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>KETERANGAN</th>
                <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>QTY</th>
                <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>HARGA SATUAN (Rp)</th>
                <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>JUMLAH (Rp)</th>
                </tr>
            </thead>
            <tbody>
                <tr style={{ border: '1px solid black' }}>
                <td style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>1</td>
                <td style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>
                    Tour Luar Negeri
                    <br />
                    INCENTIVE TOUR VIETNAM 6D5N
                    <br />
                    TANGGAL: 10-15 JANUARI 2025
                    <br />
                    NAMA: ARKAN FATHAN FADLIANA
                    <br />
                    HARGA: Rp16.307.616
                </td>
                <td style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>1 Pax</td>
                <td style={{ border: '1px solid black', padding: '8px', textAlign: 'right' }}>16.291.502</td>
                <td style={{ border: '1px solid black', padding: '8px', textAlign: 'right' }}>16.291.502</td>
                </tr>
            </tbody>
            <tfoot>
                <tr style={{ border: '1px solid black' }}>
                    <td colSpan="2" style={{ padding: '8px', textAlign: 'left', border: '1px solid black', fontStyle: 'italic' }}>
                        TERBILANG: enam belas juta empat ratus delapan puluh tujuh ribu RUPIAH
                    </td>
                    <td colSpan="2" style={{ padding: '8px', textAlign: 'right', border: '1px solid black' }}>
                        Biaya Pengganti
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid black' }}>16.291.502</td>
                </tr>
                <tr style={{ border: '1px solid black' }}>
                    <td colSpan="2" style={{ padding: '8px' }}></td>
                    <td colSpan="2" style={{ padding: '8px', textAlign: 'right', border: '1px solid black' }} >
                        PPN 1.2%
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid black' }}>195.498</td>
                </tr>
                <tr style={{ border: '1px solid black' }}>
                    <td colSpan="2" style={{ padding: '8px' }}></td>
                    <td colSpan="2" style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', border: '1px solid black' }} >
                        TOTAL
                    </td>
                    <td style={{ fontWeight: 'bold', padding: '8px', textAlign: 'right', border: '1px solid black' }}>16.487.000</td>
                </tr>
                <tr style={{ border: '1px solid black' }}>
                    <td colSpan="2" style={{ padding: '8px' }}></td>
                    <td colSpan="2" style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', border: '1px solid black' }} >
                        Sisa Tagihan
                    </td>
                    <td style={{ fontWeight: 'bold', padding: '8px', textAlign: 'right', border: '1px solid black' }}>16.487.000</td>
                </tr>
            </tfoot>
            </table>

        <p style={{ marginTop: '20px' }}>
            Memo
            <br />
            PIC: LILI SUMARNI
        </p>

        <div style={{ display: 'flex', marginTop: '30px' }}>
        <div style={{ width: '70%', paddingRight: '10px' }}>
        <h4>DETAIL PEMBAYARAN</h4>
        <table 
            width="100%" 
            cellSpacing="0" 
            cellPadding="8" 
            style={{ 
            border: '1px solid black', 
            borderCollapse: 'collapse',
            justifyContent: 'flex-end',
            }}
        >
            <tbody>
            <tr>
                <td style={{ width: '30%', padding: '8px', fontWeight: 'bold' }}>NAMA BANK</td>
                <td style={{ padding: '8px' }}>: Bank Mandiri</td>
            </tr>
            <tr>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>CABANG BANK</td>
                <td style={{ padding: '8px' }}>: PP Pasar Rebo</td>
            </tr>
            <tr>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>NOMOR AKUN BANK</td>
                <td style={{ padding: '8px' }}>
                : 129-00-8050850-0 (Tempo pembayaran 2 minggu)
                </td>
            </tr>
            <tr>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>ATAS NAMA</td>
                <td style={{ padding: '8px' }}>
                : PT MASTER DISKON INTERNASIONAL
                </td>
            </tr>
            </tbody>
        </table>
        </div>


        <div style={{ width: '30%', paddingLeft: '10px', textAlign: 'center', alignContent:'end'}} >
            <div style={{ marginTop: '50px', marginBottom: '10px', borderTop: '1px solid black', width: '80%', marginLeft: 'auto', marginRight: 'auto' }}></div>
            <p className='font-semibold' style={{textDecoration:'underline'}}>Ernanto Triatmojo W.</p>
            <p className='text-sm'>Keuangan</p>
        </div>
        </div>

    </div>
  );
});

// Komponen Utama
const PrintInvoice = () => {
  const componentRef = useRef();

  // Fungsi untuk memunculkan preview print
  const handlePrint = () => {
    window.print();
  };

  // Memicu print saat komponen pertama kali dirender
  useEffect(() => {
    handlePrint();
  }, []);

  return (
    <div>
      <InvoicePrint ref={componentRef} />
    </div>
  );
};

export default PrintInvoice;
