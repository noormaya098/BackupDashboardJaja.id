import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Tag, Input, Space, Button, Modal, Form, Select, message, Dropdown, Menu, ConfigProvider } from 'antd';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { PlusIcon, EyeIcon, PencilSquareIcon, TrashIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { baseUrl } from '@/configs';

const { Option } = Select;

function MasterKategori() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loadingEditId, setLoadingEditId] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const navigate = useNavigate();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth/sign-in');
        return;
      }

      const response = await axios.get(`${baseUrl}/nimda/category-v2`, {
        headers: {
          Authorization: `${token}`,
        },
      });

      if (response.data && response.data.data) {
        setCategories(response.data.data);
      }
      setLoading(false);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        navigate('/auth/sign-in');
      } else {
        setError('Gagal mengambil data kategori');
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [navigate]);

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const showModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setIsModalVisible(true);
    form.resetFields();
    setSelectedLevel(1);
  };

  const handleEdit = async (id) => {
    setLoadingEditId(id);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${baseUrl}/nimda/category-v2/${id}`, {
        headers: { Authorization: token },
      });

      const data = response.data.data;
      setIsEditMode(true);
      setEditingId(id);
      setSelectedLevel(data.level);

      form.setFieldsValue({
        brand_type: data.brand_type,
        level: data.level,
        parent_code: data.parent_code,
        code: data.code,
        name: data.name,
        persediaan: data.persediaan,
        kode_persediaan: data.kode_persediaan,
      });

      setIsModalVisible(true);
    } catch (err) {
      message.error('Gagal mengambil detail kategori');
    } finally {
      setLoadingEditId(null);
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Apakah Anda yakin?',
      text: 'Anda tidak akan dapat mengembalikan ini!',
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
          await axios.delete(`${baseUrl}/nimda/kategori/delete-kategori/${id}`, {
            headers: { Authorization: token },
          });

          Swal.fire('Dihapus!', 'Kategori berhasil dihapus.', 'success');
          fetchCategories();
        } catch (err) {
          Swal.fire('Gagal!', err.response?.data?.message || 'Terjadi kesalahan saat menghapus kategori', 'error');
        }
      }
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const body = {
        brand_type: values.brand_type,
        code: values.code,
        parent_code: values.level === 1 ? null : values.parent_code,
        name: values.name,
        level: values.level,
        persediaan: values.persediaan || null,
        kode_persediaan: values.kode_persediaan || null,
      };

      if (isEditMode) {
        await axios.put(`${baseUrl}/nimda/category-v2/${editingId}`, body, {
          headers: { Authorization: token },
        });
        message.success('Kategori berhasil diperbarui');
      } else {
        await axios.post(`${baseUrl}/nimda/category-v2`, body, {
          headers: { Authorization: token },
        });
        message.success('Kategori berhasil ditambahkan');
      }

      setIsModalVisible(false);
      fetchCategories();
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || `Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} kategori`);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to filter recursive data
  const filterCategories = (data, search) => {
    if (!search) return data;
    return data.reduce((acc, item) => {
      const matchName = item.name?.toLowerCase().includes(search.toLowerCase());
      const matchCode = item.code?.toLowerCase().includes(search.toLowerCase());

      let filteredChildren = [];
      if (item.children && item.children.length > 0) {
        filteredChildren = filterCategories(item.children, search);
      }

      if (matchName || matchCode || filteredChildren.length > 0) {
        acc.push({
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : undefined
        });
      }
      return acc;
    }, []);
  };

  const filteredData = filterCategories(categories, searchTerm);

  const columns = [
    {
      title: 'Nama Kategori',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Kode',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Brand Type',
      dataIndex: 'brand_type',
      key: 'brand_type',
      render: (text) => (
        <Tag color={text === 'JAJAID' ? 'blue' : 'orange'}>
          {text}
        </Tag>
      ),
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      align: 'center',
    },
    {
      title: 'Persediaan',
      dataIndex: 'persediaan',
      key: 'persediaan',
      render: (text) => text || '-',
    },
    {
      title: 'Kode Persediaan',
      dataIndex: 'kode_persediaan',
      key: 'kode_persediaan',
      render: (text) => text || '-',
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <Tag color={active === 1 ? 'green' : 'red'}>
          {active === 1 ? 'Aktif' : 'Non-Aktif'}
        </Tag>
      ),
    },
    {
      title: 'Aksi',
      key: 'aksi',
      align: 'center',
      render: (_, record) => {
        const menu = (
          <Menu>
            <Menu.Item
              key="detail"
              icon={<EyeIcon className="w-4 h-4 text-blue-500" />}
              onClick={() => navigate(`/dashboard/produk/category/detail/${record.id_category}`)}
            >
              Detail
            </Menu.Item>
            <Menu.Item
              key="edit"
              icon={<PencilSquareIcon className="w-4 h-4 text-orange-500" />}
              onClick={() => handleEdit(record.id_category)}
              disabled={loadingEditId === record.id_category}
            >
              {loadingEditId === record.id_category ? 'Loading...' : 'Edit'}
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              key="delete"
              icon={<TrashIcon className="w-4 h-4 text-red-500" />}
              danger
              onClick={() => handleDelete(record.id_category)}
            >
              Hapus
            </Menu.Item>
          </Menu>
        );

        return (
          <Dropdown overlay={menu} trigger={['click']} placement="bottomRight">
            <Button
              type="text"
              icon={<Cog6ToothIcon className="w-6 h-6 text-gray-600" />}
              className="flex items-center justify-center mx-auto h-10 w-10"
            />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <ConfigProvider theme={{ token: { fontFamily: 'Plus Jakarta Sans' } }}>
      <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <div className="w-full px-4 mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Input
              placeholder="Cari kategori atau kode..."
              className="h-10"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: '100%', maxWidth: '300px' }}
            />
            <Button
              type="primary"
              className="h-10 bg-green-500 hover:bg-green-600 text-white flex items-center w-full sm:w-auto border-none"
              onClick={showModal}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Tambah Kategori
            </Button>
          </div>
        </div>
        <div className="px-4">
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id_category"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              className: 'flex justify-center',
            }}
            scroll={{ x: 'max-content' }}
            className="rounded-lg"
            expandable={{
              defaultExpandAllRows: false,
            }}
          />
        </div>

        <Modal
          title={isEditMode ? "Edit Kategori" : "Tambah Kategori Baru"}
          visible={isModalVisible}
          onCancel={handleCancel}
          footer={null}
          destroyOnClose
          centered
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ level: 1, brand_type: 'JAJAID' }}
          >
            <Form.Item
              name="brand_type"
              label="Brand Type"
              rules={[{ required: true, message: 'Pilih Brand Type' }]}
            >
              <Select placeholder="Pilih Brand Type">
                <Option value="JAJAID">JAJAID</Option>
                <Option value="AUTO">AUTO</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="level"
              label="Level"
              rules={[{ required: true, message: 'Pilih Level' }]}
            >
              <Select
                placeholder="Pilih Level"
                onChange={(value) => setSelectedLevel(value)}
              >
                <Option value={1}>1 (Parent Category)</Option>
                <Option value={2}>2 (Sub Category)</Option>
              </Select>
            </Form.Item>

            {selectedLevel === 2 && (
              <Form.Item
                name="parent_code"
                label="Parent Category"
                rules={[{ required: true, message: 'Pilih Parent Category' }]}
              >
                <Select placeholder="Pilih Parent" showSearch optionFilterProp="children">
                  {categories.map((cat) => (
                    <Option key={cat.id_category} value={cat.code}>
                      {cat.name} ({cat.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            <Form.Item
              name="code"
              label="Kode Kategori"
              rules={[{ required: true, message: 'Masukkan Kode' }]}
            >
              <Input placeholder="Contoh: 100" />
            </Form.Item>

            <Form.Item
              name="name"
              label="Nama Kategori"
              rules={[{ required: true, message: 'Masukkan Nama' }]}
            >
              <Input placeholder="Contoh: JAJA AUTO test 2" />
            </Form.Item>

            <Form.Item
              name="persediaan"
              label="Persediaan"
            >
              <Input placeholder="Input manual" />
            </Form.Item>

            <Form.Item
              name="kode_persediaan"
              label="Kode Persediaan"
            >
              <Input placeholder="Input manual" />
            </Form.Item>

            <Form.Item className="mb-0 flex justify-end">
              <Space>
                <Button onClick={handleCancel}>Batal</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  className="bg-blue-500 border-none"
                >
                  {isEditMode ? 'Perbarui' : 'Simpan'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
}

export default MasterKategori;
