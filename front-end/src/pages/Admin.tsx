import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Users, BookOpen, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import type { UserStatus, CSVUploadResult } from '@/types';
import GuidesTab from '@/components/admin/GuidesTab';

type Tab = 'users' | 'guides';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('users');

  // Users tab state
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<CSVUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUserStatus();
  }, []);

  const loadUserStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const response = await apiService.getUserStatus();
      if (response.success && response.data) {
        setUserStatus(response.data);
      } else {
        setError('Error al cargar el estado de usuarios');
      }
    } catch (err) {
      console.error('Error loading user status:', err);
      setError('Error al cargar el estado de usuarios');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const applySelectedFile = (file: File, csvErrMsg: string) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError(csvErrMsg);
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
        await loadUserStatus();
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

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) applySelectedFile(file, 'Por favor, arrastra un archivo CSV');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona usuarios y configuración del sistema</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'users'
                ? 'bg-white border border-b-white border-gray-200 text-primary-700 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Usuarios
          </button>
          <button
            onClick={() => setActiveTab('guides')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'guides'
                ? 'bg-white border border-b-white border-gray-200 text-primary-700 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Guías &amp; Ejercicios
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'guides' && <GuidesTab />}

        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CSV Upload */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Upload className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Cargar CSV de Usuarios</h2>
                    <p className="text-sm text-gray-600">Sube un archivo CSV para habilitar/deshabilitar usuarios</p>
                  </div>
                </div>

                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    selectedFile ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {selectedFile ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="w-8 h-8 text-primary-600" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Eliminar archivo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-gray-600 mb-2">Arrastra un archivo CSV aquí o</p>
                        <label className="inline-block">
                          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
                          <span className="text-primary-600 hover:text-primary-700 font-medium cursor-pointer">selecciona un archivo</span>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">El archivo debe contener una columna "email"</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className={`w-full mt-4 py-3 px-4 rounded-lg font-medium transition-colors ${
                    !selectedFile || isUploading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                  }`}
                >
                  {isUploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Procesando...
                    </span>
                  ) : 'Procesar CSV'}
                </button>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">Error</p>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                {uploadResult && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-3 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-green-800">Procesamiento completado</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {[
                        { label: 'Habilitados', value: uploadResult.enabled },
                        { label: 'Deshabilitados', value: uploadResult.disabled },
                        { label: 'Creados', value: uploadResult.created },
                        { label: 'Total', value: uploadResult.totalProcessed },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-xs text-green-700 mb-1">{label}</p>
                          <p className="text-lg font-semibold text-green-900">{value}</p>
                        </div>
                      ))}
                    </div>
                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-green-200">
                        <p className="text-xs font-medium text-green-800 mb-2">Errores encontrados ({uploadResult.errors.length}):</p>
                        <ul className="space-y-1 max-h-32 overflow-y-auto">
                          {uploadResult.errors.map((err, index) => (
                            <li key={index} className="text-xs text-red-700">• {err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* User Status */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Estado de Usuarios</h2>
                    <p className="text-sm text-gray-600">Estadísticas generales</p>
                  </div>
                </div>

                {isLoadingStatus ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : userStatus ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Total de Usuarios</span>
                      <span className="text-2xl font-bold text-gray-900">{userStatus.total}</span>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Habilitados</span>
                        </div>
                        <span className="text-2xl font-bold text-green-900">{userStatus.enabled}</span>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${(userStatus.enabled / userStatus.total) * 100}%` }} />
                      </div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-5 h-5 text-red-600" />
                          <span className="text-sm font-medium text-red-800">Deshabilitados</span>
                        </div>
                        <span className="text-2xl font-bold text-red-900">{userStatus.disabled}</span>
                      </div>
                      <div className="w-full bg-red-200 rounded-full h-2">
                        <div className="bg-red-600 h-2 rounded-full transition-all" style={{ width: `${(userStatus.disabled / userStatus.total) * 100}%` }} />
                      </div>
                    </div>
                    <button onClick={loadUserStatus} className="w-full mt-4 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                      Actualizar
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">No se pudo cargar el estado</p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Formato del CSV</h3>
                <div className="space-y-2 text-xs text-blue-800">
                  <p>• El archivo debe tener una columna "email"</p>
                  <p>• Los emails deben ser válidos</p>
                  <p>• Se ignoran otras columnas</p>
                  <p>• Los usuarios en el CSV serán habilitados</p>
                  <p>• Los usuarios no en el CSV serán deshabilitados</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
