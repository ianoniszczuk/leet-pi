import { useState } from 'react';
import ModalFooter from '@/shared/components/ModalFooter';
import TestFileInput from './TestFileInput';

interface ExerciseModalProps {
  guideNumber: number;
  onSave: (data: { exerciseNumber: number; enabled: boolean; functionSignature?: string | null }, testFile: File | null) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export default function ExerciseModal({ guideNumber, onSave, onCancel, loading }: ExerciseModalProps) {
  const [exerciseNumber, setExerciseNumber] = useState('');
  const [functionSignature, setFunctionSignature] = useState('');
  const [pendingTestFile, setPendingTestFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      exerciseNumber: Number(exerciseNumber),
      enabled: false,
      functionSignature: functionSignature.trim() || null,
    }, pendingTestFile);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Nuevo Ejercicio — Guía {guideNumber}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de ejercicio</label>
            <input type="number" min="1" required value={exerciseNumber}
              onChange={e => setExerciseNumber(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Firma de función (opcional)</label>
            <textarea
              value={functionSignature}
              onChange={e => setFunctionSignature(e.target.value)}
              placeholder="int sum(int a, int b)"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
            <p className="text-xs text-gray-400 mt-1">Se mostrará como plantilla inicial en el editor para los alumnos.</p>
          </div>
          <TestFileInput
            hasTestFile={false}
            onUpload={f => setPendingTestFile(f)}
            onDelete={() => { }}
            onDownload={() => { }}
            loading={loading}
          />
          {pendingTestFile && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Archivo seleccionado: {pendingTestFile.name}
              <button type="button" onClick={() => setPendingTestFile(null)} className="ml-1 text-gray-400 hover:text-red-500">✕</button>
            </p>
          )}
          <ModalFooter onCancel={onCancel} loading={loading} confirmLabel="Crear" />
        </form>
      </div>
    </div>
  );
}
