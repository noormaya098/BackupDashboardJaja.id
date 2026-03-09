import React, { useState, useRef } from 'react';
import {
  Card,
  Input,
  Checkbox,
  Button,
  Typography,
} from "@material-tailwind/react";
import { Link } from "react-router-dom";
import All from "../../assets/login/All.png";
import BG from "../../assets/login/Login.png";
import Logo from "../../assets/login/LogoJaja.png";
import Saller from "../../assets/login/shop.png";
import SuccessIcon from "../../assets/login/Success.gif"; // Misalkan Anda memiliki ikon sukses

function ForgotPassword() {
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [otp, setOtp] = useState(new Array(6).fill(""));

  const refs = useRef([]);

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus on next input
    if (element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleSubmitEmail = (event) => {
    event.preventDefault();
    // Logika untuk memverifikasi email dan mengirim OTP
    // Jika berhasil, set emailSubmitted menjadi true
    setEmailSubmitted(true);
  };

  const handleSubmitOTP = (event) => {
    event.preventDefault();
    // Concatenate the OTP values
    const otpValue = otp.join("");
    console.log(otpValue); // For demonstration
    // Logika untuk memverifikasi OTP dan mengganti password
    // Jika berhasil, set passwordChanged menjadi true
    setPasswordChanged(true);
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: `url(${BG})` }}>
      <div className="bg-white rounded-[3rem] m-10 p-5 flex gap-4">
        <div className="w-2/5 h-full hidden lg:block">
          <img src={All} className="h-full w-full object-cover rounded-3xl" alt="Background" />
        </div>
        <div className="w-full lg:w-3/5 mt-24">
          <div className="text-center">
            <div className="flex justify-center items-center mb-10">
              <img src={Logo} alt="Logo" className="w-52 h-28" />
            </div>
            {passwordChanged ? (
              <div className="text-center">
                <div className="flex justify-center items-center mb-10">
                  <img src={SuccessIcon} alt="Success" className="w-36 h-36 mt-10" />
                </div>
                <div className="text-xl text-[#5DBA46] font-bold mb-10 pt-10">Password anda berhasil diubah</div>
                <div className='w-full flex justify-center items-center'>
                  <Button type="submit" className="mt-6 bg-[#438196] h-12 mb-10 w-[50%]" fullWidth>
                    Ubah Password
                  </Button>
                </div>
                <div className="flex justify-center items-center">
                  <div className="text-center w-[17rem] text-[#BEBEBE]">
                    Copyright © 2024 All Right Reserved Jaja ID.
                  </div>
                </div>
              </div>
            ) : emailSubmitted ? (
              <form className="mt-8 mb-9 mx-auto w-80 max-w-screen-lg lg:w-1/2" onSubmit={handleSubmitOTP}>
                <div className="text-[#6A6A6A] mb-2 text-xl">Welcome to</div>
                <div className="flex justify-center items-center space-x-2">
                  <img src={Forgot} alt="Forgot" className="w-12 h-12 mt-2" />
                  <span>
                    <i className="font-bold text-3xl">Lupa</i>
                    <i className="text-3xl"> Password</i>
                  </span>
                </div>
                <br />
                <div className='text-base text-[#A4A4A4] text-start mb-2 mt-10'>
                    Masukkan Kode OTP, yang dikirim via email
                </div>
                <div className="mb-1 flex justify-between">
                  {otp.map((data, index) => {
                    return (
                      <input
                        key={index}
                        type="text"
                        maxLength="1"
                        className="otp-input peer block w-12 h-16 rounded bg-transparent text-center px-3 py-[0.32rem] leading-[2.15] outline-none transition-all duration-200 ease-linear focus:placeholder-opacity-100 peer-focus:text-primary placeholder-opacity-0 motion-reduce:transition-none dark:text-white dark:placeholder:text-neutral-300 dark:autofill:shadow-autofill dark:peer-focus:text-primary border border-[#438196]"
                        value={data}
                        onChange={(e) => handleOtpChange(e.target, index)}
                        ref={el => refs.current[index] = el}
                      />
                    );
                  })}
                </div>
                <br />
                <Button type="submit" className="mt-6 bg-[#438196] h-12" fullWidth>
                  Verifikasi OTP
                </Button>
                <div className="flex justify-center items-center mt-6">
                  <div className="text-center w-[17rem] text-[#BEBEBE]">
                    Copyright © 2024 All Right Reserved Jaja ID.
                  </div>
                </div>
              </form>
            ) : (
              <>
                <div className="text-[#6A6A6A] mb-2 text-xl">Welcome to</div>
                <div className="flex justify-center items-center space-x-2">
                  <img src={Forgot} alt="Forgot" className="w-12 h-12 mt-2" />
                  <span>
                    <i className="font-bold text-3xl">Lupa</i>
                    <i className="text-3xl"> Password</i>
                  </span>
                </div>
                <br />
                <form className="mt-8 mb-9 mx-auto w-80 max-w-screen-lg lg:w-1/2" onSubmit={handleSubmitEmail}>
                  <div className="mb-1 flex flex-col gap-6">
                    <div className="relative mb-8">
                      <input
                        type="email"
                        className="peer block w-full min-h-[auto] rounded bg-transparent px-3 py-[0.32rem] leading-[2.15] outline-none transition-all duration-200 ease-linear focus:placeholder-opacity-100 peer-focus:text-primary placeholder-opacity-0 motion-reduce:transition-none dark:text-white dark:placeholder:text-neutral-300 dark:autofill:shadow-autofill dark:peer-focus:text-primary border border-[#438196]"
                        id="email"
                        placeholder="Masukkan email akun anda"
                      />
                      <label
                        htmlFor="email"
                        className="text-lg font-semibold bg-white pointer-events-none absolute left-3 top-[-3px] mb-0 max-w-[90%] truncate origin-[0_0] pt-[0.37rem] leading-[2.15] text-neutral-500 transition-all duration-200 ease-out peer-focus:-translate-y-[1.15rem] peer-focus:scale-[0.8] peer-focus:text-primary dark:text-neutral-400 dark:peer-focus:text-primary -translate-y-[1.15rem] scale-[0.8]"
                      >
                        Email
                      </label>
                      <div className="w-full flex justify-end items-end">
                        <div className='text-[#757575] font-semibold mt-2'>
                          Sudah punya akun? <span className='ml-1 text-[#FDB739] font-semibold cursor-pointer'><Link to="/auth/sign-in" className=" ml-1">Masuk</Link></span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button type="submit" className="mt-6 bg-[#438196] h-12" fullWidth>
                    Kirim OTP
                  </Button>
                  <Button className="mt-6 mb-8 bg-transparent border border-[#FDB739] text-[#FDB739] h-12" fullWidth>
                    Login Via Google
                  </Button>
                  <div className="flex justify-center items-center">
                    <div className="text-center w-[17rem] text-[#BEBEBE]">
                      Copyright © 2024 All Right Reserved Jaja ID.
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ForgotPassword;
