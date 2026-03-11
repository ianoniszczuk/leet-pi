import { useState } from 'react';
import ModalFooter from '@/shared/components/ModalFooter';
import TestFileInput from './TestFileInput';
import type { AdminExercise } from '@/admin/types';

interface EditExerciseModalProps {
  exercise: AdminExercise;
  onSave: (data: { functionSignature: string | null }, pendingTestFile: File | null, pendingDelete: boolean) => Promise<void>;
  onDownloadTestFile: () => void;
  onCancel: () => void;
  loading: boolean;
}

export default function EditExerciseModal({ exercise, onSave, onDownloadTestFile, onCancel, loading }: EditExerciseModalProps) {
  const [functionSignature, setFunctionSignature] = useState(exercise.functionSignature ?? '');
  const [pendingTestFile, setPendingTestFile] = useState<File | null>(null);
  const [pendingDelete, setPendingDelete] = useState(false);

  const effectiveHasTestFile = pendingDelete ? false : (pendingTestFile !== null || (exercise.hasTestFile ?? false));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ functionSignature: functionSignature.trim() || null }, pendingTestFile, pendingDelete);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Editar Ejercicio {exercise.exerciseNumber} — Guía {exercise.guideNumber}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Firma de función</label>
            <textarea
              value={functionSignature}
              onChange={e => setFunctionSignature(e.target.value)}
              placeholder="int sum(int a, int b)"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
            <p className="text-xs text-gray-400 mt-1">Se mostrará como plantilla inicial en el editor. Dejar vacío para usar Hello World.</p>
          </div>
          <TestFileInput
            hasTestFile={effectiveHasTestFile}
            onUpload={f => { setPendingTestFile(f); setPendingDelete(false); }}
            onDelete={() => { setPendingDelete(true); setPendingTestFile(null); }}
            onDownload={onDownloadTestFile}
            loading={loading}
          />
          {pendingTestFile && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Archivo seleccionado: {pendingTestFile.name}
            </p>
          )}
          {pendingDelete && (
            <p className="text-xs text-red-500">El archivo de test se eliminará al guardar.</p>
          )}
          <ModalFooter onCancel={onCancel} loading={loading} confirmLabel="Guardar" />
        </form>
      </div>
    </div>
  );
}
