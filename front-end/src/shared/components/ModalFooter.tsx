import { Loader2 } from 'lucide-react';

interface ModalFooterProps {
  onCancel: () => void;
  loading: boolean;
  confirmLabel: string;
}

export default function ModalFooter({ onCancel, loading, confirmLabel }: ModalFooterProps) {
  return (
    <div className="flex gap-3 justify-end pt-2">
      <button type="button" onClick={onCancel} disabled={loading}
        className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
        Cancelar
      </button>
      <button type="submit" disabled={loading}
        className="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {confirmLabel}
      </button>
    </div>
  );
}

export type { ModalFooterProps };
