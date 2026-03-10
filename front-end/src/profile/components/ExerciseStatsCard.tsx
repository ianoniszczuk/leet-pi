import { Award } from 'lucide-react';

interface ExerciseStat {
    guideNumber: number;
    exerciseNumber: number;
    total: number;
    successful: number;
}

interface ExerciseStatsCardProps {
    exerciseStats: Record<string, ExerciseStat>;
}

export default function ExerciseStatsCard({ exerciseStats }: ExerciseStatsCardProps) {
    const entries = Object.values(exerciseStats);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Estadísticas por Ejercicio
            </h3>

            {entries.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                    No hay envíos aún. ¡Envía tu primera solución!
                </p>
            ) : (
                <div className="space-y-3">
                    {entries.map((exercise, index) => {
                        const rate = Math.round((exercise.successful / exercise.total) * 100);
                        return (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">
                                        Guía {exercise.guideNumber} - Ejercicio {exercise.exerciseNumber}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {exercise.successful}/{exercise.total} éxitos
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${rate}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 w-12 text-right">
                                        {rate}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
