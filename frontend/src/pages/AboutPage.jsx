import React from 'react';
import { BarChart3, BrainCircuit, History, MessageSquare, ShieldCheck } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';

export const AboutPage = () => {
  const capabilities = [
    {
      icon: BrainCircuit,
      title: 'Hybrid AI detection',
      description: 'Combines deep learning features with classical CV signals for richer evidence.',
    },
    {
      icon: BarChart3,
      title: 'Visual explanations',
      description: 'Grad-CAM overlays and CV feature analysis help explain the model response.',
    },
    {
      icon: History,
      title: 'Detection history',
      description: 'Stored scans keep previews, confidence, metadata, and feedback context together.',
    },
    {
      icon: MessageSquare,
      title: 'Feedback workflow',
      description: 'Users can mark detections as correct or incorrect to support review quality.',
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        badge="About HyperID"
        title="AI content verification for images and video"
        subtitle="HyperID AI Detector is a dashboard for scanning media, reviewing model evidence, and managing detection records."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                HyperID AI Detector
              </h2>
              <p className="text-sm text-slate-500">Deep learning and computer vision suite</p>
            </div>
          </div>

          <p className="leading-7 text-slate-600">
            This application detects whether uploaded media is AI-generated or authentic using a
            hybrid model pipeline. It demonstrates an end-to-end flow from authenticated upload to
            backend storage, AI microservice inference, Grad-CAM explanation, CV feature reporting,
            history management, and feedback capture.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Badge variant="primary">Image analysis</Badge>
            <Badge variant="primary">Video keyframes</Badge>
            <Badge variant="gray">Storage quota</Badge>
            <Badge variant="gray">Model feedback</Badge>
          </div>
        </Card>

        <Card className="border-blue-100 bg-blue-50/70 p-8">
          <h3 className="text-lg font-bold text-slate-950">Designed for coursework demos</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            HyperID keeps the interface practical: upload media, inspect evidence, save history, and
            compare detection outcomes. The goal is clarity over decoration.
          </p>
          <div className="mt-6 rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
            Built for demonstration and educational purposes.
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {capabilities.map((item) => (
          <Card key={item.title} className="p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-blue-700">
              <item.icon size={22} />
            </div>
            <h3 className="font-bold text-slate-950">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
};

export default AboutPage;
