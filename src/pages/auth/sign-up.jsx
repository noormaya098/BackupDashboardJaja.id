import {
  Card,
  Input,
  Checkbox,
  Button,
  Typography,
} from "@material-tailwind/react";
import { Link } from "react-router-dom";
import All from "../../assets/login/All.png"
import BG from "../../assets/login/Login.png"
import Logo from "../../assets/login/LogoJaja.png"
import Saller from "../../assets/login/shop.png"


export function SignUp() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: `url(${BG})` }}>
      
    <div className="bg-white rounded-[3rem] m-10 p-5 flex gap-4">
    <div className="w-2/5 h-full hidden lg:block">
      <img
        src={All}
        className="h-full w-full object-cover rounded-3xl"
      />
    </div>
    <div className="w-full lg:w-3/5 mt-24">
      <div className="text-center">
        <div className="flex justify-center items-center mb-10">
          <img src={Logo} alt="" className="w-52 h-28" />
        </div>
        <div className=" text-[#6A6A6A] mb-4 text-xl">Welcome to</div>
        <div className="flex justify-center items-center space-x-6">
          <img src={Saller} alt="" className="w-10 h-8"/> <span>
            <i className="font-bold text-3xl">Saller</i> <i className="text-3xl ">Center</i>
          </span>
        </div>
      </div>
     
      <form className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg lg:w-1/2">
        <div className="mb-1 flex flex-col gap-6">
        <div className="relative mb-6">
          <input
            type="text"
            className="peer block w-full min-h-[auto] rounded bg-transparent px-3 py-[0.32rem] leading-[2.15] outline-none transition-all duration-200 ease-linear focus:placeholder-opacity-100 peer-focus:text-primary placeholder-opacity-0 motion-reduce:transition-none dark:text-white dark:placeholder:text-neutral-300 dark:autofill:shadow-autofill dark:peer-focus:text-primary border border-[#438196]"
            id="exampleFormControlInput2"
            placeholder="Email"
          />
          <label
            htmlFor="exampleFormControlInput2"
            className="text-lg font-semibold bg-white pointer-events-none absolute left-3 top-[-3px] mb-0 max-w-[90%] truncate origin-[0_0] pt-[0.37rem] leading-[2.15] text-neutral-500 transition-all duration-200 ease-out peer-focus:-translate-y-[1.15rem] peer-focus:scale-[0.8] peer-focus:text-primary dark:text-neutral-400 dark:peer-focus:text-primary -translate-y-[1.15rem] scale-[0.8]"
          >
            Email
          </label>
        </div>   
        <div className="relative mb-8">
          <input
            type="text"
            className="peer block w-full min-h-[auto] rounded bg-transparent px-3 py-[0.32rem] leading-[2.15] outline-none transition-all duration-200 ease-linear focus:placeholder-opacity-100 peer-focus:text-primary placeholder-opacity-0 motion-reduce:transition-none dark:text-white dark:placeholder:text-neutral-300 dark:autofill:shadow-autofill dark:peer-focus:text-primary border border-[#438196]"
            id="exampleFormControlInput2"
            placeholder="Password"
          />
          <label
            htmlFor="exampleFormControlInput2"
            className="text-lg font-semibold bg-white pointer-events-none absolute left-3 top-[-3px] mb-0 max-w-[90%] truncate origin-[0_0] pt-[0.37rem] leading-[2.15] text-neutral-500 transition-all duration-200 ease-out peer-focus:-translate-y-[1.15rem] peer-focus:scale-[0.8] peer-focus:text-primary dark:text-neutral-400 dark:peer-focus:text-primary -translate-y-[1.15rem] scale-[0.8]"
          >
            Password
          </label>
        </div>   

        
        </div>
        
        <Button className="mt-6 bg-[#438196] h-12" fullWidth >
          Login
        </Button>
        <Button className="mt-6 bg-transparent border border-[#FDB739] text-[#FDB739] h-12" fullWidth >
          Login Via Google
        </Button>
        

        <div className="flex justify-center items-center mt-8">
              <div className="text-center w-[17rem] text-[#BEBEBE]">
                  Copyright © 2024 All Right Reserved Jaja ID.
              </div>
        </div>
      </form>

    </div>
    </div>

  </section>
  );
}

export default SignUp;
