import { Card, CardBody } from '@material-tailwind/react'
import { Button, DatePicker } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import React from 'react'

function LiburToko() {
  return (
    <div className='p-4 mt-4'>
       <Card className='border border-solid shadow-lg'>
          <CardBody>
              <h1 className='text-xl font-bold text-[#6c757d]'>
              Atur jadwal libur toko
              </h1>
              <br />
              <hr />
              <br />


              <div className='w-full flex space-x-5'>
                <div className='w-1/4'>
                   <label className='text-lg text-[#6c757d] font-semibold'> Mulai Tanggal </label>
                   <DatePicker className='w-full h-10 mt-2 '/>
                </div>
                <div className='w-1/4'>
                   <label className='text-lg text-[#6c757d] font-semibold'> Berakhir Tanggal </label>
                   <DatePicker className='w-full h-10 mt-2 '/>
                </div>
              </div>

              <br />
              <div className='w-full '>
                <label className='text-lg text-[#6c757d] font-semibold'>Catatan :</label>
                <TextArea showCount maxLength={100} className='w-full mt-2'  />
              </div>

            
              <div className='w-full flex space-x-2 justify-end pt-12'>
                <Button className='bg-blue-400 text-white text-lg h-10 '>
                  Simpan
                </Button>
              </div>
          </CardBody>
       </Card>

    </div>
  )
}

export default LiburToko
