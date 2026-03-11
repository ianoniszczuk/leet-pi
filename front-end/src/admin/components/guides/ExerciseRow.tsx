import { useState } from 'react';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import type { AdminExercise } from '@/admin/types';

interface ExerciseRowProps {
  exercise: AdminExercise;
  onToggle: (e: AdminExercise) => Promise<void>;
  onDelete: (e: AdminExercise) => void;
  onEdit: (e: AdminExercise) => void;
}

export default function ExerciseRow({ exercise, onToggle, onDelete, onEdit }: ExerciseRowProps) {
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
        {exercise.hasTestFile && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600" title="Tiene archivo de test">
            test
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
