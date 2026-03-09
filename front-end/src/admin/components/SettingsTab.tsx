import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/shared/services/api';
import type { AppSetting } from '@/shared/types';

const SETTING_LABELS: Record<string, string> = {
  github_issues_url: 'GitHub Issues URL',
};

function labelFor(key: string): string {
  return SETTING_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

interface EditModalProps {
  setting: AppSetting;
  onSave: (key: string, value: string | null) => Promise<void>;
  onClose: () => void;
}

function EditSettingModal({ setting, onSave, onClose }: EditModalProps) {
  const [value, setValue] = useState(setting.value ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(setting.key, value.trim() || null);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Editar: {labelFor(setting.key)}
        </h2>
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="(vacío para deshabilitar)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsTab() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSetting, setEditingSetting] = useState<AppSetting | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getAllSettings();
      if (res.success && res.data) {
        setSettings(res.data);
      } else {
        setError(res.error?.message ?? 'Error al cargar configuración');
      }
    } catch (e: any) {
      setError(e.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async (key: string, value: string | null) => {
    const res = await apiService.updateSetting(key, value);
    if (!res.success) throw new Error(res.error?.message ?? 'Error al guardar');
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        {error}
      </div>
    );
  }

  return (
    <>
      {editingSetting && (
        <EditSettingModal
          setting={editingSetting}
          onSave={handleSave}
          onClose={() => setEditingSetting(null)}
        />
      )}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 font-semibold text-gray-600">Clave</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-600">Valor</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {settings.map(setting => (
              <tr key={setting.key} className="border-b border-gray-100 last:border-0">
                <td className="px-6 py-4 font-medium text-gray-800">{labelFor(setting.key)}</td>
                <td className="px-6 py-4 text-gray-600 break-all max-w-xs">
                  {setting.value ?? <span className="text-gray-400 italic">—</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setEditingSetting(setting)}
                    className="text-primary-600 hover:text-primary-800 font-medium transition-colors"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {settings.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-400">
                  No hay configuraciones disponibles
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
