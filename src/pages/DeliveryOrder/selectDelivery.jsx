import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Typography,
  Space,
  Modal,
  Divider,
  Descriptions,
  message,
} from 'antd';
import { FileTextOutlined, RollbackOutlined } from '@ant-design/icons';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { baseUrl } from '@/configs';

const { Title, Text } = Typography;

const SelectDeliveryPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { id_delivery_order } = useParams();
  const { selectedProducts: initialSelectedProducts = [] } = state || {};
  const [orderDetails, setOrderDetails] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeliveryOrder = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${baseUrl}/nimda/delivery-order/${id_delivery_order}/detail`, {
          headers: { Authorization: `${token}` }
        });

        if (response.data.success) {
          const deliveryData = response.data.data.delivery_order;

          const purchaseResponse = await axios.get(`${baseUrl}/nimda/purchase/${deliveryData.selected_po_id}`, {
            headers: { Authorization: `${token}` }
          });
          const purchaseData = purchaseResponse.data.data;

          const pengajuanResponse = await axios.get(`${baseUrl}/nimda/pengajuan/${purchaseData.id_pengajuan}`, {
            headers: { Authorization: `${token}` }
          });
          const pengajuanData = pengajuanResponse.data.data;
          const selectedVendor = pengajuanData.tb_pengajuan_vendors[pengajuanData.selected];
          const pengajuanDetails = selectedVendor.tb_pengajuan_pilihans.reduce((acc, item) => {
            acc[item.product_id] = {
              price: parseFloat(item.price),
              discount: item.discount,
              taxable: item.taxable,
              ppn: parseFloat(item.ppn),
              quantity: item.quantity,
            };
            return acc;
          }, {});

          const mappedOrderDetails = {
            order_id: deliveryData.code_delivery_order || '61-DO-25-000067',
            created_date: new Date(deliveryData.delivery_date).toLocaleDateString('id-ID', {
              day: '2-digit', month: 'long', year: 'numeric'
            }) || '17 April 2025',
            nama_customer: deliveryData.nama_customer || 'SATE PADANG AJO RAMON',
            alamat_pengiriman: deliveryData.shipping_address || 'Jl. H. Baping No.100, RT.6/RW.9, Ciracas, Kec. Ciracas, Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta 13740',
            pengiriman: deliveryData.ship_via || 'Raja Cepat',
            biaya_ongkir: deliveryData.shipping_price || 0,
            pesan_customer: deliveryData.message || 'Pengiriman sesuai PO',
            selected_po_id: deliveryData.selected_po_id,
          };

          setOrderDetails(mappedOrderDetails);

          if (initialSelectedProducts.length > 0) {
            const filteredProducts = deliveryData.do_details
              .filter(detail =>
                initialSelectedProducts.some(selected => selected?.product_id === detail.product_id.toString())
              )
              .map(detail => {
                const selected = initialSelectedProducts.find(s => s?.product_id === detail.product_id.toString()) || {};
                const pengajuanItem = pengajuanDetails[detail.product_id] || {};
                const price = selected.rate ?? pengajuanItem.price ?? parseFloat(detail.product?.sell_price || 0);
                const discount = selected.discount ?? pengajuanItem.discount ?? 0;
                const qty = selected.qty ?? parseInt(detail.quantity) ?? 1;
                const taxable = pengajuanItem.taxable ?? false;
                const ppn = pengajuanItem.ppn ?? 0;
                const totalExclVat = qty * price * (1 - discount / 100);
                const amount = taxable ? totalExclVat * (1 + ppn / 100) : totalExclVat;
                return {
                  id: detail.product_id.toString(),
                  name: detail.product?.name || detail.description || 'Produk Tidak Diketahui',
                  description: detail.description || 'Tidak Ada Deskripsi',
                  qty,
                  price,
                  discount,
                  taxable,
                  ppn,
                  amount,
                  discount_type: 'Percent', // Default untuk menghindari peringatan
                };
              });

            setSelectedProducts(filteredProducts);
            console.log('selectedProducts after mapping:', filteredProducts);
          } else {
            setSelectedProducts([]);
            message.warning('Tidak ada produk yang dipilih untuk invoice.');
          }
        }
      } catch (error) {
        console.error('Error fetching delivery order:', error);
        message.error('Gagal mengambil data delivery order. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };

    if (id_delivery_order) {
      fetchDeliveryOrder();
    }
  }, [id_delivery_order, initialSelectedProducts]);

  const handleBack = () => {
    navigate(`/dashboard/delivery-order/detail/${id_delivery_order}`);
  };

  const handleCreateInvoice = () => {
    Modal.confirm({
      title: 'Apakah Anda yakin?',
      content: 'Apakah Anda yakin ingin membuat invoice untuk produk yang dipilih?',
      okText: 'OK',
      cancelText: 'Cancel',
      okButtonProps: { style: { backgroundColor: '#595959', borderColor: '#595959', color: '#fff' } },
      cancelButtonProps: { style: { borderColor: '#d9d9d9', color: '#595959' } },
      onOk: async () => {
        try {
          const payload = {
            id_do: parseInt(id_delivery_order),
          };

          console.log("Payload dikirim:", JSON.stringify(payload, null, 2));

          const token = localStorage.getItem('token');
          const response = await axios.post(
            '${baseUrl}/nimda/delivery-order/create-invoice',
            payload,
            {
              headers: {
                Authorization: token && token.startsWith('Bearer ') ? token : `${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log("Respons API:", JSON.stringify(response.data, null, 2));

          if (!response.data.success) {
            throw new Error(response.data.message || 'Gagal membuat invoice');
          }

          const id_invoice = response.data.data?.invoice?.id_invoice;
          if (!id_invoice) {
            throw new Error('ID Invoice tidak dikembalikan dari API');
          }

          Modal.success({
            title: "Berhasil",
            content: "Invoice telah berhasil dibuat. Anda akan diarahkan ke halaman detail invoice.",
            okButtonProps: { style: { backgroundColor: '#595959', borderColor: '#595959', color: '#fff' } },
            onOk: () => {
              navigate(`/dashboard/invoice/detail-invoice/${id_invoice}`);
            },
          });
        } catch (error) {
          console.error('Error membuat invoice:', error);
          Modal.error({
            title: 'Gagal',
            content: error.message || 'Terjadi kesalahan saat membuat invoice. Silakan coba lagi.',
            okButtonProps: { style: { backgroundColor: '#595959', borderColor: '#595959', color: '#fff' } },
          });
        }
      },
      onCancel: () => {
        console.log("Batal membuat invoice");
      },
    });
  };

  const columns = [
    {
      title: 'No',
      key: 'index',
      render: (_, __, index) => index + 1,
      width: '5%',
    },
    {
      title: 'Produk',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>,
      width: '25%',
    },
    {
      title: 'Deskripsi',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || 'Tidak Ada Deskripsi',
      width: '25%',
    },
    {
      title: 'Qty',
      dataIndex: 'qty',
      key: 'qty',
      render: (qty) => <span className="font-medium">{qty}</span>,
      width: '10%',
      align: 'center',
    },
    {
      title: 'Harga Satuan',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `Rp ${Number(price).toLocaleString('id-ID', { minimumFractionDigits: 2 })}`,
      width: '15%',
      align: 'right',
    },
    {
      title: 'Disc',
      dataIndex: 'discount',
      key: 'discount',
      render: (discount) => `${Number(discount).toLocaleString('id-ID')}%`,
      width: '10%',
      align: 'center',
    },
    {
      title: 'Jumlah',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `Rp ${Number(amount).toLocaleString('id-ID', { minimumFractionDigits: 2 })}`,
      width: '15%',
      align: 'right',
    },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!orderDetails || selectedProducts.length === 0) {
    return <div>Tidak ada produk terpilih atau data tidak tersedia.</div>;
  }

  const subtotal = selectedProducts.reduce((sum, item) => sum + Number(item.amount), 0);
  const shipping = Number(orderDetails.biaya_ongkir || 0);
  const total = subtotal + shipping;

  return (
    <div className="p-6 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <Title level={3}>Produk untuk Invoice</Title>
        <Space>
          <Button
            icon={<RollbackOutlined />}
            onClick={handleBack}
          >
            Kembali
          </Button>
          <Button
            style={{ backgroundColor: '#595959', borderColor: '#595959', color: '#fff' }}
            icon={<FileTextOutlined />}
            onClick={handleCreateInvoice}
          >
            Create Invoice
          </Button>
        </Space>
      </div>

      <Card className="mb-6">
        <Descriptions title="Informasi Order" bordered>
          <Descriptions.Item label="Order ID">{orderDetails.order_id}</Descriptions.Item>
          <Descriptions.Item label="Tanggal Order">{orderDetails.created_date}</Descriptions.Item>
          <Descriptions.Item label="Nama Customer">{orderDetails.nama_customer}</Descriptions.Item>
          <Descriptions.Item label="Alamat Pengiriman" span={3}>
            {orderDetails.alamat_pengiriman}
          </Descriptions.Item>
          <Descriptions.Item label="Pengiriman">
            {orderDetails.pengiriman}
          </Descriptions.Item>
          <Descriptions.Item label="Biaya Ongkir">
            Rp {shipping.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
          </Descriptions.Item>
          <Descriptions.Item label="Pesan Customer" span={2}>
            {orderDetails.pesan_customer}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Daftar Produk Terpilih">
        <Table
          columns={columns}
          dataSource={selectedProducts}
          rowKey="id"
          pagination={false}
          scroll={{ x: true }}
          locale={{ emptyText: 'Tidak ada produk terpilih' }}
        />

        <Divider />

        <div className="flex justify-end">
          <div className="w-full md:w-1/3 p-4">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <span className="text-gray-600">Subtotal :</span>
              <span className="text-right">Rp {subtotal.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <span className="text-gray-600">Biaya Pengiriman :</span>
              <span className="text-right">Rp {shipping.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
            </div>
            <Divider className="my-2" />
            <div className="grid grid-cols-2 gap-2 font-medium">
              <span className="text-gray-600">Total :</span>
              <span className="text-right">Rp {total.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SelectDeliveryPage;