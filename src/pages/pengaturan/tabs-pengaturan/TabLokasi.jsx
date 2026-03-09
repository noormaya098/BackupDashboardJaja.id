import { PencilIcon } from '@heroicons/react/24/solid'
import { Button, Modal } from 'antd'
import React, { useState } from 'react'
import EditdanDetailLokasi from './EditdanDetailLokasi';

function TabLokasi() {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <div className='mt-10'>
      <h1 className='text-xl font-semibold'>
          Lokasi Toko
      </h1>
      <br />
      <hr />
      <br />

      <div className='w-full sm:flex space-x-4'>
        {/* Akun */}
        <div className='bg-[#f3f4f7] rounded-md border border-[#e2e7f1] sm:w-1/3 w-full'>
          <div className='p-4'>
            <p className='text-lg font-bold text-[#4b4b5a]'>
              ZATATECH
            </p>
            <div className='mt-4 text-base text-[#6c757d]'>
              Email :
              <p>
                naxxthathink@gmail.com
              </p>
            </div>
            <div className='mt-4 text-base text-[#6c757d]'>
              Telepon :
              <p>
                085770144727
              </p>
            </div>
          </div>
        </div>

        {/* Alamat */}
        <div className='bg-[#f3f4f7] rounded-md border border-[#e2e7f1] w-full '>
          <div className='p-4'>
            <div className='flex w-full'>
              <div className='w-1/2  text-base text-[#6c757d]'>
                Alamat
              </div>
              <div className='w-1/2 flex justify-end items-end'>
                <Button onClick={showModal} className='bg-[#d7d9dc] border border-[#aaaaaa]'>
                  <PencilIcon className='w-4 h-4' /> Edit
                </Button>
              </div>
              
            </div>
            <div className='mt-4  text-base text-[#6c757d]'>
                J***. Puri harapan jaya
              </div>
              <div className='mt-8  text-base text-[#6c757d] flex w-full'>
                  <div className='w-1/4'>
                    Provinsi :
                    <p>
                      Prov. Jawa Barat
                    </p>
                  </div>
                  <div className='w-1/4'>
                    Kota/Kabupaten :
                    <p>
                    Kab. Bekasi
                    </p>
                  </div>
                  <div className='w-1/4'>
                    Kecamatan :
                    <p>
                    Tarumajaya
                    </p>
                  </div>
                  <div className='w-1/4'>
                    Kelurahan :
                    <p>
                    Setia Asih
                    </p>
                  </div>
                  <div className='w-1/4'>
                    Kode Pos :
                    <p>
                    17215
                    </p>
                  </div>
              </div>
          </div>
        </div>
       
      </div>
      

      {/* Modal Edit */}
      <Modal
        width={1000}
        centered
        title={
        [
          <div className='text-2xl p-3'>
            Ubah Alamat Toko : ZATATECH
            <hr className='mt-8 ' />
          </div>
        ]
        }
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Save"
        footer={false}
        cancelText="Cancel"
      >
        <div className='p-3'>
          <EditdanDetailLokasi/>
        </div>
      </Modal>
    </div>
  )
}

export default TabLokasi
