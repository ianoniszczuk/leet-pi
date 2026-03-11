import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import ExerciseRow from './ExerciseRow';
import type { AdminGuide, AdminExercise } from '@/admin/types';

export interface GuideRowHandlers {
  onEdit: (g: AdminGuide) => void;
  onDelete: (g: AdminGuide) => void;
  onToggle: (g: AdminGuide) => Promise<void>;
  onToggleExercise: (g: AdminGuide, e: AdminExercise) => Promise<void>;
  onDeleteExercise: (g: AdminGuide, e: AdminExercise) => void;
  onEditExercise: (g: AdminGuide, e: AdminExercise) => void;
  onAddExercise: (g: AdminGuide) => void;
  onDownloadTestFile: (g: AdminGuide, e: AdminExercise) => void;
}

interface GuideRowProps {
  guide: AdminGuide;
  handlers: GuideRowHandlers;
}

export default function GuideRow({ guide, handlers }: GuideRowProps) {
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
