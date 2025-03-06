import React, { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { FaUser, FaLock, FaEnvelope, FaMobileAlt,FaChevronDown} from "react-icons/fa";
import { motion } from "framer-motion";
import toast, { Toaster } from 'react-hot-toast';
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";


const CurrencySelector = ({ selectedCurrency, setSelectedCurrency }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currencies = [
    { name: "BDT", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQlLX94-uTEPQwlm7l69MF-P72nXIEhTmDmA&s" },
  ];

  return (
    <div className="relative">
      <div 
        className="flex justify-between items-center border rounded-md p-3 cursor-pointer bg-white"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <div className="flex items-center">
          {selectedCurrency ? (
            <>
              <img 
                src={currencies.find(currency => currency.name === selectedCurrency)?.image} 
                alt={selectedCurrency} 
                className="w-6 h-6" 
              />
              <span className="ml-2 text-gray-700">{selectedCurrency}</span>
            </>
          ) : (
            <span className="text-gray-500">Select a currency</span>
          )}
        </div>
        <FaChevronDown className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
      </div>

      {dropdownOpen && (
        <div className="absolute w-full mt-1 shadow-lg bg-white rounded-md border border-[#eee] z-10 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          {currencies.map((currency) => (
            <div
              key={currency.name}
              className="flex items-center p-3 cursor-pointer hover:bg-gray-100"
              onClick={() => {
                setSelectedCurrency(currency.name);
                setDropdownOpen(false);
              }}
            >
              <img src={currency.image} alt={currency.name} className="w-6 h-6" />
              <span className="ml-2 text-gray-700">{currency.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


const AuthModal = ({ isOpen, onClose }) => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [activeTab, setActiveTab] = useState("signin");
  const navigate=useNavigate();
  const [loadingSignIn, setLoadingSignIn] = useState(false);
  const [loadingSignUp, setLoadingSignUp] = useState(false);
   const [warning_message,set_warningmessage]=useState("");
   const [success_message,set_success_message]=useState("");
   
  const [signinData, setSigninData] = useState({
    email: "",
    password: "",
  });
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    currency:"BDT"
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Clear form fields when tab changes
    if (activeTab === "signin") {
      setSignupData({ name: "", email: "", password: ""});
    } else {
      setSigninData({ email: "", password: "" });
    }
  }, [activeTab]);

  if (!isOpen) return null;

  const validateSignIn = () => {
    let newErrors = {};

    if (!signinData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signinData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!signinData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (signinData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignUp = () => {
    let newErrors = {};

    if (!signupData.name.trim()) newErrors.name = "Full Name is required";

    if (!signupData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!signupData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (signupData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    if (activeTab === "signin") {
      setSigninData({ ...signinData, [e.target.name]: e.target.value });
    } else {
      setSignupData({ ...signupData, [e.target.name]: e.target.value });
    }
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    if (!validateSignIn()) return;

    setLoadingSignIn(true);
    axios.post(`${base_url}/auth/login`, signinData)
        .then((response) => {
            console.log(response);
            if (!response.data.success) {
                toast.error(response.data.message, "error");
            set_success_message(response.data.message)
                return;
            }

            const { message, jwtToken, user } = response.data;
            toast.success(message, "success");
            localStorage.setItem("token", jwtToken);
            localStorage.setItem("user", JSON.stringify(user));

            setTimeout(() => {
                window.location.href = "/";
            }, 2000);

            onClose();
        })
        .catch((error) => {
            console.log(error);
            toast.error(error.response?.data?.message || "Something went wrong", "error");
        })
        .finally(() => setLoadingSignIn(false)); // Stop loading
};


const handleSignUp = (e) => {
  e.preventDefault();
  if (!validateSignUp()) return;

  setLoadingSignUp(true);
  axios.post(`${base_url}/auth/signup`, signupData)
      .then((response) => {
          console.log(response.data);
          if (response.data.success) {
              toast.success("Sign Up Successful!", "success");
              setActiveTab("signin");
              set_warningmessage("")
          }else{
            set_warningmessage(response.data.message)
            toast.error(response.data.message);
          }
      })
      .catch((error) => {
          Swal.fire("Error", error.response?.data?.message || "Something went wrong", "error");
          console.log(error);
      })
      .finally(() => setLoadingSignUp(false)); // Stop loading
};


  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[1000]">
      <div className="bg-white w-[95%] md:w-[85%] lg:w-[70%] xl:w-[40%] 2xl:w-[30%] rounded-lg shadow-lg p-6 relative ">
        <button className="absolute top-4 right-4 text-gray-600 hover:text-gray-900" onClick={onClose}>
          <IoClose size={24} />
        </button>
            {/* ----------signup and login form */}
        <h2 className="text-2xl font-semibold text-center text-gray-800">Hey, Welcome Back</h2>
        <p className="text-gray-500 text-center mb-4">Enter your credentials to access your account</p>
        <Toaster
  position="bottom-center"
  toastOptions={{
    style: {
      bottom: '20px',
    },
  }}
/>
        <div className="flex justify-center gap-6 border-b pb-2">
          <button
            className={`pb-2 text-lg font-medium ${
              activeTab === "signin" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("signin")}
          >
            Sign In
          </button>
          <button
            className={`pb-2 text-lg font-medium ${
              activeTab === "signup" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("signup")}
          >
            Sign Up
          </button>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: activeTab === "signin" ? -50 : 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4"
        >
          {activeTab === "signin" ? (
            <form className="space-y-4" onSubmit={handleSignIn}>
                 {
                success_message=="" ? "":<p className="w-full px-[15px] py-[10px] border-[1px] border-red-300 bg-red-100 text-red-500 rounded-[5px]">{success_message}</p>
              }
              <div className="flex items-center border rounded-md p-3">
                <FaEnvelope className="text-gray-500 mr-3" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  className="w-full outline-none text-gray-700"
                  value={signinData.email}
                  onChange={handleChange}
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

              <div className="flex items-center border rounded-md p-3">
                <FaLock className="text-gray-500 mr-3" />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="w-full outline-none text-gray-700"
                  value={signinData.password}
                  onChange={handleChange}
                />
              </div>
              {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}

   {/* Sign In Button */}
<button 
  type="submit" 
  className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition flex items-center justify-center"
  disabled={loadingSignIn}
>
  {loadingSignIn ? (
    <span className="flex items-center">
      <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      Logging In...
    </span>
  ) : "Log In"}
</button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleSignUp}>
              {
                warning_message=="" ? "":<p className="w-full px-[15px] py-[10px] border-[1px] border-red-300 bg-red-100 text-red-500 rounded-[5px]">{warning_message}</p>
              }
            
            <div className="flex items-center border rounded-md p-3">
              <FaUser className="text-gray-500 mr-3" />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                className="w-full outline-none text-gray-700"
                value={signupData.name}
                onChange={handleChange}
              />
            </div>
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
      
            <div className="flex items-center border rounded-md p-3">
              <FaEnvelope className="text-gray-500 mr-3" />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                className="w-full outline-none text-gray-700"
                value={signupData.email}
                onChange={handleChange}
              />
            </div>
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
      
            <div className="flex items-center border rounded-md p-3">
              <FaLock className="text-gray-500 mr-3" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="w-full outline-none text-gray-700"
                value={signupData.password}
                onChange={handleChange}
              />
            </div>
            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
      
            <CurrencySelector
              selectedCurrency={signupData.currency}
              setSelectedCurrency={(currency) => setSignupData({ ...signupData, currency })}
            />
      
         {/* Sign Up Button */}
<button 
  type="submit" 
  className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition flex items-center justify-center"
  disabled={loadingSignUp}
>
  {loadingSignUp ? (
    <span className="flex items-center">
      <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      Signing Up...
    </span>
  ) : "Sign Up"}
</button>
          </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthModal;
