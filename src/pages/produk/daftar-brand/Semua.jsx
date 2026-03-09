import { Button, Input, Modal, Select, Tag } from 'antd';
import React, { useState, useEffect } from 'react';
import {
  PencilSquareIcon,
  TrashIcon
} from "@heroicons/react/24/solid";
import { Card, CardBody } from '@material-tailwind/react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios'; // Import axios
import { baseUrl } from '@/configs';

const { Option } = Select;

function Semua({ status }) {
  const [brands, setBrands] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editBrand, setEditBrand] = useState(null);
  const [brandName, setBrandName] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the brand list from the API
    const fetchBrands = async () => {
      try {
        const token = localStorage.getItem('token');

        const response = await axios.get(`${baseUrl}/v1/brand/listbrand`, {
          headers: {
            Authorization: `${token}`,
          }
        });

        // Store the brands data in state
        setBrands(response.data.data);
      } catch (error) {
        console.error('Error fetching brand data:', error);
      }
    };

    fetchBrands();
  }, []);

  useEffect(() => {
    // Filter orders based on status
    const orders = brands.map(brand => ({
      invoice: `INV-${brand.id_merek}`,
      date: new Date().toISOString().slice(0, 19).replace('T', ' '), // Mock date
      status: 'Menunggu', // Mock status
      brand: brand.merek,
      kategori: 'Tidak ada', // Mock category
      sub_kategori: 'Tidak ada', // Mock sub-category
      id_merek: brand.id_merek, // Add id_merek for delete/update operations
    }));
    setFilteredOrders(status ? orders.filter(order => order.status === status) : orders);
  }, [brands, status]);

  const handleEdit = (brand) => {
    setEditBrand(brand);
    setBrandName(brand.merek);
    setSelectedBrandId(brand.id_merek);
    setIsModalVisible(true);
  };

  const handleUpdateBrand = async () => {
    try {
      // Retrieve token from localStorage
      const token = localStorage.getItem('token');

      // Update brand data
      await axios.post(`${baseUrl}/v1/brand/update-brand`, {
        id_data: selectedBrandId,
        nama_merek: brandName
      }, {
        headers: {
          Authorization: `${token}`,
        }
      });

      // Refetch brands
      const response = await axios.get(`${baseUrl}/v1/brand/listbrand`, {
        headers: {
          Authorization: `${token}`,
        }
      });
      setBrands(response.data.data);

      Swal.fire('Updated!', 'Brand has been updated.', 'success');
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error updating brand:', error);
      Swal.fire('Error!', 'There was an error updating the brand.', 'error');
    }
  };

  const handleDelete = (brandId) => {
    Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Anda tidak akan dapat mengembalikan ini!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus saja!',
      cancelButtonText: 'Batalkan'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Retrieve token from localStorage
          const token = localStorage.getItem('token');

          // Delete brand data
          await axios.post(`${baseUrl}/v1/brand/delete-brand`, {
            id_merek: brandId,
          }, {
            headers: {
              Authorization: `${token}`,
            }
          });

          // Refetch brands
          const response = await axios.get(`${baseUrl}/v1/brand/listbrand`, {
            headers: {
              Authorization: `${token}`,
            }
          });
          setBrands(response.data.data);

          Swal.fire('Deleted!', 'Brand has been deleted.', 'success');
        } catch (error) {
          console.error('Error deleting brand:', error);
          Swal.fire('Error!', 'There was an error deleting the brand.', 'error');
        }
      }
    });
  };


  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
    handleUpdateBrand();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <div>
      <br />
      <div className='w-full flex space-x-5'>
        <div className='w-full flex justify-end items-end'>
          <div className='w-1/4'>
            <Input placeholder='Search' className='h-10' />
          </div>
        </div>
      </div>

      {/* Data */}
      <>
        <div className="mb-4 w-full mt-4 ">
          {filteredOrders.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <Card className="border border-solid mb-5">
                <CardBody>
                  <h1 className="text-2xl">Belum Ada Data</h1>
                </CardBody>
              </Card>
            </div>
          ) : (
            <table className="w-full table-auto border-collapse overflow-auto">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2 text-lg">No.</th>
                  <th className="border px-4 py-2 text-lg">Brand</th>
                  {/* <th className="border px-4 py-2 text-lg">Kategori</th> */}
                  {/* <th className="border px-4 py-2 text-lg">Sub Kategori</th> */}
                  <th className="border px-4 py-2 text-lg">Status</th>
                  <th className="border px-4 py-2 text-lg">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => (
                  <tr key={index}>
                    <td className="border px-4 py-2 text-center">{index + 1}</td>
                    <td className="border px-4 py-2">
                      <div>
                        <div className='text-lg font-bold text-center'>
                          {order.brand}
                        </div>
                      </div>
                    </td>
                    {/* <td className="border px-4 py-2 text-center">{order.kategori}</td> */}
                    {/* <td className="border px-4 py-2 text-center">{order.sub_kategori}</td> */}
                    <td className="border px-4 py-2 text-center">
                      <Tag color={order.status === "Disetujui" ? 'green' : 'yellow'}>
                        {order.status}
                      </Tag>
                    </td>
                    <td className="border px-4 py-2 text-center">
                      <div className='w-full flex space-x-2 justify-center items-center'>
                        <Button onClick={() => handleEdit(order)} className='bg-blue-500 text-white'>
                          <PencilSquareIcon className='w-4 h-4 ' />
                        </Button>
                        <Button onClick={() => handleDelete(order.id_merek)} className='bg-red-500 text-white'>
                          <TrashIcon className='w-4 h-4 ' />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </>

      {/* Modal Edit Brand */}
      <Modal
        centered
        width={800}
        title={
          <div className='text-2xl font-bold'>
            Edit dan Detail Brand
          </div>
        }
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        className='p-6'
        footer={false}
      >
        <div className='w-full flex mt-8'>
          <div className='w-1/3 text-lg'>
            <label className='text-xl'>Nama Brand <span className='text-red-500'>*</span></label>
          </div>
          <div className='w-full'>
            <Input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder='Masukkan Nama Brand'
              className='h-10'
            />
          </div>
        </div>
        {/* <br />
        <div className='w-full flex '>
          <div className='w-1/3 text-lg'>
            <label className='text-xl'>Kategori</label>
          </div>
          <div className='w-full'>
            <Select
              showSearch
              className="w-full h-10"
              placeholder="Pilih kategori"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
              filterSort={(optionA, optionB) =>
                optionA.children.toLowerCase().localeCompare(optionB.children.toLowerCase())
              }
            >
              <Option value="kategori1">Kategori 1</Option>
              <Option value="kategori2">Kategori 2</Option>
              <Option value="kategori3">Kategori 3</Option>
            </Select>
          </div>
        </div>
        <div className='w-full flex mt-8'>
          <div className='w-1/3 text-lg'>
            <label className='text-xl'>Sub Kategori</label>
          </div>
          <div className='w-full'>
            <Select
              showSearch
              className="w-full h-10"
              placeholder="Pilih sub kategori"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
              filterSort={(optionA, optionB) =>
                optionA.children.toLowerCase().localeCompare(optionB.children.toLowerCase())
              }
            >
              <Option value="subkategori1">Sub Kategori 1</Option>
              <Option value="subkategori2">Sub Kategori 2</Option>
              <Option value="subkategori3">Sub Kategori 3</Option>
            </Select>
          </div>
        </div> */}
        <br />
        <div className='w-full flex space-x-2 justify-end'>
          <Button onClick={handleCancel} className='bg-red-400 text-white text-lg h-10'>
            Batal
          </Button>
          <Button onClick={handleUpdateBrand} className='bg-blue-400 text-white text-lg h-10'>
            Update
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default Semua;
