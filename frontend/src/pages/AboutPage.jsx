import React from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card } from '../components/ui/Card';

export const AboutPage = () => {
  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto py-12">
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-4">About AI Content Detection</h2>
          <p className="text-gray-700 mb-3">
            This application detects whether an image is AI-generated or real using a hybrid model
            that combines deep learning and classical machine learning features. It is designed to
            demonstrate an end-to-end flow from frontend upload to backend handling and an AI
            microservice performing inference.
          </p>
          <p className="text-gray-700 mb-3">Features:</p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Upload or point to an image URL to run detection.</li>
            <li>View detection history and submit feedback.</li>
            <li>User profile and authentication (mocked for demo).</li>
            <li>Extensible AI service powered by FastAPI and trained models.</li>
          </ul>
          <p className="text-gray-500 mt-6 text-sm">
            Built for demonstration and educational purposes.
          </p>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AboutPage;
