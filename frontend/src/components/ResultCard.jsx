import React from 'react';
import { AlertTriangle, Binary, CheckCircle2, Cpu } from 'lucide-react';

const ResultCard = ({ result, fileType }) => {
  if (!result) return null;

  if (result.error) {
    return (
      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <strong>Error:</strong>
        <div className="mt-2 text-sm">{result.error}</div>
      </div>
    );
  }

  const rawPrediction = result.prediction;
  const isAI =
    typeof rawPrediction === 'number'
      ? rawPrediction === 1
      : typeof rawPrediction === 'string'
        ? rawPrediction.toLowerCase().includes('ai') ||
          rawPrediction.toLowerCase().includes('generated')
        : false;

  const rawConfidence = result.confidence;
  let numericConfidence = 0;
  if (typeof rawConfidence === 'number') numericConfidence = rawConfidence;
  else if (typeof rawConfidence === 'string')
    numericConfidence = parseFloat(rawConfidence.replace('%', '')) || 0;
  const confidence = numericConfidence.toFixed(2);
  const isVideo = fileType && fileType.includes('video');

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
      className={`mt-8 rounded-2xl border p-6 shadow-sm ${
        isAI ? 'border-rose-200 bg-rose-50/70' : 'border-emerald-200 bg-emerald-50/70'
      }`}
    >
      <div className="mb-6 flex items-center gap-4 border-b border-white/70 pb-6">
        <div
          className={`rounded-2xl p-4 ${
            isAI ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {isAI ? <AlertTriangle size={30} /> : <CheckCircle2 size={30} />}
        </div>
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-950">
            {isAI ? 'Likely AI-generated content' : 'Likely authentic media'}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Analysis based on the uploaded {isVideo ? 'video frames' : 'image'}.
          </p>
          {result.message && <p className="mt-2 text-sm text-slate-500">{result.message}</p>}
        </div>
      </div>

      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-600">Model confidence</span>
          <span className={`text-xl font-bold ${isAI ? 'text-rose-700' : 'text-emerald-700'}`}>
            {confidence}%
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/80">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isAI ? 'bg-rose-600' : 'bg-emerald-600'
            }`}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>

      <div>
        <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
          <Binary size={20} className="text-blue-600" />
          Computer vision feature summary
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((feat, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="rounded-xl bg-blue-50 p-2 text-blue-700">
                <Cpu size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-950">{feat.value}</div>
                <div className="text-xs font-medium text-slate-500">{feat.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
