import React, { useState } from 'react';
import { Select, Input, Table, Button, Checkbox } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const { Option } = Select;

const PurchaseRequestForm = () => {
  const [formData, setFormData] = useState({
    nomor: 'PC/2025030780/PP',
    noDpp: 'PC-JKT/2025020004/SOI',
    perusahaan: 'LOG - PT Eureka Logistics',
    alokasi: 'Operasional',
    jenisDiskon: 'Persen',
    tanggal: '2025-03-28'
  });

  const [vendors] = useState([
    'SARANA TEKNIK MANDIRI ABADI, PT',
    'Tidak Ditentukan',
    'Tidak Ditentukan'
  ]);

  const [dataSource, setDataSource] = useState([
    {
      key: '1',
      no: 1,
      jenisBarang: 'Kertas Fotocopy Uk. A4 75 gr',
      spesifikasi: 'untuk kebutuhan Purch, Legal, dan MD GT',
      vendors: [
        { name: 'SARANA TEKNIK MANDIRI ABADI, PT', harga: 0, qty: 20, disc: 0 },
        { name: 'Tidak Ditentukan', harga: 0, qty: 20, disc: 0 },
        { name: 'Tidak Ditentukan', harga: 0, qty: 20, disc: 0 }
      ]
    },
    {
      key: '5',
      no: 5,
      jenisBarang: 'POST IT 3M, NO. 653',
      spesifikasi: 'warna',
      vendors: [
        { name: 'SARANA TEKNIK MANDIRI ABADI, PT', harga: 0, qty: 12, disc: 0 },
        { name: 'Tidak Ditentukan', harga: 0, qty: 12, disc: 0 },
        { name: 'Tidak Ditentukan', harga: 0, qty: 12, disc: 0 }
      ]
    }
  ]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const columns = [
    {
      title: 'No',
      dataIndex: 'no',
      key: 'no',
      width: 50,
      render: (text) => <div className="text-center">{text}</div>
    },
    {
      title: 'Jenis Barang',
      dataIndex: 'jenisBarang',
      key: 'jenisBarang',
      render: (text, record) => (
        <Select 
          value={text} 
          className="w-full"
          onChange={(value) => {
            const newDataSource = dataSource.map(item => 
              item.key === record.key ? { ...item, jenisBarang: value } : item
            );
            setDataSource(newDataSource);
          }}
        >
          <Option value={text}>{text}</Option>
        </Select>
      )
    },
    {
      title: 'Spesifikasi',
      dataIndex: 'spesifikasi',
      key: 'spesifikasi',
      render: (text, record) => (
        <Input 
          value={text} 
          placeholder="Specification" 
          onChange={(e) => {
            const newDataSource = dataSource.map(item => 
              item.key === record.key ? { ...item, spesifikasi: e.target.value } : item
            );
            setDataSource(newDataSource);
          }}
        />
      )
    },
    ...vendors.map((vendorName, vendorIndex) => ({
      title: vendorName,
      key: `vendor_${vendorIndex}`,
      render: (_, record) => {
        const vendor = record.vendors[vendorIndex];
        return (
          <div className="space-y-1">
            <Select 
              value={vendor.name} 
              className="w-full mb-1"
              onChange={(value) => {
                const newDataSource = dataSource.map(item => {
                  if (item.key === record.key) {
                    const newVendors = [...item.vendors];
                    newVendors[vendorIndex] = { ...newVendors[vendorIndex], name: value };
                    return { ...item, vendors: newVendors };
                  }
                  return item;
                });
                setDataSource(newDataSource);
              }}
            >
              <Option value={vendor.name}>{vendor.name}</Option>
            </Select>
            <Input 
              placeholder="Harga" 
              value={vendor.harga} 
              prefix="Rp" 
              className="mb-1"
              onChange={(e) => {
                const newDataSource = dataSource.map(item => {
                  if (item.key === record.key) {
                    const newVendors = [...item.vendors];
                    newVendors[vendorIndex] = { ...newVendors[vendorIndex], harga: e.target.value };
                    return { ...item, vendors: newVendors };
                  }
                  return item;
                });
                setDataSource(newDataSource);
              }}
            />
            <Input 
              placeholder="Qty" 
              value={vendor.qty} 
              className="mb-1"
              onChange={(e) => {
                const newDataSource = dataSource.map(item => {
                  if (item.key === record.key) {
                    const newVendors = [...item.vendors];
                    newVendors[vendorIndex] = { ...newVendors[vendorIndex], qty: e.target.value };
                    return { ...item, vendors: newVendors };
                  }
                  return item;
                });
                setDataSource(newDataSource);
              }}
            />
            <Input 
              placeholder="Disc" 
              value={vendor.disc} 
              className="mb-1"
              onChange={(e) => {
                const newDataSource = dataSource.map(item => {
                  if (item.key === record.key) {
                    const newVendors = [...item.vendors];
                    newVendors[vendorIndex] = { ...newVendors[vendorIndex], disc: e.target.value };
                    return { ...item, vendors: newVendors };
                  }
                  return item;
                });
                setDataSource(newDataSource);
              }}
            />
            <Input 
              placeholder="Jumlah (exc PPN)" 
              value={(vendor.harga * vendor.qty * (1 - vendor.disc/100)).toFixed(2)} 
              prefix="Rp" 
              readOnly
            />
          </div>
        );
      }
    })),
    {
      title: 'Aksi',
      key: 'action',
      width: 50,
      render: (_, record) => (
        <Button 
          icon={<CloseOutlined />} 
          className="text-red-500 border-red-500"
          onClick={() => {
            setDataSource(dataSource.filter(item => item.key !== record.key));
          }}
        />
      )
    }
  ];

  return (
    <div className="p-4 bg-white">
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block mb-1">Nomor</label>
          <Input 
            value={formData.nomor}
            onChange={(e) => handleInputChange('nomor', e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1">No. DPP</label>
          <Input 
            value={formData.noDpp} 
            readOnly 
          />
        </div>
        <div>
          <label className="block mb-1">Perusahaan</label>
          <Select 
            value={formData.perusahaan} 
            className="w-full"
            onChange={(value) => handleInputChange('perusahaan', value)}
          >
            <Option value={formData.perusahaan}>{formData.perusahaan}</Option>
          </Select>
        </div>
        <div>
          <label className="block mb-1">Tanggal</label>
          <Input 
            value={formData.tanggal}
            onChange={(e) => handleInputChange('tanggal', e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-1">Alokasi</label>
          <Select 
            value={formData.alokasi} 
            className="w-full"
            onChange={(value) => handleInputChange('alokasi', value)}
          >
            <Option value={formData.alokasi}>{formData.alokasi}</Option>
          </Select>
        </div>
        <div>
          <label className="block mb-1">Jenis Diskon</label>
          <Select 
            value={formData.jenisDiskon} 
            className="w-full"
            onChange={(value) => handleInputChange('jenisDiskon', value)}
          >
            <Option value={formData.jenisDiskon}>{formData.jenisDiskon}</Option>
          </Select>
        </div>
      </div>
      
      <Table 
        dataSource={dataSource} 
        columns={columns} 
        pagination={false} 
        bordered 
        size="small"
        className="mb-4"
      />
      
      <div className="mb-4 grid grid-cols-3 gap-4">
        <div>
          <label className="block mb-1">Pengiriman</label>
          <Select 
            value="Dikirim" 
            className="w-full"
          >
            <Option value="dikirim">Dikirim</Option>
          </Select>
        </div>
        <div>
          <label className="block mb-1">Pembayaran</label>
          <Select 
            value="Kredit 14 hari" 
            className="w-full"
          >
            <Option value="kredit">Kredit 14 hari</Option>
          </Select>
        </div>
        <div>
          <label className="block mb-1">PKP</label>
          <Select 
            value="Ya" 
            className="w-full"
          >
            <Option value="ya">Ya</Option>
          </Select>
        </div>
      </div>
      
      <div className="mb-4 grid grid-cols-3 gap-4">
        <div>
          <div className="flex items-center mb-1">
            <Checkbox />
            <span className="ml-2">PPN (11%)</span>
          </div>
          <Input prefix="Rp" placeholder="0" />
        </div>
        <div>
          <div className="flex items-center mb-1">
            <Checkbox />
            <span className="ml-2">PPH (2%)</span>
          </div>
          <Input prefix="Rp" placeholder="0" />
        </div>
        <div>
          <label className="block mb-1">Biaya Lain-lain</label>
          <Input prefix="Rp" placeholder="0" />
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block mb-1">Keterangan</label>
        <Input placeholder="Keterangan" />
      </div>
      
      <div className="grid grid-cols-3 gap-4 items-center">
        <div className="col-span-1">
          <div className="flex items-center">
            <span className="mr-2 font-bold">GRANDTOTAL</span>
            <Input prefix="Rp" placeholder="0" readOnly />
          </div>
        </div>
        <div className="col-span-2 flex justify-end space-x-2">
          {vendors.map((vendor, index) => (
            <label key={index} className="flex items-center">
              <input 
                type="radio" 
                name="vendorSelect" 
                value={vendor} 
                className="mr-1"
                checked={index === 2} 
              />
              {vendor}
            </label>
          ))}
          <Button type="primary" className="bg-green-500 ml-4">
            SUBMIT PENGAJUAN PEMBELIAN
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseRequestForm;