import { useState } from 'react';
import ModalFooter from '@/shared/components/ModalFooter';
import type { AdminGuide } from '@/admin/types';

export interface GuideFormData {
  guideNumber?: number;
  deadline: string | null;
}

interface GuideModalProps {
  initial?: AdminGuide;
  onSave: (data: GuideFormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export default function GuideModal({ initial, onSave, onCancel, loading }: GuideModalProps) {
  const [guideNumber, setGuideNumber] = useState(initial?.guideNumber?.toString() ?? '');
  const [deadline, setDeadline] = useState(
    initial?.deadline ? new Date(initial.deadline).toLocaleDateString('en-CA') : ''
  );
  const isEdit = !!initial;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(isEdit ? {} : { guideNumber: Number(guideNumber) }),
      deadline: deadline ? (() => { const [y, m, d] = deadline.split('-').map(Number); return new Date(y, m - 1, d, 23, 59, 59).toISOString(); })() : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isEdit ? `Editar Guía ${initial.guideNumber}` : 'Nueva Guía'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de guía</label>
              <input type="number" min="1" required value={guideNumber}
                onChange={e => setGuideNumber(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline (opcional)</label>
            <div className="flex gap-2">
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              {deadline && (
                <button type="button" onClick={() => setDeadline('')}
                  className="text-xs text-gray-500 hover:text-red-600 px-2">
                  Limpiar
                </button>
              )}
            </div>
          </div>
          <ModalFooter onCancel={onCancel} loading={loading} confirmLabel={isEdit ? 'Guardar' : 'Crear'} />
        </form>
      </div>
    </div>
  );
}
