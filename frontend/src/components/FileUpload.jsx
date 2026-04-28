import React, { useState } from 'react';
import { Upload, X, FileVideo, ImageIcon } from 'lucide-react';

const FileUpload = ({ onFileSelect }) => {
    const [preview, setPreview] = useState(null);
    const [fileType, setFileType] = useState('');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileType(file.type);
            onFileSelect(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const clearFile = () => {
        setPreview(null);
        onFileSelect(null);
    };

    return (
        <div className="w-full">
            {!preview ? (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-12 h-12 text-gray-400 mb-3" />
                        <p className="mb-2 text-sm text-gray-500 font-semibold">Nhấn để tải lên hoặc kéo thả</p>
                        <p className="text-xs text-gray-400">Hình ảnh hoặc Video (MP4, PNG, JPG...)</p>
                    </div>
                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,video/*" />
                </label>
            ) : (
                <div className="relative w-full rounded-2xl overflow-hidden bg-black flex justify-center items-center h-80">
                    <button onClick={clearFile} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full z-10">
                        <X size={20} />
                    </button>
                    {fileType.includes('video') ? (
                        <video src={preview} controls className="h-full" />
                    ) : (
                        <img src={preview} alt="Preview" className="h-full object-contain" />
                    )}
                </div>
            )}
        </div>
    );
};

export default FileUpload;