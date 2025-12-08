'use client';

import { useState, useRef } from 'react';
import axios from 'axios';

interface UploadedDocument {
  documentId: string;
  filename: string;
}

interface Message {
  question: string;
  answer: string;
  timestamp: Date;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a PDF file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setUploadedDocs([...uploadedDocs, {
          documentId: response.data.documentId,
          filename: response.data.filename,
        }]);
        setSelectedDoc(response.data.documentId);
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.response?.data?.error || 'Failed to upload PDF');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const currentQuestion = question;
    setQuestion('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/chat`, {
        question: currentQuestion,
        documentId: selectedDoc || undefined,
      });

      if (response.data.success) {
        setMessages([...messages, {
          question: currentQuestion,
          answer: response.data.answer,
          timestamp: new Date(),
        }]);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      alert(error.response?.data?.error || 'Failed to process question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            AskMyPDF
          </h1>
          <p className="text-lg text-slate-600 font-medium">
            Upload PDFs and ask questions using AI-powered RAG
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upload & Documents */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">📄</span>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Upload PDF</h2>
              </div>
              
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50/50'
                    : file
                    ? 'border-green-400 bg-green-50/30'
                    : 'border-slate-300 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/30'
                }`}
              >
                <div className="mb-4">
                  <span className="text-4xl">📎</span>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="hidden"
                  id="file-upload"
                />
                <div>
                  <p className="text-slate-600 font-medium mb-2">
                    {file ? file.name : 'Drag & drop or click to select'}
                  </p>
                  <p className="text-sm text-slate-400">
                    PDF files only
                  </p>
                </div>
              </div>

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Uploading...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>⬆️</span>
                    Upload PDF
                  </span>
                )}
              </button>
            </div>

            {uploadedDocs.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl">📚</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Documents</h2>
                </div>
                <div className="space-y-2">
                  {uploadedDocs.map((doc) => (
                    <button
                      key={doc.documentId}
                      onClick={() => setSelectedDoc(doc.documentId)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedDoc === doc.documentId
                          ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-blue-50 shadow-md'
                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-lg">📄</span>
                          <span className="font-medium text-slate-700 truncate">{doc.filename}</span>
                        </div>
                        {selectedDoc === doc.documentId && (
                          <span className="ml-2 px-2 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">💬</span>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Chat with your PDF</h2>
              </div>
              
              {uploadedDocs.length === 0 && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-amber-800 text-sm font-medium flex items-center gap-2">
                    <span>⚠️</span>
                    Please upload a PDF document first to start asking questions.
                  </p>
                </div>
              )}

              <div className="flex-1 mb-4 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12">
                    <div className="text-6xl mb-4">🤔</div>
                    <p className="text-slate-500 text-center font-medium">
                      No questions yet. Ask something about your uploaded PDF!
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className="space-y-3 animate-fadeIn">
                      {/* Question */}
                      <div className="flex justify-end">
                        <div className="max-w-[80%] bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl rounded-tr-none shadow-md">
                          <p className="font-medium">{msg.question}</p>
                        </div>
                      </div>
                      {/* Answer */}
                      <div className="flex justify-start">
                        <div className="max-w-[80%] bg-slate-100 text-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm">
                          <p className="leading-relaxed">{msg.answer}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {loading && (
                  <div className="flex justify-end animate-fadeIn">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl rounded-tr-none shadow-md">
                      <div className="flex items-center gap-2">
                        <span className="animate-pulse">💭</span>
                        <span>Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSubmitQuestion} className="flex gap-3">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about your PDF..."
                  disabled={uploadedDocs.length === 0 || loading}
                  className="flex-1 px-5 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all"
                />
                <button
                  type="submit"
                  disabled={uploadedDocs.length === 0 || loading || !question.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                >
                  <span className="flex items-center gap-2">
                    <span>🚀</span>
                    <span>Send</span>
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

