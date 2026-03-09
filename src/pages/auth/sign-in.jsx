import React, { useState, useEffect, useRef } from "react";
import { Card, Input, Button, Typography } from "@material-tailwind/react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios"; // Use your custom axios instance if configured
import Swal from "sweetalert2";
import All from "../../assets/login/All.png";
import BG from "../../assets/login/Login.png";
import Logo from "../../assets/login/LogoJaja.png";
import Saller from "../../assets/login/shop.png";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Prevent multiple runs
    if (hasRedirected.current) return;
    hasRedirected.current = true;

    // If a valid token exists, go to dashboard; otherwise redirect to SSO
    const existingToken = localStorage.getItem("token");
    const expiry = localStorage.getItem("expiry");

    if (existingToken && expiry) {
      const isExpired = Date.now() > Number(expiry);
      if (!isExpired) {
        // valid token -> go to dashboard
        navigate("/dashboard/home");
        return;
      }
      // expired -> clear
      localStorage.clear();
    }

    // Build SSO URL and redirect
    const client = "jaja";
    const redirectUri = encodeURIComponent(`${window.location.origin}/nimda/sso-login`);
    const ssoUrl = `https://sso.eurekagroup.id/?redirect_uri=${redirectUri}&client=${client}`;
    try {
      window.location.replace(ssoUrl);
    } catch (err) {
      window.location.href = ssoUrl;
    }
  }, [navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(
        "https://apidev.jaja.id/nimda/user/login",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.status === 200) {
        // Store token and creation timestamp
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("tokenCreatedAt", Date.now().toString());
        Swal.fire({
          icon: "success",
          title: "Login Successful",
          text: "You have successfully logged in!",
          confirmButtonColor: "#438196", 
        }).then(() => {
          navigate("/dashboard/home");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: response.data.message,
        });
      }
    } catch (error) {
      console.error("There was an error logging in!", error);
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: "There was an error logging in!",
      });
    }
  };

  return (
    <section
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${BG})` }}
    >
      <div className="bg-white rounded-[3rem] m-10 p-5 flex gap-4">
        <div className="w-1/3 h-480 hidden lg:block">
          <img
            src={All}
            className="h-full w-full object-cover rounded-2xl"
            alt="All"
          />
        </div>
        <div className="w-full lg:w-3/5 mt-24">
          <div className="text-center">
            <div className="flex justify-center items-center mb-10">
              <img src={Logo} alt="Logo" className="w-52 h-28" />
            </div>
          </div>
          <form
            className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg lg:w-1/2"
            onSubmit={handleLogin}
          >
            <div className="mb-1 flex flex-col gap-6">
              <div className="relative mb-3">
                <input
                  type="text"
                  className="peer block w-full min-h-[auto] rounded bg-transparent px-3 py-[0.32rem] leading-[2.15] outline-none transition-all duration-200 ease-linear focus:placeholder-opacity-100 peer-focus:text-primary placeholder-opacity-0 motion-reduce:transition-none dark:text-white dark:placeholder:text-neutral-300 dark:autofill:shadow-autofill dark:peer-focus:text-primary border border-[#438196]"
                  id="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <label
                  htmlFor="email"
                  className="text-lg font-semibold bg-white pointer-events-none absolute left-3 top-[-3px] mb-0 max-w-[90%] truncate origin-[0_0] pt-[0.37rem] leading-[2.15] text-neutral-500 transition-all duration-200 ease-out peer-focus:-translate-y-[1.15rem] peer-focus:scale-[0.8] peer-focus:text-primary dark:text-neutral-400 dark:peer-focus:text-primary -translate-y-[1.15rem] scale-[0.8]"
                >
                  Email
                </label>
              </div>
              <div className="relative mb-3">
                <input
                  type="password"
                  className="peer block w-full min-h-[auto] rounded bg-transparent px-3 py-[0.32rem] leading-[2.15] outline-none transition-all duration-200 ease-linear focus:placeholder-opacity-100 peer-focus:text-primary placeholder-opacity-0 motion-reduce:transition-none dark:text-white dark:placeholder:text-neutral-300 dark:autofill:shadow-autofill dark:peer-focus:text-primary border border-[#438196]"
                  id="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <label
                  htmlFor="password"
                  className="text-lg font-semibold bg-white pointer-events-none absolute left-3 top-[-3px] mb-0 max-w-[90%] truncate origin-[0_0] pt-[0.37rem] leading-[2.15] text-neutral-500 transition-all duration-200 ease-out peer-focus:-translate-y-[1.15rem] peer-focus:scale-[0.8] peer-focus:text-primary dark:text-neutral-400 dark:peer-focus:text-primary -translate-y-[1.15rem] scale-[0.8]"
                >
                  Password
                </label>
              </div>
            </div>
            <Button type="submit" className="mt-6 bg-[#438196] h-12" fullWidth>
              Login
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

export default SignIn;