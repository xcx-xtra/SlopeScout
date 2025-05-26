import React from "react";

const LoadingSpinner = ({
  size = "w-8 h-8",
  color = "border-blue-500",
  text = null,
}) => {
  return (
    <div className={`flex flex-col justify-center items-center my-4`}>
      <div
        className={`animate-spin rounded-full ${size} border-t-2 border-b-2 ${color}`}
      ></div>
      {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
