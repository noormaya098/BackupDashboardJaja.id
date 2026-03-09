import { Button, Input, Select } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import React from 'react'

const { Option } = Select;

function EditdanDetailLokasi() {
  return (
    <div>
      {/*  */}
      <div className='flex w-full space-x-5'>
           <div className='w-1/4 flex item items-center'>
                <label className='mb-2 text-lg'>Provinsi <span className='text-red-500'>*</span></label>
           </div>
           <div className='w-full'>
                <Select
                showSearch
                className="w-full mt-2 h-10"
                placeholder="Pilih Provinsi"
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

      {/*  */}
      <br />
      <div className='flex w-full space-x-5'>
           <div className='w-1/4 flex item items-center'>
                <label className='mb-2 text-lg'>Kota/Kabupaten <span className='text-red-500'>*</span></label>
           </div>
           <div className='w-full'>
                <Select
                showSearch
                className="w-full mt-2 h-10"
                placeholder="Pilih Kota/Kabupaten"
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


      {/*  */}
      <br />
      <div className='flex w-full space-x-5'>
           <div className='w-1/4 flex item items-center'>
                <label className='mb-2 text-lg'>Kecamatan <span className='text-red-500'>*</span></label>
           </div>
           <div className='w-full'>
                <Select
                showSearch
                className="w-full mt-2 h-10"
                placeholder="Pilih Kecamatan"
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


      {/*  */}
      <br />
      <div className='flex w-full space-x-5'>
           <div className='w-1/4 flex item items-center'>
                <label className='mb-2 text-lg'>Kelurahan <span className='text-red-500'>*</span></label>
           </div>
           <div className='w-full'>
                <Select
                showSearch
                className="w-full mt-2 h-10"
                placeholder="Pilih Kelurahan"
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

      {/*  */}
      <br />
      <div className='flex w-full space-x-5 mt-2'>
           <div className='w-1/4 flex item items-center'>
                <label className='mb-2 text-lg'>Kode Pos <span className='text-red-500'>*</span></label>
           </div>
           <div className='w-full'>
                <Input placeholder='17215' className='h-10 w-full'/>
           </div>
      </div>


      {/*  */}
      <br />
      <div className='flex w-full space-x-5 mt-2'>
           <div className='w-1/4 flex item items-center'>
                <label className='mb-2 text-lg'>Alamat Toko <span className='text-red-500'>*</span></label>
           </div>
           <div className='w-full'>
                <TextArea placeholder='J***. Puri harapan jaya' className='h-10 w-full'/>
           </div>
      </div>


      <br />
      <div className='w-full flex justify-end items-end'>
        <Button className='bg-blue-500 text-white h-10 text-lg'>
          Simpan
        </Button>
      </div>
    </div>
  )
}

export default EditdanDetailLokasi
