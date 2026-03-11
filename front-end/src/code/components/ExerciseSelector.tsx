import { AlertCircle, Github } from 'lucide-react';
import type { GuideWithExercises, AvailableExercise } from '@/shared/types';

interface ExerciseSelectorProps {
    guideNumber: number;
    exerciseNumber: number;
    availableExercises: GuideWithExercises[] | null;
    currentExercises: AvailableExercise[];
    exercisesLoading: boolean;
    exercisesError: string | null;
    githubIssuesUrl: string | null;
    onGuideChange: (value: number) => void;
    onExerciseChange: (value: number) => void;
}

export default function ExerciseSelector({
    guideNumber,
    exerciseNumber,
    availableExercises,
    currentExercises,
    exercisesLoading,
    exercisesError,
    githubIssuesUrl,
    onGuideChange,
    onExerciseChange,
}: ExerciseSelectorProps) {
    return (
        <div className="max-w-5xl mx-auto mb-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                {exercisesError && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <span className="text-red-700 font-medium">Error al cargar ejercicios</span>
                        </div>
                        <p className="text-red-600 text-sm mt-1">{exercisesError}</p>
                    </div>
                )}
                <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-6 w-full">
                    <div className="flex items-center gap-2 sm:gap-3 max-w-full w-full sm:w-auto justify-between sm:justify-start">
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <div className="w-3 h-3 bg-blue-500 rounded-full shrink-0"></div>
                            <label htmlFor="guideNumber" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                                Guía
                            </label>
                        </div>
                        <select
                            id="guideNumber"
                            value={guideNumber}
                            onChange={(e) => onGuideChange(parseInt(e.target.value))}
                            disabled={exercisesLoading}
                            className="flex-1 sm:flex-none w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-2 border-2 border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed min-w-0"
                        >
                            {exercisesLoading ? (
                                <option>Cargando guías...</option>
                            ) : availableExercises && availableExercises.length > 0 ? (
                                availableExercises.map(guide => (
                                    <option key={guide.guideNumber} value={guide.guideNumber}>
                                        Guía {guide.guideNumber} ({guide.exercises.length} ejercicios)
                                    </option>
                                ))
                            ) : (
                                <option>No hay guías disponibles</option>
                            )}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 max-w-full w-full sm:w-auto justify-between sm:justify-start">
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <div className="w-3 h-3 bg-green-500 rounded-full shrink-0"></div>
                            <label htmlFor="exerciseNumber" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                                Ejercicio
                            </label>
                        </div>
                        <select
                            id="exerciseNumber"
                            value={exerciseNumber}
                            onChange={(e) => onExerciseChange(parseInt(e.target.value))}
                            disabled={exercisesLoading || currentExercises.length === 0}
                            className="flex-1 sm:flex-none w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-2 border-2 border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed min-w-0"
                        >
                            {exercisesLoading ? (
                                <option>Cargando ejercicios...</option>
                            ) : currentExercises.length > 0 ? (
                                currentExercises.map(exercise => (
                                    <option key={exercise.exerciseNumber} value={exercise.exerciseNumber}>
                                        Ejercicio {exercise.exerciseNumber}
                                    </option>
                                ))
                            ) : (
                                <option>No hay ejercicios disponibles</option>
                            )}
                        </select>
                    </div>

                    {githubIssuesUrl && (
                        <a
                            href={githubIssuesUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors shadow-lg shrink-0 w-full sm:w-auto"
                        >
                            <Github className="w-4 h-4 shrink-0" />
                            <span>Consultas</span>
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
