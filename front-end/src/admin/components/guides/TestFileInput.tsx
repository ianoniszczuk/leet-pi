import { useState, useRef } from 'react';
import { Upload, Download, FileX } from 'lucide-react';

interface TestFileInputProps {
  hasTestFile: boolean;
  onUpload: (file: File) => void;
  onDelete: () => void;
  onDownload: () => void;
  loading: boolean;
}

export default function TestFileInput({ hasTestFile, onUpload, onDelete, onDownload, loading }: TestFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.c')) {
      setFileError('Solo se permiten archivos .c');
      e.target.value = '';
      return;
    }
    setFileError(null);
    onUpload(file);
    e.target.value = '';
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Archivo de test (.c)</label>
      <div className="flex items-center gap-2 flex-wrap">
        {hasTestFile ? (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Archivo cargado
          </span>
        ) : (
          <span className="text-xs text-gray-400">Sin archivo</span>
        )}
        <button
          type="button"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1 text-xs px-2 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
          <Upload className="w-3 h-3" />
          {hasTestFile ? 'Reemplazar' : 'Subir archivo'}
        </button>
        {hasTestFile && (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={onDownload}
              className="flex items-center gap-1 text-xs px-2 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
              <Download className="w-3 h-3" />
              Descargar
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onDelete}
              className="flex items-center gap-1 text-xs px-2 py-1 border border-red-200 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
              <FileX className="w-3 h-3" />
              Eliminar
            </button>
          </>
        )}
        <input ref={inputRef} type="file" accept=".c" className="hidden" onChange={handleFileChange} />
      </div>
      {fileError && <p className="text-xs text-red-500 mt-1">{fileError}</p>}
    </div>
  );
}

export type { TestFileInputProps };
