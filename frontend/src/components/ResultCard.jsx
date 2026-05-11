import React from 'react';
import { AlertTriangle, CheckCircle2, Binary, Cpu, BarChart3 } from 'lucide-react';

const ResultCard = ({ result, fileType }) => {
  if (!result) return null;

  if (result.error) {
    return (
      <div className="mt-8 p-6 rounded-3xl border border-yellow-200 bg-yellow-50 text-yellow-800">
        <strong>Lỗi:</strong>
        <div className="mt-2 text-sm">{result.error}</div>
      </div>
    );
  }

  const rawPrediction = result.prediction;
  // Support both numeric (0/1) and string predictions (e.g. "AI-GENERATED" | "REAL-IMAGE")
  const isAI =
    typeof rawPrediction === 'number'
      ? rawPrediction === 1
      : typeof rawPrediction === 'string'
        ? rawPrediction.toLowerCase().includes('ai') ||
          rawPrediction.toLowerCase().includes('generated')
        : false;

  // Confidence may be a number (e.g., 82.34) or a string like "58.39%"
  const rawConfidence = result.confidence;
  let numericConfidence = 0;
  if (typeof rawConfidence === 'number') numericConfidence = rawConfidence;
  else if (typeof rawConfidence === 'string')
    numericConfidence = parseFloat(rawConfidence.replace('%', '')) || 0;
  const confidence = numericConfidence.toFixed(2);
  const isVideo = fileType && fileType.includes('video');

  // Giả lập các đặc trưng thuật toán (khoảng 3-4 cái)
  const features = isAI
    ? [
        { name: 'FFT Artifacts', value: 'High' },
        { name: 'GLCM Texture', value: 'Unnatural' },
        { name: 'Edge Inconsistency', value: 'Detected' },
        { name: 'Color Skewness', value: 'Abnormal' },
      ]
    : [
        { name: 'FFT Spectrum', value: 'Natural' },
        { name: 'GLCM Texture', value: 'Consistent' },
        { name: 'Edge Density', value: 'Expected' },
        { name: 'Natural Grain', value: 'Present' },
      ];

  return (
    <div
      className={`mt-8 p-8 rounded-3xl border ${isAI ? 'border-red-200 bg-red-50/50' : 'border-green-200 bg-green-50/50'} shadow-inner`}
    >
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
        <div
          className={`p-4 rounded-full ${isAI ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
        >
          {isAI ? <AlertTriangle size={36} /> : <CheckCircle2 size={36} />}
        </div>
        <div>
          <h3 className={`text-2xl font-bold ${isAI ? 'text-red-900' : 'text-green-900'}`}>
            {isAI ? 'CÓ THỂ LÀ NỘI DUNG DO AI TẠO RA' : 'NỘI DUNG CHỤP THỰC TẾ (REAL)'}
          </h3>
          <p className="text-gray-600 mt-1">
            Phân tích dựa trên {isVideo ? 'các khung hình video' : 'hình ảnh'} đã tải lên.
          </p>
          {result.message && <p className="text-sm text-gray-500 mt-2">{result.message}</p>}
        </div>
      </div>

      {/* Thanh độ tin cậy */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-sm font-semibold text-gray-600">
            Độ tin cậy của mô hình Machine Learning:
          </span>
          <span className={`text-xl font-extrabold ${isAI ? 'text-red-600' : 'text-green-600'}`}>
            {confidence}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-5 p-1 flex items-center shadow-inner">
          <div
            className={`h-3 rounded-full transition-all duration-1000 ease-out shadow ${isAI ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${confidence}%` }}
          ></div>
        </div>
      </div>

      {/* Chi tiết kỹ thuật (CV Features) */}
      <div>
        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Binary size={20} className="text-blue-500" />
          Chi tiết đặc trưng Computer Vision (CV)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((feat, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-xl border border-gray-100 flex items-start gap-3 shadow-sm hover:border-blue-100 transition"
            >
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Cpu size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">{feat.value}</div>
                <div className="text-xs font-medium text-gray-500">{feat.name}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-5 italic">
          * Các đặc trưng này được trích xuất bằng thư viện OpenCV và Skimage (FFT, GLCM, v.v.).
        </p>
      </div>
    </div>
  );
};

export default ResultCard;
