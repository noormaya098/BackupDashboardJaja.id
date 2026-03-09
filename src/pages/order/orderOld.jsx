import React, { useState } from 'react';
import { Card, CardBody, CardHeader, Typography } from '@material-tailwind/react';
import { Select, Input, Tag, Button } from 'antd';
import {
  FunnelIcon,
  NewspaperIcon,
  ChatBubbleBottomCenterIcon,
  CursorArrowRippleIcon,
  PrinterIcon
} from "@heroicons/react/24/solid";
import { useNavigate } from 'react-router-dom';

const { Option } = Select;
const { Search } = Input;

const gradientColors = 'from-[#64b0c9] via-[#8ACDE3] to-[#B1EBFE]';

const Order = () => {
  const [year, setYear] = useState(null);
  const [status, setStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleYearChange = (value) => {
    setYear(value);
    console.log('Selected Year:', value);
  };

  const handleStatusChange = (value) => {
    setStatus(value);
    console.log('Selected Status:', value);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    console.log('Search Term:', value);
  };

  const handleDetail = () => {
    navigate('/dashboard/order/detail-order');
  }

  const handleNew = () => {
    navigate('/dashboard/order/create-order');
  }

  const showModal = () => {
    console.log('Show tracking modal');
  };

  // Sample Orders Array
  const sampleOrders = [
    {
      invoice: 'INV-20250116',
      date: '16 Januari 2025',
      status: 'Pesanan Baru',
      color: 'blue',
      statusPembatalan: null,
      items: [
        {
          images: 'https://via.placeholder.com/40',
          productName: 'Produk Contoh',
          quantity: 2,
          price: '50.000',
          notes: 'Catatan khusus',
          address: 'Jl. Contoh Alamat No.123',
          trackingNumber: 'TRACK12345',
          courier: 'JNE',
          courierPrice: '10.000',
          totalPrice: '110.000',
        },
      ],
    },
    {
      invoice: 'INV-20250117',
      date: '17 Januari 2025',
      status: 'Dikirim',
      color: 'green',
      statusPembatalan: null,
      items: [
        {
          images: 'https://via.placeholder.com/40',
          productName: 'Produk Contoh 2',
          quantity: 1,
          price: '100.000',
          notes: 'Tidak ada catatan',
          address: 'Jl. Contoh Alamat No.124',
          trackingNumber: 'TRACK12346',
          courier: 'TIKI',
          courierPrice: '15.000',
          totalPrice: '115.000',
        },
      ],
    },
  ];

  return (
    <div className="mt-12 mb-8">
      <Card>
        <CardHeader
          variant="gradient"
          className={`bg-gradient-to-b ${gradientColors} mb-8 p-6 text-center`}
        >
          <Typography className="text-white font-bold text-lg" variant="h6" color="white">
            Daftar Order
          </Typography>
        </CardHeader>
        <CardBody>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col">
                <label htmlFor="year" className="text-sm font-medium mb-1">Pilih Tahun</label>
                <Select
                  id="year"
                  placeholder="Pilih Tahun"
                  style={{ width: 150 }}
                  onChange={handleYearChange}
                  allowClear
                >
                  <Option value="2023">2023</Option>
                  <Option value="2024">2024</Option>
                  <Option value="2025">2025</Option>
                </Select>
              </div>

              <div className="flex flex-col">
                <label htmlFor="status" className="text-sm font-medium mb-1">Pilih Status</label>
                <Select
                  id="status"
                  placeholder="Pilih Status"
                  style={{ width: 200 }}
                  onChange={handleStatusChange}
                  allowClear
                >
                  <Option value="Belum Dibayar">Belum Dibayar</Option>
                  <Option value="Pesanan Baru">Pesanan Baru</Option>
                  <Option value="Siap Dikirim">Siap Dikirim</Option>
                  <Option value="Dikirim">Dikirim</Option>
                  <Option value="Selesai">Selesai</Option>
                  <Option value="Dibatalkan">Dibatalkan</Option>
                  <Option value="Pengembalian">Pengembalian</Option>
                </Select>
              </div>

              <div className="flex flex-col">
                <label htmlFor="search" className="text-sm font-medium mb-1">Cari Pesanan</label>
                <div className="flex items-center">
                  <input
                    id="search"
                    type="text"
                    placeholder="Cari Pesanan"
                    className="border rounded-l-md px-4 py-2 w-52"
                  />
                  <button
                    onClick={handleSearch}
                    className="bg-blue-500 text-white hover:bg-blue-700 px-4 py-2 rounded-r-md"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
            <div>
              <Button
                type="primary"
                onClick={() => console.log('Downloading data...')}
                style={{ backgroundColor: '#007BFF', borderColor: '#007BFF' }}
                className='mr-2'
              >
                Download
              </Button>

              <Button
                type="primary"
                onClick={() => handleNew()}
                style={{ backgroundColor: '#007BFF', borderColor: '#007BFF' }}
              >
                New
              </Button>
            </div>
          </div>

          {/* Daftar Orders */}
          {sampleOrders.map((order, orderIndex) => (
            <div key={orderIndex}>
              <table className="w-full table-auto border-collapse mb-8">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-start" colSpan={5}>
                      <div className="flex space-x-4">
                        <div className="text-[#7db0c9] font-bold text-lg">{order.invoice}</div>
                        <div className="text-[#798181] text-sm text-center flex items-center">{order.date}</div>
                        <div className="flex items-center">
                          <Tag color={order.color}>{order.status}</Tag>
                          {order.statusPembatalan && <Tag color="gray">{order.statusPembatalan}</Tag>}
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2"></th>
                    <th className="border px-4 py-2">Info Produk</th>
                    <th className="border px-4 py-2">Alamat</th>
                    <th className="border px-4 py-2">Kurir</th>
                    <th className="border px-4 py-2">Total Harga</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="border px-4 py-2">
                        <img src={item.images} alt={item.productName} className="w-10 h-10" />
                      </td>
                      <td className="border px-4 py-2">
                        <div className="text-[#7db0c9] font-bold text-base mb-1 w-[20rem]">{item.productName}</div>
                        <div className="mb-1 text-base">{item.quantity} x <span className="text-red-500">Rp {item.price}</span></div>
                        <div className="mb-1 text-base"><i className="text-[#798181]">{item.notes}</i></div>
                      </td>
                      <td className="border px-4 py-2">
                        <div className="w-[25rem] text-base">{item.address}</div>
                        {item.trackingNumber && (
                          <div className="w-[25rem] text-base mt-4">
                            Nomor Resi :
                            <p>{item.trackingNumber}</p>
                          </div>
                        )}
                      </td>
                      <td className="border px-4 py-2 text-base">
                        <div>{item.courier}</div>
                        <div className="mb-4">Rp {item.courierPrice}</div>
                        <div className="mb-2">
                          <Tag className="bg-gray-200 px-2 py-1 rounded">Belum Dicetak</Tag>
                        </div>
                      </td>
                      <td className="border px-4 py-2">
                        <div className="text-2xl font-semibold text-[#ffbe0b]">Rp {item.totalPrice}</div>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={5} className="border px-4 py-2">
                      <div className="space-x-4">
                        <Button className='h-10 border border-blue-800' onClick={() => handleDetail()}>
                          <NewspaperIcon className="w-4 h-4 text-blue-800" />
                          Rincian Pesanan
                        </Button>
                        {order.status === 'Pesanan Selesai' && (
                          <>
                            <Button className="h-10 border border-[#0b0fff]">Cetak Label</Button>
                            <Button onClick={showModal} className="h-10 border border-[#b60bff]">Lacak Pesanan</Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
};

export default Order;
