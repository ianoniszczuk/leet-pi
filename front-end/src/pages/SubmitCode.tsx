import { useState } from 'react';
import { Code2, Send, AlertCircle, CheckCircle } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useSubmission } from '@/hooks/useApi';
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
  const { submitSolution, loading, error } = useSubmission();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await submitSolution(formData);
      setResult(response);
    } catch (error) {
      console.error('Error submitting code:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Enviar Solución
          </h1>
          <p className="text-gray-600">
            Escribe tu código en C y envíalo para evaluación automática.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Exercise and Guide Numbers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="guideNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Guía
                  </label>
                  <input
                    type="number"
                    id="guideNumber"
                    min="1"
                    value={formData.guideNumber}
                    onChange={(e) => handleInputChange('guideNumber', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="exerciseNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Ejercicio
                  </label>
                  <input
                    type="number"
                    id="exerciseNumber"
                    min="1"
                    value={formData.exerciseNumber}
                    onChange={(e) => handleInputChange('exerciseNumber', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Code Editor */}
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Código en C
                </label>
                <textarea
                  id="code"
                  rows={15}
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                  placeholder="#include <stdio.h>&#10;&#10;int main() {&#10;    // Tu código aquí&#10;    return 0;&#10;}"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar Solución
                  </>
                )}
              </button>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-700 font-medium">Error al enviar</p>
                  </div>
                  <p className="text-red-600 mt-1">{error}</p>
                </div>
              )}
            </form>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Code2 className="w-5 h-5" />
              Resultados
            </h2>

            {!result && !error && (
              <div className="text-center py-8">
                <Code2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Envía tu código para ver los resultados aquí
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Overall Status */}
                <div className={`p-4 rounded-lg border ${
                  result.overallStatus === 'approved' 
                    ? 'bg-success-50 border-success-200' 
                    : 'bg-danger-50 border-danger-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {result.overallStatus === 'approved' ? (
                      <CheckCircle className="w-5 h-5 text-success-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-danger-600" />
                    )}
                    <span className={`font-semibold ${
                      result.overallStatus === 'approved' ? 'text-success-700' : 'text-danger-700'
                    }`}>
                      {result.overallStatus === 'approved' ? 'Aprobado' : 'Reprobado'}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    result.overallStatus === 'approved' ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {result.message}
                  </p>
                </div>

                {/* Score */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">Puntuación</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {result.score}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${result.score}%` }}
                    />
                  </div>
                </div>

                {/* Test Results */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">
                    Resultados de Tests ({result.passedTests}/{result.totalTests})
                  </h3>
                  <div className="space-y-2">
                    {result.testResults.map((test, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          test.passed 
                            ? 'bg-success-50 border-success-200' 
                            : 'bg-danger-50 border-danger-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`w-2 h-2 rounded-full ${
                            test.passed ? 'bg-success-500' : 'bg-danger-500'
                          }`} />
                          <span className="font-medium text-sm">
                            Test {test.testNumber}
                          </span>
                        </div>
                        <div className="text-xs space-y-1">
                          <div>
                            <span className="font-medium">Entrada:</span> {test.input}
                          </div>
                          <div>
                            <span className="font-medium">Esperado:</span> {test.expectedOutput}
                          </div>
                          <div>
                            <span className="font-medium">Obtenido:</span> {test.actualOutput}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compilation Error */}
                {result.compilationError && (
                  <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                    <h4 className="font-medium text-danger-700 mb-2">Error de Compilación</h4>
                    <pre className="text-sm text-danger-600 whitespace-pre-wrap">
                      {result.compilationError}
                    </pre>
                  </div>
                )}

                {/* Performance Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2">Rendimiento</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Tiempo de ejecución:</span>
                      <span className="font-medium ml-2">{result.executionTime}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Uso de memoria:</span>
                      <span className="font-medium ml-2">{result.memoryUsage}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
