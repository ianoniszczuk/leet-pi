import { Code2, AlertCircle, CheckCircle, Clock, HardDrive, TestTube, Terminal } from 'lucide-react';
import type { SubmissionResponse } from '@/types';

/**
 * Parse the stderr assert message to extract a human-readable description.
 * We extract the assertion expression and optional message.
 */
function parseAssertError(error: string): { expression: string; message: string | null } | null {
    // Match: Assertion `<expression>' failed.
    const match = error.match(/Assertion [`'](.+?)[''] failed/);
    if (!match) return null;

    const raw = match[1];

    // Check for the && "message" pattern
    const msgMatch = raw.match(/^(.+?)\s*&&\s*"(.+?)"$/);
    if (msgMatch) {
        return { expression: msgMatch[1].trim(), message: msgMatch[2] };
    }

    return { expression: raw, message: null };
}

interface ResultsPanelProps {
    result: SubmissionResponse | null;
    error: string | null;
    loading: boolean;
}

export default function ResultsPanel({ result, error, loading }: ResultsPanelProps) {
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

    // Find the first failed test with error details
    const failedTest = result.testResults?.find(t => !t.passed && t.error);
    const parsedAssert = failedTest?.error ? parseAssertError(failedTest.error) : null;

    return (
        <div className="h-full flex flex-col">
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
            <div className="flex-1 flex flex-col gap-6 p-6">
                {/* Overall Status */}
                <div className={`p-6 rounded-xl border-2 ${result.overallStatus === 'approved'
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                    : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'
                    }`}>
                    <div className="flex items-center justify-center gap-4">
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
                        </div>
                    </div>
                </div>

                {/* Score and Performance */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Time */}
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-5 border border-purple-200 flex flex-col overflow-hidden">
                        <div className="flex flex-col items-center gap-2 mb-4">
                            <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                                <Clock className="w-7 h-7 text-purple-600" />
                            </div>
                            <h4 className="font-bold text-gray-900 text-xl whitespace-nowrap">Tiempo</h4>
                        </div>
                        <div className="flex-1 flex items-center justify-center text-center">
                            <span className="text-3xl font-bold text-purple-600">{result.executionTime}</span>
                        </div>
                    </div>

                    {/* Memory */}
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-200 flex flex-col overflow-hidden">
                        <div className="flex flex-col items-center gap-2 mb-4">
                            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center">
                                <HardDrive className="w-7 h-7 text-orange-600" />
                            </div>
                            <h4 className="font-bold text-gray-900 text-xl whitespace-nowrap">Memoria</h4>
                        </div>
                        <div className="flex-1 flex items-center justify-center text-center">
                            <span className="text-3xl font-bold text-orange-600">{result.memoryUsage}</span>
                        </div>
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

                {/* Failed Test Details */}
                {!result.compilationError && failedTest && (
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <Terminal className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-red-800 text-lg">Test Fallido</h4>
                                <p className="text-sm text-red-600">Un test no pasó la evaluación</p>
                            </div>
                        </div>
                        <div className="bg-red-100 border border-red-200 rounded-lg p-4">
                            {parsedAssert ? (
                                <div className="space-y-2">
                                    {parsedAssert.message && (
                                        <p className="text-sm font-semibold text-red-800">
                                            {parsedAssert.message}
                                        </p>
                                    )}
                                    <pre className="text-sm text-red-700 whitespace-pre-wrap font-mono">
                                        Assertion fallido: {parsedAssert.expression}
                                    </pre>
                                </div>
                            ) : (
                                <pre className="text-sm text-red-700 whitespace-pre-wrap font-mono">
                                    {failedTest.error}
                                </pre>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
