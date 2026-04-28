import React from 'react';

const Loading = () => {
    return (
        <div className="flex flex-col items-center justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
            <p className="mt-4 text-gray-600 font-medium animate-pulse">Đang phân tích đặc trưng hình ảnh...</p>
        </div>
    );
};

export default Loading;