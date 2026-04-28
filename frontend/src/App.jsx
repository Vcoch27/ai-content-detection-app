import React, { useState } from 'react';
import Navbar from './components/Navbar';
import FileUpload from './components/FileUpload';
import ResultCard from './components/ResultCard';
import Loading from './components/Loading';
import { LayoutGrid, Binary, Layers3, Activity } from 'lucide-react';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleDetect = () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setResult(null);

    // GIẢ LẬP GỌI API (Sau này sẽ thay bằng axios gọi Spring Boot)
    setTimeout(() => {
      setIsLoading(false);
      setResult({
        prediction: Math.random() > 0.6 ? 1 : 0,
        confidence: 82 + Math.random() * 14
      });
    }, 2800);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased text-gray-900">
      <Navbar />

      <main className="max-w-[1500px] mx-auto py-10 px-6 lg:px-10 grid lg:grid-cols-[380px_1fr] gap-10 items-start">

        {/* CỘT TRÁI: ĐIỀU KHIỂN & TRẠNG THÁI */}
        <aside className="lg:sticky lg:top-28 space-y-8">
          <div className="p-8 bg-white rounded-3xl shadow-xl border border-gray-100">
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2.5">
              <Activity className="text-blue-500" size={24} />
              Trung tâm điều khiển
            </h2>

            <p className="text-gray-600 mb-6 text-sm">
              Tải lên một hình ảnh hoặc video để hệ thống Computer Vision phân tích các đặc trưng tần số (FFT) và kết cấu (GLCM) nhằm phát hiện dấu vết của Generative AI.
            </p>

            <button
              onClick={handleDetect}
              disabled={!selectedFile || isLoading}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2.5 group ${!selectedFile || isLoading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Đang phân tích...</span>
                </>
              ) : (
                <>
                  <Binary size={22} />
                  <span>BẮT ĐẦU KIỂM ĐỊNH</span>
                </>
              )}
            </button>
            <div className="mt-4 text-xs text-gray-400 text-center">Yêu cầu: File &lt; 50MB (Đề tài đồ án)</div>
          </div>

          {/* Panel thông số CV (Mẹo để giao diện pro) */}
          <div className="p-6 bg-gray-950 rounded-3xl text-gray-200 shadow-2xl shadow-gray-200/50">
            <h4 className="font-semibold text-gray-400 mb-4 flex items-center gap-2 text-sm">
              <Layers3 size={16} /> CV Pipeline Status
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Mô hình:</span>
                <span className="font-medium text-white">Classic ML (GLCM + FFT)</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Backend:</span>
                <span className="font-medium text-blue-400">Spring Boot + Python</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Video Processing:</span>
                <span className="font-medium text-green-400">OpenCV Ready</span>
              </div>
            </div>
          </div>
        </aside>

        {/* CỘT PHẢI: HIỂN THỊ CHÍNH (UPLOADER & RESULT) */}
        <section className="space-y-10">
          <div className="text-left">
            <h1 className="text-4xl font-extrabold text-gray-950 tracking-tighter">Verifier Suite <span className="text-blue-600">v1.0</span></h1>
            <p className="text-gray-500 mt-1.5 text-lg">Phòng thí nghiệm Computer Vision - MSSV: 220xxxxx.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
            <FileUpload
              onFileSelect={(file) => {
                setSelectedFile(file);
                setFileType(file ? file.type : '');
                setResult(null); // Reset kết quả khi chọn file mới
              }}
            />

            {isLoading && (
              <div className="mt-10 p-10 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
                <Loading />
              </div>
            )}
            {result && <ResultCard result={result} fileType={fileType} />}
          </div>
        </section>
      </main>

      <footer className="mt-16 py-8 border-t border-gray-100 bg-white text-center text-sm text-gray-500">
        Đồ án tốt nghiệp chuyên ngành Kỹ thuật phần mềm - Đề tài: XÂY DỰNG MÔ HÌNH PHÁT HIỆN NỘI DUNG AI
      </footer>
    </div>
  );
}

export default App;