import React, { useState, useEffect } from 'react';
import { Table, Input, Typography, Card, Modal, Spin, Button, Space } from 'antd';
import { SearchOutlined, FileTextOutlined, BuildOutlined, UserOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { baseUrl } from '@/configs';

const { Title, Text } = Typography;

const CompanyList = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyDetailLoading, setCompanyDetailLoading] = useState(false);
  const navigate = useNavigate();

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${baseUrl}/nimda/company/get-company`, {
        headers: { Authorization: `${token}` },
        params: {
          page,
          limit: 10,
          keyword,
        },
      });

      const { data, totalData } = response.data;
      setCompanies(data);
      setTotal(totalData);
    } catch (error) {
      console.error('Error fetching companies:', error);
      Swal.fire('Error', 'Gagal mengambil data perusahaan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyDetail = async (id_company) => {
    setCompanyDetailLoading(true);
    setModalVisible(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${baseUrl}/nimda/company/get-company-detail`, {
        headers: { Authorization: `${token}` },
        params: { id_company },
      });
      setSelectedCompany(response.data.data);
    } catch (error) {
      console.error('Error fetching company detail:', error);
      Swal.fire('Error', 'Gagal mengambil detail perusahaan', 'error');
    } finally {
      setCompanyDetailLoading(false);
    }
  };

  const handleDelete = async (id_company) => {
    Swal.fire({
      title: 'Apakah Anda yakin?',
      text: 'Perusahaan ini akan dihapus secara permanen!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`${baseUrl}/nimda/company/delete/${id_company}`, {
            headers: { Authorization: `${token}` },
          });
          Swal.fire('Berhasil', 'Perusahaan telah dihapus', 'success');
          setCompanies(companies.filter((company) => company.id_company !== id_company));
        } catch (error) {
          Swal.fire('Gagal', 'Terjadi kesalahan saat menghapus perusahaan', 'error');
        }
      }
    });
  };

  useEffect(() => {
    fetchCompanies();
  }, [page, keyword]);

  const columns = [
    { title: 'No', dataIndex: 'index', key: 'index', width: 50, render: (_, __, index) => index + 1 },
    {
      title: 'Kode',
      dataIndex: 'company_code',
      render: (code) => (
        <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-semibold inline-block">{code}</div>
      ),
    },
    {
      title: 'Nama Perusahaan',
      dataIndex: 'company_name',
      render: (name) => (
        <Text strong className="text-gray-800 hover:text-blue-600 transition-colors">{name}</Text>
      ),
    },
    {
      title: 'Alamat Penagihan',
      dataIndex: 'billing_address',
      render: (address) => (
        <Text type="secondary" className="text-gray-500 max-w-[250px] truncate block">{address || '-'}</Text>
      ),
    },
    {
      title: 'Aksi',
      dataIndex: 'id_company',
      width: 220,
      align: 'center',
      render: (id) => (
        <div className="flex justify-center">
          <Space size="small">
            <Button
              type="primary"
              onClick={() => fetchCompanyDetail(id)}
              className="bg-green-500 border-green-500 rounded-md w-16"
            >
              Detail
            </Button>
            <Button
              type="primary"
              onClick={() => navigate(`/dashboard/company/edit/${id}`)}
              className="bg-blue-500 border-blue-500 rounded-md w-16"
            >
              Edit
            </Button>
            <Button
              type="primary"
              danger
              onClick={() => handleDelete(id)}
              className="rounded-md w-16"
            >
              Hapus
            </Button>
          </Space>
        </div>
      ),
    },
  ];

  const CompanyDetailModal = () => (
    <Modal
      open={modalVisible}
      onCancel={() => setModalVisible(false)}
      footer={null}
      width={600}
      centered
      className="company-detail-modal"
    >
      {companyDetailLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : selectedCompany ? (
        <div className="p-6">
          <div className="border-b pb-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <BuildOutlined className="mr-3 text-blue-600" />
              {selectedCompany.company_name}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex space-x-3 mb-4">
                <span className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm">{selectedCompany.company_code}</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${selectedCompany.is_erlangga ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-800'
                    }`}
                >
                  {selectedCompany.is_erlangga ? 'Perusahaan Erlangga' : 'Non-Erlangga'}
                </span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-semibold text-gray-700 mb-2">Alamat</h3>
                <p className="text-gray-600">{selectedCompany.billing_address || 'Tidak ada alamat'}</p>
              </div>
              {selectedCompany.tax_number && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">NPWP</h3>
                  <code className="bg-gray-200 px-2 py-1 rounded text-sm">{selectedCompany.tax_number}</code>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200 flex items-center">
                <UserOutlined className="mr-3 text-blue-600" />
                Penanggung Jawab
              </h3>
              {selectedCompany.pic_company && (selectedCompany.pic_company.name || selectedCompany.pic_company.phone || selectedCompany.pic_company.email) ? (
                <div className="space-y-3">
                  {selectedCompany.pic_company.name && (
                    <div className="flex items-center space-x-3">
                      <UserOutlined className="text-blue-600" />
                      <span>{selectedCompany.pic_company.name}</span>
                    </div>
                  )}
                  {selectedCompany.pic_company.phone && (
                    <div className="flex items-center space-x-3">
                      <PhoneOutlined className="text-green-600" />
                      <span>{selectedCompany.pic_company.phone}</span>
                    </div>
                  )}
                  {selectedCompany.pic_company.email && (
                    <div className="flex items-center space-x-3">
                      <MailOutlined className="text-red-600" />
                      <span>{selectedCompany.pic_company.email}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">Tidak ada informasi kontak</div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );

  return (
    <div className="mb-8 px-2 sm:px-0">
      <Card className="">
        <div className="p-3 m-0 text-left">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <Title level={4} className="m-0 p-0 text-left flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <FileTextOutlined style={{ fontSize: '24px', marginRight: '12px', color: '#1890ff' }} />
              Daftar Company
            </Title>
          </div>
        </div>
        <div className="mb-6 flex justify-between items-center pl-2 pr-2">
          <Input
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Cari perusahaan berdasarkan nama atau kode"
            allowClear
            className="w-1/2 rounded-xl py-2 shadow-sm border-gray-200 focus:border-blue-500"
            onPressEnter={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
          />
          <Button
            type="primary"
            onClick={() => navigate('/dashboard/company/add')}
            className="bg-green-500 hover:bg-green-600"
          >
            Tambah Company
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={companies}
          loading={loading}
          pagination={{
            current: page,
            total: total,
            pageSize: 10,
            showSizeChanger: false,
            className: 'flex justify-center mt-4',
            onChange: (newPage) => setPage(newPage),
            showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} perusahaan`,
          }}
          rowKey="id_company"
          className="w-full rounded-2xl overflow-hidden pl-2 pr-2"
          rowClassName="hover:bg-gray-50 transition-all duration-200"
          scroll={{ x: 'max-content' }}
        />
      </Card>
      <CompanyDetailModal />
    </div>
  );
};

export default CompanyList;