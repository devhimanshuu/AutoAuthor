import React, { Component } from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProfileDropdown = ({
  isOpen,
  onToggle,
  avatar,
  Companyname,
  email,
  onLogout,
}) => {
  const navigate = useNavigate();
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center space-x-3 rounded-xl hover:bg-gray-50 transition-colors duration-200"
      >
        {avatar ? (
          <img
            src={avatar}
            alt="Avatar"
            className="h-9 w-9 rounded-xl object-cover"
          />
        ) : (
          <div className="h-8 w-8 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {Companyname.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="hidden sm:black text-left">
          <p className="text-sm font-medium text-gray-900">{Companyname}</p>
          <p className="text-xs text-gray-500">{email}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>
      {isOpen && (
        <div className="absolute border-gray-100 border py-2 z-50 right-0 mt-2 w-52 bg-white rounded-xl shadow-lg">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{Companyname}</p>
            <p className="text-xs text-gray-500">{email}</p>
          </div>
          <a
            href=""
            onClick={() => navigate("/profile")}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
          >
            {" "}
            View Profile
          </a>
          <div className="border-t border-gray-100">
            <a
              href=""
              onClick={onLogout}
              className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
            >
              Sign Out
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
