import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import apiService from '@/shared/services/api';

interface TestsTabProps {
  currentUserEmail: string;
}

export default function TestsTab({ currentUserEmail }: TestsTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleSendAlert() {
    setIsLoading(true);
    setResult(null);
    try {
      const data = await apiService.testSendDeadlineAlert(currentUserEmail);
      setResult({
        success: true,
        message: `Email enviado a ${data.data?.sentTo} para la Guía ${data.data?.guideNumber}.`,
      });
    } catch (err: any) {
      const message = err?.response?.data?.error?.message ?? 'Error al enviar el email.';
      setResult({ success: false, message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Prueba de alerta por email</h2>
      <p className="text-sm text-gray-500 mb-4">
        Envía un email de alerta de deadline a tu cuenta ({currentUserEmail || '—'}) usando la primera guía con deadline y ejercicios habilitados.
      </p>

      <button
        onClick={handleSendAlert}
        disabled={isLoading || !currentUserEmail}
        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <FlaskConical className="w-4 h-4" />
        {isLoading ? 'Enviando...' : 'Probar alerta'}
      </button>

      {result && (
        <div className={`mt-4 rounded-lg px-4 py-3 text-sm ${result.success ? 'bg-success-50 text-success-800 border border-success-200' : 'bg-danger-50 text-danger-800 border border-danger-200'}`}>
          {result.message}
        </div>
      )}
    </div>
  );
}
