import { useState, useEffect } from 'react';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { apiService } from '@/shared/services/api';
import { cacheService } from '@/shared/services/cacheService';
import { CACHE_KEYS, CACHE_CONFIG } from '@/shared/config/cache';
import ConfirmDeleteModal from '@/shared/components/ConfirmDeleteModal';
import GuideModal from './guides/GuideModal';
import ExerciseModal from './guides/ExerciseModal';
import EditExerciseModal from './guides/EditExerciseModal';
import GuideRow from './guides/GuideRow';
import type { GuideRowHandlers } from './guides/GuideRow';
import type { GuideFormData } from './guides/GuideModal';
import type { AdminGuide, AdminExercise } from '@/admin/types';

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

      if (!silent) {
        const cached = cacheService.get<AdminGuide[]>(CACHE_KEYS.adminGuides);
        if (cached) {
          setGuides(cached);
          setLoading(false);
          return;
        }
      }

      const res = await apiService.getAdminGuides();
      if (res.success && res.data) {
        setGuides(res.data);
        cacheService.set(CACHE_KEYS.adminGuides, res.data, CACHE_CONFIG.adminGuides);
      } else {
        setError('Error al cargar las guías');
      }
    } catch {
      setError('Error al cargar las guías');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { loadGuides(); }, []);

  const withAction = async (fn: () => Promise<unknown>) => {
    setActionLoading(true);
    try {
      await fn();
      cacheService.invalidate(CACHE_KEYS.adminGuides);
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

  const handleSaveExercise = async (data: { exerciseNumber: number; enabled: boolean; functionSignature?: string | null }, testFile: File | null) => {
    if (modal?.type !== 'newExercise') return;
    const guideNumber = modal.guide.guideNumber;
    setActionLoading(true);
    try {
      const res = await apiService.createExercise(guideNumber, data);
      if (testFile && res.success) {
        try {
          await apiService.uploadExerciseTestFile(guideNumber, data.exerciseNumber, testFile);
        } catch (uploadErr: any) {
          setError(`Ejercicio creado, pero no se pudo subir el archivo de test: ${uploadErr.response?.data?.error?.message || uploadErr.message}`);
        }
      }
      await loadGuides(true);
      cacheService.invalidate(CACHE_KEYS.adminGuides);
      cacheService.invalidate(CACHE_KEYS.availableExercises);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al crear el ejercicio');
    } finally {
      setActionLoading(false);
    }
    setModal(null);
  };

  const handleEditExerciseSave = async (data: { functionSignature: string | null }, pendingTestFile: File | null, pendingDelete: boolean) => {
    if (modal?.type !== 'editExercise') return;
    const { guideNumber, exerciseNumber } = modal.exercise;
    setActionLoading(true);
    try {
      await apiService.updateExercise(guideNumber, exerciseNumber, data);
      if (pendingDelete) {
        await apiService.deleteExerciseTestFile(guideNumber, exerciseNumber);
      } else if (pendingTestFile) {
        await apiService.uploadExerciseTestFile(guideNumber, exerciseNumber, pendingTestFile);
      }
      await loadGuides(true);
      cacheService.invalidate(CACHE_KEYS.adminGuides);
      cacheService.invalidate(CACHE_KEYS.availableExercises);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al guardar el ejercicio');
    } finally {
      setActionLoading(false);
    }
    setModal(null);
  };

  const handleToggleExercise = (guide: AdminGuide, exercise: AdminExercise) =>
    withAction(() => apiService.updateExercise(guide.guideNumber, exercise.exerciseNumber, { enabled: !exercise.enabled }));

  const handleDownloadTestFile = (guide: AdminGuide, exercise: AdminExercise) => {
    apiService.downloadExerciseTestFile(guide.guideNumber, exercise.exerciseNumber).catch((err: any) => {
      setError(err.response?.data?.error?.message || 'Error al descargar el archivo de test');
    });
  };

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
    onDownloadTestFile: handleDownloadTestFile,
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
        <EditExerciseModal
          exercise={modal.exercise}
          onSave={handleEditExerciseSave}
          onDownloadTestFile={() => handleDownloadTestFile(modal.guide, modal.exercise)}
          onCancel={() => setModal(null)}
          loading={actionLoading}
        />
      )}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        message={deleteMessage}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
        loading={actionLoading}
      />
    </div>
  );
}
