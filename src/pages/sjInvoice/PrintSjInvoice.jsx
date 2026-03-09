import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { getAuthHeader } from '@/utils/getAuthHeader';
import LogoJaja from '../../assets/LogoJaja.png';
import { baseUrl } from '@/configs';

const PrintSjInvoice = () => {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      const authHeader = getAuthHeader();
      const res = await fetch(`${baseUrl}/nimda/sj-invoice/${id}`, {
        headers: {
          Accept: 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
      });

      const result = await res.json();
      if (result.success) {
        setDetail(result.data);

        // Delay for rendering before print dialog
        setTimeout(() => {
          document.title = 'SJ Invoice ' + result.data.no_sj;
          window.print();
        }, 1000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!detail) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-lg font-medium text-gray-500 animate-pulse">Memuat Transaksi...</div>
    </div>
  );

  const firstInvoice = detail.sj_invoice_details?.[0]?.invoice || {};

  return (
    <div className="bg-white text-black min-h-screen font-sans p-0 m-0">
      {/* Container A4 */}
      <div className="w-[210mm] min-h-[297mm] mx-auto p-8 relative print:shadow-none print:w-full">

        {/* Header Section */}
        <div className="flex justify-between items-start mb-2">
          {/* Logo and Address */}
          <div className="flex flex-col space-y-2">
            <img src={LogoJaja} alt="Logo" className="w-40 object-contain" />
            <div className="text-[10px] leading-tight text-gray-700 max-w-sm mt-1">
              <p className="font-semibold">JL. RAYA H. BAPING NO. 100 RT. 008 RW. 009, KEL. CIRACAS, KEC. CIRACAS, KOTA JAKARTA TIMUR, PROV. DKI JAKARTA, JAKARTA TIMUR, DKI JAKARTA</p>
              <p>Telp: +6281291541250 </p>
              <p>Website: <span >https://jaja.id/</span></p>
            </div>
          </div>

          {/* Title and Website */}
          <div className="text-right w-1/4">
            <h1 className="text-5xl font-extrabold text-gray-200 tracking-wider mb-2 select-none uppercase">SURAT JALAN</h1>

          </div>
        </div>

        {/* Dotted Divider */}
        <div className="border-t border-gray-300 border-dotted w-full my-4"></div>

        {/* Shipping & Doc Info Section */}
        <div className="grid grid-cols-12 gap-6 mb-4 mt-2">
          {/* Alamat Pengiriman */}
          <div className="col-span-7">
            <div className="bg-gray-400 text-white font-bold text-[11px] px-3 py-1.5 inline-block w-full mb-2 tracking-wide">
              ALAMAT PENGIRIMAN
            </div>
            <div className="text-[11px] leading-relaxed pt-1 space-y-0.5">
              <p className="font-bold text-[12px] uppercase">{detail.company_name}</p>
              <p className="uppercase">{firstInvoice.shipping_address || firstInvoice.person_address}</p>
              <p className="font-semibold uppercase mt-1">Tel: {firstInvoice.person_phone || '-'}</p>
            </div>
          </div>

          {/* Metadata Table */}
          <div className="col-span-5 text-[11px]">
            <div className="flex flex-col space-y-[-1px]">
              <div className="flex">
                <div className="w-1/2 text-right pr-4 py-1.5">PENGIRIMAN #</div>
                <div className="w-1/2 border border-black bg-white px-2 py-1.5 text-center font-bold">
                  {detail.no_sj}
                </div>
              </div>
              <div className="flex">
                <div className="w-1/2 text-right pr-4 py-1.5">TANGGAL</div>
                <div className="w-1/2 border border-black bg-white px-2 py-1.5 text-center">
                  {dayjs(detail.created_at).format('DD/MM/YYYY')}
                </div>
              </div>
              {/* <div className="flex">
                <div className="w-1/2 text-right pr-4 py-1.5">NO SO #</div>
                <div className="w-1/2 border border-black bg-white px-2 py-1.5 text-center font-bold">
                  {firstInvoice.delivery_order?.transaksi?.order_id || '-'}
                </div>
              </div> */}
            </div>
          </div>
        </div>

        {/* Main Table */}
        <table className="w-full border-collapse border border-black text-[10px] mt-6">
          <thead className="bg-[#4a4a4a] text-white font-bold text-center uppercase">
            <tr>
              <th className="border border-black px-1 py-2 w-8">No</th>
              <th className="border border-black px-2 py-2 w-28">Nomor Invoice</th>
              <th className="border border-black px-2 py-2 w-28">NO SO #</th>
              <th className="border border-black px-3 py-2 text-left">Deskripsi Barang</th>
              <th className="border border-black px-2 py-2 w-20">Tgl Kirim</th>
              <th className="border border-black px-2 py-2 w-20">Tgl Terima</th>
              <th className="border border-black px-1 py-2 w-16">Qty</th>
              <th className="border border-black px-3 py-2 text-left w-32">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              let globalIndex = 0;
              return detail.sj_invoice_details?.flatMap((item, invIdx) =>
                item.invoice?.invoice_details?.map((prod, pIdx) => {
                  globalIndex++;
                  return (
                    <tr key={`${invIdx}-${pIdx}`} className="min-h-[35px] break-inside-avoid">
                      <td className="border border-black px-1 py-2 text-center align-top font-bold">{globalIndex}</td>
                      <td className="border border-black px-2 py-2 align-top font-bold text-blue-900 leading-tight">
                        {item.invoice?.transaction_no}
                      </td>
                      <td className="border border-black px-2 py-2 align-top font-semibold text-gray-700">
                        {item.invoice?.delivery_order?.transaksi?.order_id || '-'}
                      </td>
                      <td className="border border-black px-3 py-2 align-top">
                        <div className="font-bold text-black uppercase leading-tight">{prod.product_name}</div>
                        {prod.product_description && (
                          <div className="text-[9px] text-gray-500 mt-1 italic leading-tight">
                            {prod.product_description}
                          </div>
                        )}
                      </td>
                      <td className="border border-black px-2 py-2 text-center align-top font-semibold">
                        {item.tgl_kirim ? dayjs(item.tgl_kirim).format('DD/MM/YY') : '-'}
                      </td>
                      <td className="border border-black px-2 py-2 text-center align-top font-semibold">
                        {item.tgl_terima ? dayjs(item.tgl_terima).format('DD/MM/YY') : '-'}
                      </td>
                      <td className="border border-black px-1 py-2 text-center align-top font-bold text-[11px]">
                        <div>{prod.quantity}</div>
                        <div className="text-[8px] text-gray-400 font-normal">PCS</div>
                      </td>
                      <td className="border border-black px-3 py-2 align-top text-[9px] leading-snug italic text-gray-700">
                        {item.invoice?.memo || '-'}
                      </td>
                    </tr>
                  );
                })
              );
            })()}
            {/* Footer row integrated into table for perfect alignment */}
            <tr>
              <td colSpan={4} className="border border-black p-2 min-h-[100px] align-top text-[11px]">
                <p className="font-bold mb-1 uppercase text-gray-900">Catatan :</p>
                <div className="text-[10px] leading-snug whitespace-pre-wrap uppercase text-gray-600 font-medium">
                  {detail.keterangan || firstInvoice.memo || '-'}
                </div>
              </td>
              <td colSpan={4} className="border border-black p-2 min-h-[100px] align-top text-[11px]">
                <p className="font-bold mb-1 uppercase text-gray-900">PERHATIAN :</p>
                <p className="text-[10px] uppercase font-bold text-gray-700">GUDANG JAKARTA</p>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Signatures Section */}
        <div className="flex justify-between items-start text-[11px] px-8 mt-12 mb-20">
          <div className="flex flex-col items-center">
            <p className="font-bold mb-20">Diterima Oleh</p>
            <div className="border-b border-black w-40"></div>
          </div>

          <div className="flex flex-col items-center">
            <p className="font-bold mb-20">Dikirim Oleh</p>
            <div className="border-b border-black w-40 relative">
            </div>
          </div>

          <div className="flex flex-col items-center">
            <p className="font-bold mb-20">Gudang</p>
            <div className="border-b border-black w-40 relative">
            </div>
          </div>
        </div>

        {/* Bottom Dotted line for separating perforated part if any */}
        <div className="absolute bottom-10 left-0 w-full px-8">
          <div className="border-b border-black border-dashed w-full opacity-50"></div>
        </div>

      </div>

      {/* Styles for print */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintSjInvoice;

