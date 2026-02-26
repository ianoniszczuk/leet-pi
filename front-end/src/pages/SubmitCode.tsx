import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Code2, AlertCircle, CheckCircle, Play, Clock, HardDrive, TestTube, Terminal } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SessionExpiredModal from '@/components/ui/SessionExpiredModal';
import { useSubmission } from '@/hooks/useApi';
import { useCachedAvailableExercises } from '@/hooks/useCachedApi';
import type { SubmissionResponse } from '@/types';

export default function SubmitCode() {
  const [formData, setFormData] = useState({
    exerciseNumber: 1,
    guideNumber: 1,
    code: `#include <stdio.h>

int main() {
    // Tu código aquí
    printf("Hello, World!\\n");
    return 0;
}`,
  });
  const [result, setResult] = useState<SubmissionResponse | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  const { submitSolution, loading, error } = useSubmission();
  const { data: availableExercises, loading: exercisesLoading, error: exercisesError } = useCachedAvailableExercises();

  // Load saved code from localStorage on component mount
  useEffect(() => {
    const savedCode = localStorage.getItem('leet-pi-saved-code');
    if (savedCode) {
      setFormData(prev => ({ ...prev, code: savedCode }));
    }
  }, []);

  // Update form data when available exercises are loaded
  useEffect(() => {
    if (!availableExercises || availableExercises.length === 0) return;
    const firstGuide = availableExercises.find(g => g.exercises.length > 0);
    if (!firstGuide) return;
    setFormData(prev => ({
      ...prev,
      guideNumber: firstGuide.guideNumber,
      exerciseNumber: firstGuide.exercises[0].exerciseNumber,
    }));
  }, [availableExercises]);

  // Save code to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('leet-pi-saved-code', formData.code);
  }, [formData.code]);

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
    } catch (error: any) {
      console.error('Error submitting code:', error);
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

      return newData;
    });
  };

  // Get current guide's exercises
  const currentGuide = availableExercises?.find(g => g.guideNumber === formData.guideNumber);
  const currentExercises = currentGuide?.exercises || [];

  // Keyboard shortcut for submit (Ctrl+Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [formData]);

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
          <div className="max-w-4xl mx-auto mb-8">
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
          <div className="max-w-7xl mx-auto">
            <div className={`flex gap-6 transition-all duration-500 ${showResults ? 'flex-col lg:flex-row' : 'flex-row justify-center'
              }`}>
              {/* Code Editor */}
              <div className={`bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-500 ${showResults ? 'w-full lg:w-1/2' : 'w-full max-w-5xl'
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
                    <span className="text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                      Ctrl+Enter para enviar
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
                <div className="relative" style={{ height: '480px' }}>
                  <Editor
                    height="100%"
                    defaultLanguage="c"
                    theme="vs-dark"
                    value={formData.code}
                    onChange={(value: string | undefined) => handleInputChange('code', value ?? '')}
                    loading={
                      <div className="flex items-center justify-center h-full bg-gray-900">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    }
                    options={{
                      fontSize: 14,
                      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                      fontLigatures: true,
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

              {/* Results Panel */}
              {showResults && (
                <div className="w-full lg:w-1/2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                  <ResultsPanel result={result} error={error} loading={loading} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// Results Panel Component
function ResultsPanel({ result, error, loading }: { result: SubmissionResponse | null; error: string | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Evaluando tu código...</h3>
          <p className="text-gray-600">Por favor espera mientras procesamos tu solución</p>
        </div>
      </div>
    );
  }

  if (error && !result) {
    const isAuthError = error.includes('Sesión expirada') || error.includes('Authentication');

    return (
      <div className="p-6">
        <div className={`border-2 rounded-xl p-6 ${isAuthError
          ? 'bg-orange-50 border-orange-200'
          : 'bg-red-50 border-red-200'
          }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAuthError ? 'bg-orange-100' : 'bg-red-100'
              }`}>
              <AlertCircle className={`w-5 h-5 ${isAuthError ? 'text-orange-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className={`font-semibold text-lg ${isAuthError ? 'text-orange-700' : 'text-red-700'}`}>
                {isAuthError ? 'Problema de Autenticación' : 'Error al enviar'}
              </p>
              <p className={`text-sm ${isAuthError ? 'text-orange-600' : 'text-red-600'}`}>
                {isAuthError ? 'Tu sesión ha expirado' : 'Ocurrió un problema al procesar tu código'}
              </p>
            </div>
          </div>
          <div className={`p-3 rounded-lg ${isAuthError ? 'bg-orange-100' : 'bg-red-100'
            }`}>
            <p className={`font-mono text-sm ${isAuthError ? 'text-orange-700' : 'text-red-700'}`}>
              {error}
            </p>
            {isAuthError && (
              <p className="text-orange-600 text-sm mt-2">
                Haz clic en "Iniciar Sesión" para continuar.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Code2 className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Listo para evaluar</h3>
          <p className="text-gray-600">Envía tu código para ver los resultados aquí</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <TestTube className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">Resultados de Evaluación</h3>
              <p className="text-sm text-gray-600">Análisis completo de tu código</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${result.overallStatus === 'approved'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
              {result.overallStatus === 'approved' ? '✅ Aprobado' : '❌ Fallido'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Overall Status */}
        <div className={`p-6 rounded-xl border-2 ${result.overallStatus === 'approved'
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
          : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'
          }`}>
          <div className="flex items-center gap-4 mb-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${result.overallStatus === 'approved'
              ? 'bg-green-100'
              : 'bg-red-100'
              }`}>
              {result.overallStatus === 'approved' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
            <div>
              <h4 className={`text-xl font-bold ${result.overallStatus === 'approved' ? 'text-green-800' : 'text-red-800'
                }`}>
                {result.overallStatus === 'approved' ? '¡Excelente! Aprobado' : 'Necesita correcciones'}
              </h4>
              <p className={`text-sm ${result.overallStatus === 'approved' ? 'text-green-600' : 'text-red-600'
                }`}>
                {result.message}
              </p>
            </div>
          </div>
        </div>

        {/* Score and Performance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Score */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">📊</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Puntuación</h4>
                <p className="text-sm text-gray-600">Resultado general</p>
              </div>
            </div>
            <div className="text-center">
              <span className="text-4xl font-bold text-blue-600">
                {result.score}%
              </span>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${result.score}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>{result.passedTests} tests</span>
                <span>{result.totalTests} total</span>
              </div>
            </div>
          </div>

          {/* Time */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Tiempo</h4>
                <p className="text-sm text-gray-600">Ejecución</p>
              </div>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-purple-600">{result.executionTime}</span>
            </div>
          </div>

          {/* Memory */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Memoria</h4>
                <p className="text-sm text-gray-600">Uso de RAM</p>
              </div>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-orange-600">{result.memoryUsage}</span>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <TestTube className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">Test Cases</h3>
              <p className="text-sm text-gray-600">{result.passedTests} de {result.totalTests} tests pasaron</p>
            </div>
          </div>

          <div className="grid gap-4">
            {result.testResults.map((test, index) => (
              <div
                key={index}
                className={`p-5 rounded-xl border-2 ${test.passed
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                  : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
                  }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${test.passed ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                      <span className={`text-sm font-bold ${test.passed ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {test.testNumber}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Test Case {test.testNumber}</h4>
                      <p className="text-sm text-gray-600">Verificación de entrada y salida</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${test.passed
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                    {test.passed ? '✅ PASS' : '❌ FAIL'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      Tiempo de Ejecución
                    </h5>
                    <div className="font-mono text-sm bg-gray-50 p-3 rounded border">
                      {test.executionTime || 'N/A'}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      Error
                    </h5>
                    <div className={`font-mono text-sm p-3 rounded border ${test.error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
                      }`}>
                      {test.error || 'Sin errores'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compilation Error */}
        {result.compilationError && (
          <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Terminal className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-semibold text-red-800 text-lg">Error de Compilación</h4>
                <p className="text-sm text-red-600">El código no pudo compilar correctamente</p>
              </div>
            </div>
            <div className="bg-red-100 border border-red-200 rounded-lg p-4">
              <pre className="text-sm text-red-700 whitespace-pre-wrap font-mono">
                {result.compilationError}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
