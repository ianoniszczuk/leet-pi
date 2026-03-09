import { useState, useEffect, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { Code2, AlertCircle, Play, Github } from 'lucide-react';
import ProtectedRoute from '@/auth/components/ProtectedRoute';
import SessionExpiredModal from '@/shared/components/SessionExpiredModal';
import ExerciseRankings from '@/code/components/ExerciseRankings';
import ResultsPanel from '@/code/components/ResultsPanel';
import { useSubmission } from '@/shared/hooks/useApi';
import { useCachedAvailableExercises } from '@/shared/hooks/useCachedApi';
import { apiService } from '@/shared/services/api';
import logger from '@/shared/utils/logger';
import type { SubmissionResponse } from '@/code/types';

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
  const handleSubmitRef = useRef<() => void>(() => { });
  // Prevents the save effect from writing DEFAULT_CODE to localStorage before
  // the exercises effect has had a chance to set the correct initial code
  // (which may be a function signature template, not the Hello World fallback).
  const codeInitializedRef = useRef(false);
  const { submitSolution, loading, error } = useSubmission();
  const { data: availableExercises, loading: exercisesLoading, error: exercisesError } = useCachedAvailableExercises();

  // Fetch public settings (GitHub Issues URL)
  useEffect(() => {
    apiService.getPublicSettings().then(res => {
      if (res.success && res.data) setGithubIssuesUrl(res.data.githubIssuesUrl);
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

  // Keep ref updated so the Monaco command always calls the latest handleSubmit
  handleSubmitRef.current = handleSubmit;

  // Monaco onMount: register Ctrl+Enter inside the editor
  const handleEditorMount: OnMount = (editor, monaco) => {
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => handleSubmitRef.current(),
    );
  };

  // Keyboard shortcut for submit (Ctrl+Enter) when focus is outside Monaco
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmitRef.current();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []); // handleSubmitRef is stable (a ref), no need to list formData as dep

  const resetEditor = () => {
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

          {/* Sophisticated Selectors */}
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
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <label htmlFor="guideNumber" className="text-sm font-semibold text-gray-700">
                    Seleccionar Guía
                  </label>
                  <select
                    id="guideNumber"
                    value={formData.guideNumber}
                    onChange={(e) => handleInputChange('guideNumber', parseInt(e.target.value))}
                    disabled={exercisesLoading}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
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

                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <label htmlFor="exerciseNumber" className="text-sm font-semibold text-gray-700">
                    Seleccionar Ejercicio
                  </label>
                  <select
                    id="exerciseNumber"
                    value={formData.exerciseNumber}
                    onChange={(e) => handleInputChange('exerciseNumber', parseInt(e.target.value))}
                    disabled={exercisesLoading || currentExercises.length === 0}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
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

              </div>
            </div>
          </div>

          {/* Code Editor and Results Container */}
          <div className="max-w-5xl mx-auto">
            <div className={`flex gap-6 transition-all duration-500 ${showResults ? 'flex-col lg:flex-row' : 'flex-row justify-center'
              }`}>
              {/* Code Editor */}
              <div className={`bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-500 flex flex-col ${showResults ? 'w-full lg:w-1/2' : 'w-full max-w-5xl'
                }`}>

                {/* Editor Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Code2 className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-semibold text-gray-700">main.c</span>
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">C</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {githubIssuesUrl && (
                      <a
                        href={githubIssuesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
                      >
                        <Github className="w-4 h-4" />
                        <span className="hidden sm:inline">Consultas</span>
                      </a>
                    )}
                    <div className="relative group/submit flex items-center">
                      <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded-full whitespace-nowrap opacity-0 group-hover/submit:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                        Ctrl+Enter
                      </span>
                      <button
                        onClick={handleSubmit}
                        disabled={loading || !formData.code.trim()}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span className="hidden sm:inline">Evaluando...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            <span className="hidden sm:inline">Enviar</span>
                          </>
                        )}
                      </button>
                    </div>
                    {showResults && (
                      <button
                        onClick={resetEditor}
                        className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                </div>

                {/* Monaco Code Editor */}
                <div className="relative flex-1" style={{ minHeight: '480px' }}>
                  <div className="absolute inset-0">
                    <Editor
                      height="100%"
                      defaultLanguage="c"
                      theme="vs-dark"
                      value={formData.code}
                      onChange={(value: string | undefined) => handleInputChange('code', value ?? '')}
                      onMount={handleEditorMount}
                      loading={
                        <div className="flex items-center justify-center h-full bg-gray-900">
                          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      }
                      options={{
                        fontSize: 14,
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                        fontLigatures: false,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        tabSize: 4,
                        insertSpaces: true,
                        autoIndent: 'full',
                        formatOnPaste: true,
                        formatOnType: true,
                        bracketPairColorization: { enabled: false },
                        guides: { bracketPairs: false },
                        suggestOnTriggerCharacters: true,
                        quickSuggestions: { other: true, comments: false, strings: false },
                        padding: { top: 16, bottom: 16 },
                        renderLineHighlight: 'all',
                        smoothScrolling: true,
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                      }}
                    />
                  </div>
                </div>
              </div>

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

