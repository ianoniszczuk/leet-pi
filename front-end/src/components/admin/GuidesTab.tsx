import { useState, useEffect } from 'react';
import {
  ChevronDown, ChevronRight, Plus, Pencil, Trash2, Loader2, AlertCircle,
} from 'lucide-react';
import { apiService } from '@/services/api';
import { cacheService } from '@/services/cacheService';
import { CACHE_KEYS } from '@/config/cache';
import type { AdminGuide, AdminExercise } from '@/types';

// ─── Shared sub-components ────────────────────────────────────────────────────

interface ModalFooterProps {
  onCancel: () => void;
  loading: boolean;
  confirmLabel: string;
}

function ModalFooter({ onCancel, loading, confirmLabel }: ModalFooterProps) {
  return (
    <div className="flex gap-3 justify-end pt-2">
      <button type="button" onClick={onCancel} disabled={loading}
        className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
        Cancelar
      </button>
      <button type="submit" disabled={loading}
        className="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {confirmLabel}
      </button>
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

interface ConfirmDeleteModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function ConfirmDeleteModal({ message, onConfirm, onCancel, loading }: ConfirmDeleteModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar eliminación</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} disabled={loading}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

interface GuideFormData {
  guideNumber?: number;
  deadline: string | null;
}

interface GuideModalProps {
  initial?: AdminGuide;
  onSave: (data: GuideFormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

function GuideModal({ initial, onSave, onCancel, loading }: GuideModalProps) {
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

interface ExerciseModalProps {
  guideNumber: number;
  onSave: (data: { exerciseNumber: number; enabled: boolean; functionSignature?: string | null }) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

function ExerciseModal({ guideNumber, onSave, onCancel, loading }: ExerciseModalProps) {
  const [exerciseNumber, setExerciseNumber] = useState('');
  const [functionSignature, setFunctionSignature] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      exerciseNumber: Number(exerciseNumber),
      enabled: false,
      functionSignature: functionSignature.trim() || null,
    });
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
          <ModalFooter onCancel={onCancel} loading={loading} confirmLabel="Crear" />
        </form>
      </div>
    </div>
  );
}

interface EditExerciseModalProps {
  exercise: AdminExercise;
  onSave: (data: { functionSignature: string | null }) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

function EditExerciseModal({ exercise, onSave, onCancel, loading }: EditExerciseModalProps) {
  const [functionSignature, setFunctionSignature] = useState(exercise.functionSignature ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ functionSignature: functionSignature.trim() || null });
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
          <ModalFooter onCancel={onCancel} loading={loading} confirmLabel="Guardar" />
        </form>
      </div>
    </div>
  );
}

// ─── Exercise row ─────────────────────────────────────────────────────────────

interface ExerciseRowProps {
  exercise: AdminExercise;
  onToggle: (e: AdminExercise) => Promise<void>;
  onDelete: (e: AdminExercise) => void;
  onEdit: (e: AdminExercise) => void;
}

function ExerciseRow({ exercise, onToggle, onDelete, onEdit }: ExerciseRowProps) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await onToggle(exercise);
    setToggling(false);
  };

  return (
    <div className="flex items-center justify-between py-2 px-4 hover:bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <span className={`inline-block w-2 h-2 rounded-full ${exercise.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
        <span className="text-sm text-gray-700">Ejercicio {exercise.exerciseNumber}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${exercise.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {exercise.enabled ? 'Habilitado' : 'Deshabilitado'}
        </span>
        {exercise.functionSignature && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-mono" title={exercise.functionSignature}>
            fn
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handleToggle} disabled={toggling}
          title={exercise.enabled ? 'Deshabilitar' : 'Habilitar'}
          className="text-xs px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-600 transition-colors flex items-center gap-1">
          {toggling ? <Loader2 className="w-3 h-3 animate-spin" /> : (exercise.enabled ? '○ Deshabilitar' : '● Habilitar')}
        </button>
        <button onClick={() => onEdit(exercise)} title="Editar firma de función"
          className="p-1 text-gray-400 hover:text-primary-600 transition-colors">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(exercise)} title="Eliminar ejercicio"
          className="p-1 text-red-400 hover:text-red-600 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Guide row ────────────────────────────────────────────────────────────────

interface GuideRowHandlers {
  onEdit: (g: AdminGuide) => void;
  onDelete: (g: AdminGuide) => void;
  onToggle: (g: AdminGuide) => Promise<void>;
  onToggleExercise: (g: AdminGuide, e: AdminExercise) => Promise<void>;
  onDeleteExercise: (g: AdminGuide, e: AdminExercise) => void;
  onEditExercise: (g: AdminGuide, e: AdminExercise) => void;
  onAddExercise: (g: AdminGuide) => void;
}

interface GuideRowProps {
  guide: AdminGuide;
  handlers: GuideRowHandlers;
}

function GuideRow({ guide, handlers }: GuideRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);

  const deadlineLabel = guide.deadline
    ? new Date(guide.deadline).toLocaleDateString('es-AR')
    : 'Sin deadline';

  const handleToggle = async () => {
    setToggling(true);
    await handlers.onToggle(guide);
    setToggling(false);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-white hover:bg-gray-50">
        <button onClick={() => setExpanded(x => !x)} className="flex items-center gap-3 flex-1 text-left">
          {expanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
          <span className="font-medium text-gray-900">Guía {guide.guideNumber}</span>
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${guide.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${guide.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
            {guide.enabled ? 'Habilitada' : 'Deshabilitada'}
          </span>
          <span className="text-xs text-gray-500">{deadlineLabel}</span>
          <span className="text-xs text-gray-400">{guide.exercises.length} ejercicio(s)</span>
        </button>
        <div className="flex items-center gap-2 ml-4">
          <button onClick={handleToggle} disabled={toggling}
            title={guide.enabled ? 'Deshabilitar' : 'Habilitar'}
            className="text-xs px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-600 transition-colors flex items-center gap-1">
            {toggling ? <Loader2 className="w-3 h-3 animate-spin" /> : (guide.enabled ? '○ Deshabilitar' : '● Habilitar')}
          </button>
          <button onClick={() => handlers.onEdit(guide)} title="Editar guía"
            className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => handlers.onDelete(guide)} title="Eliminar guía"
            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ejercicios</span>
            <button onClick={() => handlers.onAddExercise(guide)}
              className="flex items-center gap-1 text-xs px-2 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              <Plus className="w-3 h-3" /> Nuevo Ejercicio
            </button>
          </div>
          {guide.exercises.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Sin ejercicios</p>
          ) : (
            <div className="space-y-1">
              {guide.exercises.map(ex => (
                <ExerciseRow
                  key={ex.exerciseNumber}
                  exercise={ex}
                  onToggle={e => handlers.onToggleExercise(guide, e)}
                  onDelete={e => handlers.onDeleteExercise(guide, e)}
                  onEdit={e => handlers.onEditExercise(guide, e)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type DeleteTarget =
  | { type: 'guide'; guide: AdminGuide }
  | { type: 'exercise'; guide: AdminGuide; exercise: AdminExercise };

type Modal =
  | { type: 'newGuide' }
  | { type: 'editGuide'; guide: AdminGuide }
  | { type: 'newExercise'; guide: AdminGuide }
  | { type: 'editExercise'; guide: AdminGuide; exercise: AdminExercise };

export default function GuidesTab() {
  const [guides, setGuides] = useState<AdminGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadGuides = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await apiService.getAdminGuides();
      if (res.success && res.data) setGuides(res.data);
      else setError('Error al cargar las guías');
    } catch {
      setError('Error al cargar las guías');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { loadGuides(); }, []);

  const withAction = async (fn: () => Promise<void>) => {
    setActionLoading(true);
    try {
      await fn();
      await loadGuides(true);
      cacheService.invalidate(CACHE_KEYS.availableExercises);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al realizar la operación');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveGuide = async (data: GuideFormData) => {
    if (modal?.type === 'editGuide') {
      await withAction(() => apiService.updateGuide(modal.guide.guideNumber, { deadline: data.deadline }));
    } else {
      await withAction(() => apiService.createGuide({ guideNumber: data.guideNumber!, deadline: data.deadline }));
    }
    setModal(null);
  };

  const handleToggleGuide = (guide: AdminGuide) =>
    withAction(() => apiService.updateGuide(guide.guideNumber, { enabled: !guide.enabled }));

  const handleSaveExercise = async (data: { exerciseNumber: number; enabled: boolean; functionSignature?: string | null }) => {
    if (modal?.type !== 'newExercise') return;
    await withAction(() => apiService.createExercise(modal.guide.guideNumber, data));
    setModal(null);
  };

  const handleEditExerciseSave = async (data: { functionSignature: string | null }) => {
    if (modal?.type !== 'editExercise') return;
    await withAction(() => apiService.updateExercise(modal.guide.guideNumber, modal.exercise.exerciseNumber, data));
    setModal(null);
  };

  const handleToggleExercise = (guide: AdminGuide, exercise: AdminExercise) =>
    withAction(() => apiService.updateExercise(guide.guideNumber, exercise.exerciseNumber, { enabled: !exercise.enabled }));

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'guide') {
      await withAction(() => apiService.deleteGuide(deleteTarget.guide.guideNumber));
    } else {
      await withAction(() => apiService.deleteExercise(deleteTarget.guide.guideNumber, deleteTarget.exercise.exerciseNumber));
    }
    setDeleteTarget(null);
  };

  const deleteMessage = deleteTarget?.type === 'guide'
    ? `¿Eliminar Guía ${deleteTarget.guide.guideNumber}? Se eliminarán todos sus ejercicios.`
    : deleteTarget?.type === 'exercise'
      ? `¿Eliminar Ejercicio ${deleteTarget.exercise.exerciseNumber} de Guía ${deleteTarget.guide.guideNumber}?`
      : '';

  const guideHandlers: GuideRowHandlers = {
    onEdit: g => setModal({ type: 'editGuide', guide: g }),
    onDelete: g => setDeleteTarget({ type: 'guide', guide: g }),
    onToggle: handleToggleGuide,
    onToggleExercise: handleToggleExercise,
    onDeleteExercise: (g, e) => setDeleteTarget({ type: 'exercise', guide: g, exercise: e }),
    onEditExercise: (g, e) => setModal({ type: 'editExercise', guide: g, exercise: e }),
    onAddExercise: g => setModal({ type: 'newExercise', guide: g }),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Guías &amp; Ejercicios</h2>
        <button onClick={() => setModal({ type: 'newGuide' })}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
          <Plus className="w-4 h-4" /> Nueva Guía
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="flex-1 text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : guides.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-2">No hay guías aún.</p>
          <button onClick={() => setModal({ type: 'newGuide' })} className="text-primary-600 hover:underline text-sm">
            Crear la primera guía
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {guides.map(guide => (
            <GuideRow key={guide.guideNumber} guide={guide} handlers={guideHandlers} />
          ))}
        </div>
      )}

      {modal?.type === 'newGuide' && (
        <GuideModal onSave={handleSaveGuide} onCancel={() => setModal(null)} loading={actionLoading} />
      )}
      {modal?.type === 'editGuide' && (
        <GuideModal initial={modal.guide} onSave={handleSaveGuide} onCancel={() => setModal(null)} loading={actionLoading} />
      )}
      {modal?.type === 'newExercise' && (
        <ExerciseModal guideNumber={modal.guide.guideNumber} onSave={handleSaveExercise} onCancel={() => setModal(null)} loading={actionLoading} />
      )}
      {modal?.type === 'editExercise' && (
        <EditExerciseModal exercise={modal.exercise} onSave={handleEditExerciseSave} onCancel={() => setModal(null)} loading={actionLoading} />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal message={deleteMessage} onConfirm={handleConfirmDelete} onCancel={() => setDeleteTarget(null)} loading={actionLoading} />
      )}
    </div>
  );
}
