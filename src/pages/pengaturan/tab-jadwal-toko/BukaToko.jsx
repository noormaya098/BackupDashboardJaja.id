import { Card, CardBody } from '@material-tailwind/react'
import { Alert, Button, DatePicker, Select, Tag, TimePicker } from 'antd'
import React, { useState } from 'react'

const { Option } = Select;

function BukaToko() {
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const [selectedDays, setSelectedDays] = useState(
        days.reduce((acc, day) => {
          acc[day] = true;
          return acc;
        }, {})
      );
    
      const handleButtonClick = (day) => {
        setSelectedDays((prevSelectedDays) => ({
          ...prevSelectedDays,
          [day]: !prevSelectedDays[day],
        }));
      };
    
    
    

  return (
    <div className='p-4 mt-4'>
      <h1 className='text-lg font-bold text-[#6c757d]'>
        Atur jadwal toko kamu
      </h1>
      <p className='text-base text-[#7f8488]'>
        Tentukan hari dan jam berapa tokomu bisa melayani pembeli. Kamu masih bisa menerima pesanan dari pembeli meskipun telah melewati jadwal buka tokomu.
      </p>
      <br />

      <div >
        <Alert className='p-5 text-base' message={
            [
                <div className='text-[#7f8488]'>
                    Toko akan dianggap buka 7 hari 24 jam jika kamu tidak mengubah jadwal hari dan jam buka-tutup toko.
                </div>
            ]
        } type="info" showIcon />
      </div>

      <br />
      <Card className='border border-solid shadow-lg'>
        <CardBody>
            <div>
                <Tag color='#43d39e' className='text-base'>
                    Terjadwal
                </Tag>
            </div>

            <br />
            <div className='w-full flex space-x-10'>
                <div className='w-1/2'>
                <label className='text-base'>Pilih hari</label>
                <div className="mt-5 w-full flex flex-wrap space-x-2">
                        {days.map((day) => (
                            <Button
                            key={day}
                            onClick={() => handleButtonClick(day)}
                            className={`border-none text-base font-semibold m-1 h-10 flex-grow ${
                                selectedDays[day] ? 'bg-[#64bddd] text-white' : 'bg-[#e3e3e3] text-[#6c757d]'
                            }`}
                            >
                            {day}
                            </Button>
                        ))}
                    </div>
                </div>


                <div className='w-1/2'>
                        <div className='w-full flex space-x-4'>
                            <div className='w-1/3'>
                                <div>
                                    <label className='text-lg font-semibold text-[#6c757d]'>Jam Buka</label>
                                </div>
                                <br />
                                <TimePicker 
                                className='w-full h-10'
                                showTimeSelect
                                showTimeSelectOnly
                                timeIntervals={15}
                                timeCaption="Time"
                                dateFormat="h:mm aa" />
                            </div>

                            {/*  */}
                            <div className='w-1/3'>
                                <div>
                                    <label className='text-lg font-semibold text-[#6c757d]'>Jam Tutup</label>
                                </div>
                                <br />
                                <TimePicker 
                                className='w-full h-10'
                                showTimeSelect
                                showTimeSelectOnly
                                timeIntervals={15}
                                timeCaption="Time"
                                dateFormat="h:mm aa" />
                            </div>
                            
                            {/*  */}
                            <div className='w-1/3'>
                                <div>
                                    <label className='text-lg font-semibold text-[#6c757d]'>Zona Waktu</label>
                                </div>
                                <br />
                                <Select
                                    showSearch
                                    className="w-full  h-10"
                                    placeholder="Pilih Waktu"
                                    filterOption={(input, option) =>
                                        option.children.toLowerCase().includes(input.toLowerCase())
                                    }
                                        filterSort={(optionA, optionB) =>
                                        optionA.children.toLowerCase().localeCompare(optionB.children.toLowerCase())
                                        }
                                        >
                                        <Option value="WIB">WIB</Option>
                                        <Option value="WITA">WITA</Option>
                                        <Option value="WIT">WIT</Option>
                                </Select>
                            </div>
                        </div>
                </div>
            </div>
        </CardBody>
      </Card>
      <br />
      <div className='w-full flex space-x-2 justify-end'>
          <Button  className='bg-red-400 text-white text-lg h-10'>
            Reset
          </Button>
          <Button className='bg-blue-400 text-white text-lg h-10'>
            Simpan
          </Button>
        </div>
    </div>
  )
}

export default BukaToko
