import React, { useState, useEffect } from 'react';
import { Table, Button, Breadcrumb, Spin, Modal, Typography, Form, Input, DatePicker, Select, Space, Card, Tooltip, ConfigProvider } from 'antd';
import { DeleteOutlined, PlusOutlined, FileTextOutlined, ReloadOutlined } from '@ant-design/icons';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { baseUrl } from '@/configs';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { Search } = Input;

const PengajuanList = () => {
  const [dataSource, setDataSource] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isApprovedFilter, setIsApprovedFilter] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  const fetchPengajuanList = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token tidak ditemukan. Silakan login terlebih dahulu.');

      // Extract user ID from token
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        if (tokenPayload.id_user) {
          setCurrentUserId(tokenPayload.id_user);
        }
      } catch (e) {
        console.error('Error parsing token:', e);
      }

      const response = await fetch(`${baseUrl}/nimda/pengajuan`, {
        headers: { Authorization: `${token}` }
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      if (result.data) {
        const formattedData = result.data.map((item, index) => {
          const vendors = item.tb_pengajuan_vendors || [];
          // Select the vendor with the lowest total_vendor
          const selectedVendor = vendors.length > 0
            ? vendors.reduce((min, v) => parseFloat(v.total_vendor || 0) < parseFloat(min.total_vendor || Infinity) ? v : min)
            : null;
          const supplierNames = selectedVendor ? selectedVendor.supplier_name : vendors.map(v => v.supplier_name).join(', ');
          const totalVendor = selectedVendor
            ? parseFloat(selectedVendor.total_vendor || 0).toLocaleString('id-ID')
            : vendors.reduce((sum, v) => sum + parseFloat(v.total_vendor || 0), 0).toLocaleString('id-ID');

          return {
            key: item.id_pengajuan,
            no: index + 1,
            kodePengajuan: item.kode_pengajuan,
            tglPengajuan: new Date(item.tgl_pengajuan).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            tglPengajuanRaw: new Date(item.tglPengajuan),
            allocation: item.allocation,
            supplierName: supplierNames,
            totalVendor: `Rp. ${totalVendor}`,
            discountType: item.discount_type,
            description: item.description,
            selected: item.selected ? 'Ya' : 'Tidak',
            posted: item.posted ? 'Ya' : 'Tidak',
            canceled: item.canceled ? 'Ya' : 'Tidak',
            id_pengajuan: item.id_pengajuan,
            is_approved_by_me: item.is_approved_by_me,
            id_user: item.id_user
          };
        });

        const sortedData = formattedData.sort((a, b) => b.tglPengajuanRaw - a.tglPengajuanRaw);
        sortedData.forEach((item, index) => {
          item.no = index + 1;
        });

        setDataSource(sortedData);
        applyFilters(sortedData, searchText, isApprovedFilter);
      }
    } catch (error) {
      console.error('Error fetching pengajuan list:', error);
      setDataSource([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (data, search, approvedFilter) => {
    let filtered = data;

    if (search) {
      filtered = filtered.filter((item) => {
        const kode = item.kodePengajuan?.toLowerCase() || '';
        const tanggal = item.tglPengajuan?.toLowerCase() || '';
        const brand = item.allocation?.toLowerCase() || '';
        const supplier = item.supplierName?.toLowerCase() || '';
        const total = item.totalVendor?.toLowerCase() || '';
        const deskripsi = item.description?.toLowerCase() || '';
        return (
          kode.includes(search.toLowerCase()) ||
          tanggal.includes(search.toLowerCase()) ||
          brand.includes(search.toLowerCase()) ||
          supplier.includes(search.toLowerCase()) ||
          total.includes(search.toLowerCase()) ||
          deskripsi.includes(search.toLowerCase())
        );
      });
    }

    filtered = approvedFilter
      ? filtered.filter(item => item.id_user === currentUserId)
      : filtered.filter(item => item.id_user !== currentUserId);

    setFilteredData(filtered);
  };

  useEffect(() => {
    fetchPengajuanList();
  }, []);

  useEffect(() => {
    applyFilters(dataSource, searchText, isApprovedFilter);
  }, [dataSource, searchText, isApprovedFilter, currentUserId]);

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleFilterApproved = () => {
    setIsApprovedFilter(prev => !prev);
  };

  const handleBuatPP = (id_pengajuan) =>
    navigate(`/dashboard/pengajuan/detail/${id_pengajuan}`);

  const handleBuatPO = () => {
    setTableData([{ key: '1', namaBarang: 'Kertas Fotocopy Uk. A4 75 gr', keterangan: 'untuk kebutuhan Purch, Leg', qty: 20, harga: 0, disc: 0, total: 0 }]);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleCellChange = (key, dataIndex, value) => {
    const newData = [...tableData];
    const targetIndex = newData.findIndex(item => item.key === key);
    if (targetIndex >= 0) {
      newData[targetIndex][dataIndex] = value;
      if (['qty', 'harga', 'disc'].includes(dataIndex)) {
        const { qty = 0, harga = 0, disc = 0 } = newData[targetIndex];
        newData[targetIndex].total = parseFloat(qty) * parseFloat(harga) * (1 - parseFloat(disc) / 100);
      }
      setTableData(newData);
    }
  };

  const calculateTotal = () => tableData.reduce((sum, item) => sum + (item.total || 0), 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });

  const onFinish = (values) => {
    console.log('Form values:', values, 'Table data:', tableData);
    handleModalClose();
  };

  const addRow = () => {
    const newKey = (tableData.length + 1).toString();
    setTableData([...tableData, { key: newKey, namaBarang: '', keterangan: '', qty: 0, harga: 0, disc: 0, total: 0 }]);
  };

  const handleDelete = (key) => setTableData(tableData.filter(item => item.key !== key));

  const handleDeletePengajuan = async (id_pengajuan) => {
    Modal.confirm({
      title: <span className="text-base font-semibold text-gray-900">Konfirmasi Hapus</span>,
      content: <span className="text-gray-600">Apakah Anda yakin ingin menghapus pengajuan ini?</span>,
      okText: 'Ya',
      cancelText: 'Tidak',
      okButtonProps: {
        className: 'bg-red-500 border-red-500 text-white rounded-md px-4 py-1 font-medium hover:bg-red-600',
      },
      cancelButtonProps: {
        className: 'bg-gray-300 border-gray-300 text-gray-600 rounded-md px-4 py-1 font-medium hover:bg-gray-400',
      },
      onOk: async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem('token');
          if (!token) throw new Error('Token tidak ditemukan.');

          const response = await fetch(`${baseUrl}/nimda/pengajuan/${id_pengajuan}`, {
            method: 'DELETE',
            headers: { Authorization: `${token}`, 'Content-Type': 'application/json' }
          });

          if (!response.ok) throw new Error(`Gagal menghapus: ${response.status}`);
          setDataSource(prev => prev.filter(item => item.id_pengajuan !== id_pengajuan));
          setFilteredData(prev => prev.filter(item => item.id_pengajuan !== id_pengajuan));
          Modal.success({
            content: <span className="text-green-600">Pengajuan berhasil dihapus</span>,
            okButtonProps: { className: 'rounded-md bg-green-500 border-green-500' }
          });
        } catch (error) {
          console.error('Error deleting pengajuan:', error);
          Modal.error({
            title: <span className="text-red-600">Error</span>,
            content: 'Gagal menghapus: ' + error.message,
            okButtonProps: { className: 'rounded-md bg-red-500 border-red-500' }
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const columns = [
    {
      title: 'Nama Barang',
      dataIndex: 'namaBarang',
      key: 'namaBarang',
      width: 160,
      render: (text, record) => (
        <Input
          value={text}
          onChange={e => handleCellChange(record.key, 'namaBarang', e.target.value)}
          size="middle"
          className="rounded text-xs p-1"
        />
      )
    },
    {
      title: 'Keterangan',
      dataIndex: 'keterangan',
      key: 'keterangan',
      width: 160,
      render: (text, record) => (
        <Input
          value={text}
          onChange={e => handleCellChange(record.key, 'keterangan', e.target.value)}
          size="middle"
          className="rounded text-xs p-1"
        />
      )
    },
    {
      title: 'Qty',
      dataIndex: 'qty',
      key: 'qty',
      width: 70,
      render: (text, record) => (
        <Input
          type="text"
          value={text}
          onChange={e => handleCellChange(record.key, 'qty', e.target.value.replace(/[^0-9.]/g, ''))}
          size="middle"
          className="rounded text-xs p-1 text-right"
        />
      )
    },
    {
      title: 'Harga @',
      dataIndex: 'harga',
      key: 'harga',
      width: 110,
      render: (text, record) => (
        <Input
          type="text"
          value={text}
          onChange={e => handleCellChange(record.key, 'harga', e.target.value.replace(/[^0-9.]/g, ''))}
          size="middle"
          className="rounded text-xs p-1 text-right"
        />
      )
    },
    {
      title: 'Disc (%)',
      dataIndex: 'disc',
      key: 'disc',
      width: 70,
      render: (text, record) => (
        <Input
          type="text"
          value={text}
          onChange={e => handleCellChange(record.key, 'disc', e.target.value.replace(/[^0-9.]/g, ''))}
          size="middle"
          className="rounded text-xs p-1 text-right"
        />
      )
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 110,
      render: (text, record) => (
        <Input
          type="text"
          value={text.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
          disabled
          size="middle"
          className="rounded text-xs p-1 text-right bg-gray-100"
        />
      )
    },
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_, record) => (
        <Button
          type="primary"
          danger
          onClick={() => handleDelete(record.key)}
          icon={<DeleteOutlined />}
          size="middle"
          className="rounded"
        />
      )
    },
  ];

  const handleTambahPengajuan = () => navigate('/dashboard/pengajuan/add');

  const columnsPengajuan = [
    {
      title: 'No',
      dataIndex: 'no',
      key: 'no',
      width: 50,
      align: 'center',
      render: text => <span className="text-gray-600">{text}</span>
    },
    {
      title: 'Kode',
      dataIndex: 'kodePengajuan',
      key: 'kodePengajuan',
      width: 100,
      render: (text, record) => (
        <span
          className="text-blue-500 cursor-pointer hover:underline"
          onClick={() => handleBuatPP(record.id_pengajuan)}
        >
          {text}
        </span>
      )
    },
    {
      title: 'Tanggal',
      dataIndex: 'tglPengajuan',
      key: 'tglPengajuan',
      width: 80,
      render: text => <span className="text-gray-600">{text}</span>
    },
    {
      title: 'Brand',
      dataIndex: 'allocation',
      key: 'allocation',
      width: 90,
      render: text => <span className="text-gray-600">{text}</span>
    },
    {
      title: 'Supplier',
      dataIndex: 'supplierName',
      key: 'supplierName',
      width: 160,
      render: text => (
        <Tooltip title={text}>
          <span
            className="text-gray-600"
            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {text}
          </span>
        </Tooltip>
      )
    },
    {
      title: 'Total',
      dataIndex: 'totalVendor',
      key: 'totalVendor',
      width: 110,
      align: 'right',
      render: text => <span className="text-green-600">{text}</span>
    },
    {
      title: 'Deskripsi',
      dataIndex: 'description',
      key: 'description',
      width: 140,
      render: text => (
        <Tooltip title={text}>
          <span
            className="text-gray-500 italic"
            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {text || '-'}
          </span>
        </Tooltip>
      )
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 70,
      align: 'center',
      render: (_, record) => (
        <Space size="middle">
          {/* <Button 
            type="primary" 
            onClick={() => handleBuatPP(record.id_pengajuan)} 
            className="bg-green-500 border-green-500 rounded-md text-xs px-3 py-0"
            size="middle"
          >
            Detail
          </Button> */}
          <Button
            type="primary"
            danger
            onClick={() => handleDeletePengajuan(record.id_pengajuan)}
            icon={<DeleteOutlined />}
            className="rounded-md text-xs px-3 py-0"
            size="middle"
          />
        </Space>
      )
    }
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
            Daftar Pengajuan
          </Title>
        </div>

        <div className="px-4 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <Search
              placeholder="Cari berdasarkan kode, tanggal, supplier, total, status, atau penerimaan"
              allowClear
              onSearch={handleSearch}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 300 }}
            />
          </div>

          {loading ? (
            <div className="text-center py-10">
              <Spin size="large" tip="Memuat data..." />
            </div>
          ) : (
            <>
              {currentUserId === 47 && (
                <div className="p-3">
                  <Button
                    onClick={handleFilterApproved}
                    className={`rounded-md ${isApprovedFilter ? 'bg-gray-200 border-gray-400' : 'bg-white border-gray-300'} text-gray-800 text-xs`}
                    size="middle"
                    style={{ fontSize: '12px' }}
                  >
                    Approved {isApprovedFilter ? '(Aktif)' : ''}
                  </Button>
                </div>
              )}
              <Table
                dataSource={filteredData}
                columns={columnsPengajuan}
                pagination={{ pageSize: 10, showSizeChanger: true, responsive: true }}
                scroll={{ x: false }}
                bordered
                rowClassName="hover:bg-gray-50"
                className="ant-table-custom"
                size="middle"
              />
            </>
          )}


          <Modal
            title={<span className="text-lg font-semibold text-gray-900">Buat Purchase Order</span>}
            open={isModalVisible}
            onCancel={handleModalClose}
            footer={null}
            width="90%"
            className="max-w-4xl"
            bodyStyle={{ padding: '16px sm:24px', backgroundColor: '#fafafa' }}
          >
            <Card className="rounded-lg shadow">
              <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ tanggalKirim: moment(), tempo: 'Tunai', perusahaan: 'LOG - PT Eureka Logistics', ppn: 0, jenisDiskon: 'Persen' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Form.Item label={<span className="font-medium text-gray-600">Nomor PO</span>} name="nomorPO">
                      <Input placeholder="PC/20250346/PO" className="rounded-md p-2 text-xs" size="middle" />
                    </Form.Item>
                    <Form.Item label={<span className="font-medium text-gray-600">Supplier</span>} name="supplier">
                      <Select className="rounded-md" size="middle">
                        <Option value="SARANA TEKNIK MANDIRI ABADI, PT">SARANA TEKNIK MANDIRI ABADI, PT</Option>
                        <Option value="supplier2">Supplier 2</Option>
                        <Option value="supplier3">Supplier 3</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label={<span className="font-medium text-gray-600">Tanggal Kirim</span>} name="tanggalKirim">
                      <DatePicker format="YYYY-MM-DD" className="w-full rounded-md p-2 text-xs" size="middle" />
                    </Form.Item>
                    <Form.Item label={<span className="font-medium text-gray-600">Tempo</span>} name="tempo">
                      <Select className="rounded-md" size="middle">
                        <Option value="Tunai">Tunai</Option>
                        <Option value="Net 30">Net 30</Option>
                        <Option value="Net 60">Net 60</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label={<span className="font-medium text-gray-600">Perusahaan</span>} name="perusahaan">
                      <Select className="rounded-md" size="middle">
                        <Option value="LOG - PT Eureka Logistics">LOG - PT Eureka Logistics</Option>
                        <Option value="company2">Company 2</Option>
                        <Option value="company3">Company 3</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label={<span className="font-medium text-gray-600">PPInvestment (%)</span>} name="ppn">
                      <Input type="text" addonAfter="%" className="rounded-md p-2 text-xs" size="middle" />
                    </Form.Item>
                  </div>
                  <div>
                    <Form.Item label={<span className="font-medium text-gray-600">Gudang</span>} name="gudang">
                      <Select className="rounded-md" size="middle">
                        <Option value="Gudang Suci (Pool)">Gudang Suci (Pool)</Option>
                        <Option value="gudang2">Gudang 2</Option>
                        <Option value="gudang3">Gudang 3</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label={<span className="font-medium text-gray-600">Alamat</span>} name="alamat">
                      <TextArea rows={4} placeholder="Jl. Suci (GAP PRINT) No. 11, Susukan, Ciracas, Jakarta Timur 13750, Jakarta" className="rounded-md p-2 text-xs" size="middle" />
                    </Form.Item>
                    <Form.Item label={<span className="font-medium text-gray-600">Catatan</span>} name="catatan">
                      <TextArea rows={2} placeholder="Mohon dikirim segera..." className="rounded-md p-2 text-xs" size="middle" />
                    </Form.Item>
                    <Form.Item label={<span className="font-medium text-gray-600">Kena PPh</span>} name="kenaPPh">
                      <Input type="text" className="rounded-md p-2 text-xs" size="middle" />
                    </Form.Item>
                    <Form.Item label={<span className="font-medium text-gray-600">Jenis Diskon</span>} name="jenisDiskon">
                      <Select className="rounded-md" size="middle">
                        <Option value="Persen">Persen</Option>
                        <Option value="Nominal">Nominal</Option>
                      </Select>
                    </Form.Item>
                  </div>
                </div>
                <div className="my-4 sm:my-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800">Detail Barang</h3>
                    <Space className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Select placeholder="Pilih Kategori" className="w-full sm:w-48 rounded-md" size="middle">
                        <Option value="ongkosPasang">Ongkos Pasang</Option>
                        <Option value="delivery">Delivery</Option>
                        <Option value="other">Lainnya</Option>
                      </Select>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={addRow}
                        className="bg-blue-500 border-blue-500 rounded-md font-medium w-full sm:w-auto text-xs"
                        size="middle"
                      >
                        Tambah Baris
                      </Button>
                    </Space>
                  </div>
                  <Table
                    columns={columns}
                    dataSource={tableData}
                    pagination={false}
                    bordered
                    rowClassName="hover:bg-gray-50"
                    className="ant-table-custom"
                    scroll={{ x: false }}
                    size="middle"
                    summary={() => (
                      <Table.Summary.Row className="bg-gray-50">
                        <Table.Summary.Cell colSpan={5} className="text-right font-semibold text-gray-800 text-xs">Total</Table.Summary.Cell>
                        <Table.Summary.Cell>
                          <Input
                            value={calculateTotal()}
                            disabled
                            size="middle"
                            className="rounded text-xs p-1 text-right bg-gray-100 font-semibold text-green-600"
                          />
                        </Table.Summary.Cell>
                        <Table.Summary.Cell />
                      </Table.Summary.Row>
                    )}
                  />
                </div>
                <div className="mt-4 sm:mt-6 flex justify-end">
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="middle"
                    className="bg-blue-500 border-blue-500 rounded-md font-medium px-4"
                  >
                    Submit PO
                  </Button>
                </div>
              </Form>
            </Card>
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
      `}</style>
        </div>
      </Card>
    </ConfigProvider>
  );
};

export default PengajuanList;