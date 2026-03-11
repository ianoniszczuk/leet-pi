import { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '@/auth/components/ProtectedRoute';
import SessionExpiredModal from '@/shared/components/SessionExpiredModal';
import CodeEditor from '@/code/components/CodeEditor';
import ExerciseRankings from '@/code/components/ExerciseRankings';
import ExerciseSelector from '@/code/components/ExerciseSelector';
import ResultsPanel from '@/code/components/ResultsPanel';
import { useSubmission } from '@/shared/hooks/useApi';
import { useCachedAvailableExercises } from '@/shared/hooks/useCachedApi';
import { apiService } from '@/shared/services/api';
import { cacheService } from '@/shared/services/cacheService';
import { CACHE_KEYS, CACHE_CONFIG } from '@/shared/config/cache';
import logger from '@/shared/utils/logger';
import type { SubmissionResponse } from '@/code/types';
import type { AppSettings } from '@/shared/types';

const DEFAULT_CODE = `#include <stdio.h>

int main() {
    // Tu código aquí
    printf("Hello, World!\\n");
    return 0;
}`;

const getStorageKey = (guideNumber: number, exerciseNumber: number) =>
  `leet-pi-code-g${guideNumber}-e${exerciseNumber}`;

const getDefaultCode = (functionSignature?: string | null): string => {
  if (!functionSignature?.trim()) return DEFAULT_CODE;
  return `#include <stdio.h>\n\n${functionSignature.trim()} {\n    // Aquí debes escribir el código\n}`;
};

const getSavedCode = (guideNumber: number, exerciseNumber: number, functionSignature?: string | null): string =>
  localStorage.getItem(getStorageKey(guideNumber, exerciseNumber)) ?? getDefaultCode(functionSignature);

export default function SubmitCode() {
  const [formData, setFormData] = useState(() => ({
    exerciseNumber: 1,
    guideNumber: 1,
    code: getSavedCode(1, 1),
  }));
  const [result, setResult] = useState<SubmissionResponse | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  const [rankingsRefreshKey, setRankingsRefreshKey] = useState(0);
  const [githubIssuesUrl, setGithubIssuesUrl] = useState<string | null>(null);
  // Prevents the save effect from writing DEFAULT_CODE to localStorage before
  // the exercises effect has had a chance to set the correct initial code
  // (which may be a function signature template, not the Hello World fallback).
  const codeInitializedRef = useRef(false);
  const { submitSolution, loading, error } = useSubmission();
  const { data: availableExercises, loading: exercisesLoading, error: exercisesError } = useCachedAvailableExercises();

  // Fetch public settings (GitHub Issues URL) — con caché
  useEffect(() => {
    const cached = cacheService.get<AppSettings>(CACHE_KEYS.publicSettings);
    if (cached) {
      setGithubIssuesUrl(cached.githubIssuesUrl);
      return;
    }
    apiService.getPublicSettings().then(res => {
      if (res.success && res.data) {
        setGithubIssuesUrl(res.data.githubIssuesUrl);
        cacheService.set(CACHE_KEYS.publicSettings, res.data, CACHE_CONFIG.publicSettings);
      }
    }).catch(() => { /* silently ignore */ });
  }, []);

  // Save code to localStorage keyed by exercise whenever it changes.
  // Blocked until exercises have loaded and set the real initial code.
  useEffect(() => {
    if (!codeInitializedRef.current) return;
    localStorage.setItem(
      getStorageKey(formData.guideNumber, formData.exerciseNumber),
      formData.code,
    );
  }, [formData.guideNumber, formData.exerciseNumber, formData.code]);

  // Update form data when available exercises are loaded
  useEffect(() => {
    if (!availableExercises || availableExercises.length === 0) return;
    const firstGuide = availableExercises.find(g => g.exercises.length > 0);
    if (!firstGuide) return;
    const newGuide = firstGuide.guideNumber;
    const firstExercise = firstGuide.exercises[0];
    const newExercise = firstExercise.exerciseNumber;
    codeInitializedRef.current = true;
    setFormData(prev => ({
      ...prev,
      guideNumber: newGuide,
      exerciseNumber: newExercise,
      code: getSavedCode(newGuide, newExercise, firstExercise.functionSignature),
    }));
  }, [availableExercises]);

  // Detectar errores de sesión expirada
  useEffect(() => {
    if (error && error.includes('Sesión expirada')) {
      setShowSessionExpiredModal(true);
    }
  }, [error]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.code.trim()) {
      return;
    }

    try {
      setShowResults(true);
      setResult(null); // Limpiar resultado anterior
      const response = await submitSolution(formData);
      setResult(response);
      if (response?.overallStatus === 'approved') {
        setRankingsRefreshKey(prev => prev + 1);
      }
    } catch (error: any) {
      logger.error('Error submitting code:', error);
      setShowResults(true);
      // El error ya está manejado por el hook useSubmission
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // If guideNumber changes, reset exerciseNumber to first available exercise
      if (field === 'guideNumber' && availableExercises) {
        const selectedGuide = availableExercises.find(g => g.guideNumber === value);
        if (selectedGuide && selectedGuide.exercises.length > 0) {
          newData.exerciseNumber = selectedGuide.exercises[0].exerciseNumber;
        }
      }

      // When guide or exercise changes, load the saved code for that exercise
      if (field === 'guideNumber' || field === 'exerciseNumber') {
        const guide = availableExercises?.find(g => g.guideNumber === newData.guideNumber);
        const exercise = guide?.exercises.find(e => e.exerciseNumber === newData.exerciseNumber);
        newData.code = getSavedCode(newData.guideNumber, newData.exerciseNumber, exercise?.functionSignature);
      }

      return newData;
    });
  };

  // Get current guide's exercises
  const currentGuide = availableExercises?.find(g => g.guideNumber === formData.guideNumber);
  const currentExercises = currentGuide?.exercises || [];

  // Determine if code has been modified from the default template
  const currentExercise = currentGuide?.exercises.find(e => e.exerciseNumber === formData.exerciseNumber);
  const codeModified = formData.code !== getDefaultCode(currentExercise?.functionSignature);

  const resetEditor = () => {
    // Remove saved code so we get the original template
    localStorage.removeItem(getStorageKey(formData.guideNumber, formData.exerciseNumber));
    const guide = availableExercises?.find(g => g.guideNumber === formData.guideNumber);
    const exercise = guide?.exercises.find(e => e.exerciseNumber === formData.exerciseNumber);
    const originalCode = getDefaultCode(exercise?.functionSignature);
    setFormData(prev => ({ ...prev, code: originalCode }));
    setShowResults(false);
    setResult(null);
  };

  return (
    <ProtectedRoute>
      <SessionExpiredModal
        isOpen={showSessionExpiredModal}
        onClose={() => setShowSessionExpiredModal(false)}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              💻 Editor de Código
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Escribe tu código en C y envíalo para evaluación automática
            </p>
          </div>

          <ExerciseSelector
            guideNumber={formData.guideNumber}
            exerciseNumber={formData.exerciseNumber}
            availableExercises={availableExercises ?? null}
            currentExercises={currentExercises}
            exercisesLoading={exercisesLoading}
            exercisesError={exercisesError}
            githubIssuesUrl={githubIssuesUrl}
            onGuideChange={(value) => handleInputChange('guideNumber', value)}
            onExerciseChange={(value) => handleInputChange('exerciseNumber', value)}
          />

          {/* Code Editor and Results Container */}
          <div className="max-w-5xl mx-auto">
            <div className={`flex gap-6 transition-all duration-500 ${showResults ? 'flex-col lg:flex-row' : 'flex-row justify-center'
              }`}>
              {/* Code Editor */}
              <CodeEditor
                code={formData.code}
                loading={loading}
                codeModified={codeModified}
                showResults={showResults}
                onCodeChange={(value) => handleInputChange('code', value)}
                onSubmit={handleSubmit}
                onReset={resetEditor}
              />

              {/* Results Panel */}
              {showResults && (
                <div className="w-full lg:w-1/2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                  <ResultsPanel result={result} error={error} loading={loading} />
                </div>
              )}
            </div>
          </div>

          {/* Rankings */}
          <div className="max-w-5xl mx-auto mt-6">
            <ExerciseRankings
              guideNumber={formData.guideNumber}
              exerciseNumber={formData.exerciseNumber}
              refreshKey={rankingsRefreshKey}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

