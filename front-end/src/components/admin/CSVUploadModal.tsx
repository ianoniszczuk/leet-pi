import { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import type { CSVUploadResult } from '@/types';

interface CSVUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CSVUploadModal({ isOpen, onClose }: CSVUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<CSVUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setSelectedFile(null);
      setUploadResult(null);
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 200);
  };

  const applySelectedFile = (file: File, errMsg: string) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError(errMsg);
      return;
    }
    setSelectedFile(file);
    setError(null);
    setUploadResult(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) applySelectedFile(file, 'Por favor, selecciona un archivo CSV');
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) applySelectedFile(file, 'Por favor, arrastra un archivo CSV');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Por favor, selecciona un archivo CSV');
      return;
    }
    try {
      setIsUploading(true);
      setError(null);
      setUploadResult(null);
      const response = await apiService.uploadCSV(selectedFile);
      if (response.success && response.data) {
        setUploadResult(response.data);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setError(response.error?.message || 'Error al procesar el archivo CSV');
        if (response.data) setUploadResult(response.data);
      }
    } catch (err: any) {
      console.error('Error uploading CSV:', err);
      setError(err.response?.data?.error?.message || 'Error al subir el archivo CSV');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-200 ${
          isClosing ? 'opacity-0' : 'opacity-50'
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Cargar CSV</h2>
              <p className="text-xs text-gray-600">Habilita/deshabilita usuarios en masa</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Drag & Drop */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              selectedFile ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-6 h-6 text-primary-600" />
                  <div className="text-left">
                    <p className="font-medium text-sm text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Eliminar archivo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Arrastra un CSV aquí o</p>
                  <label className="inline-block">
                    <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
                    <span className="text-primary-600 hover:text-primary-700 text-sm font-medium cursor-pointer">selecciona un archivo</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
              !selectedFile || isUploading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
          >
            {isUploading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Procesando...
              </span>
            ) : 'Procesar CSV'}
          </button>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Upload result */}
          {uploadResult && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-xs font-medium text-green-800">Procesamiento completado</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Habilitados', value: uploadResult.enabled },
                  { label: 'Deshabilitados', value: uploadResult.disabled },
                  { label: 'Creados', value: uploadResult.created },
                  { label: 'Total', value: uploadResult.totalProcessed },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-green-700">{label}</p>
                    <p className="text-base font-semibold text-green-900">{value}</p>
                  </div>
                ))}
              </div>
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="mt-2 pt-2 border-t border-green-200">
                  <p className="text-xs font-medium text-green-800 mb-1">Errores ({uploadResult.errors.length}):</p>
                  <ul className="space-y-0.5 max-h-24 overflow-y-auto">
                    {uploadResult.errors.map((err, index) => (
                      <li key={index} className="text-xs text-red-700">• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* CSV format hint */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Formato del CSV</h3>
            <div className="space-y-1 text-xs text-blue-800">
              <p>• El archivo debe tener una columna "email"</p>
              <p>• Los emails deben ser válidos</p>
              <p>• Se ignoran otras columnas</p>
              <p>• Los usuarios en el CSV serán habilitados</p>
              <p>• Los usuarios no en el CSV serán deshabilitados</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
