interface QuickActionsCardProps {
    submitHref?: string;
    submissionsHref?: string;
}

export default function QuickActionsCard({
    submitHref = '/submit',
    submissionsHref = '/submissions',
}: QuickActionsCardProps) {
    return (
        <div className="bg-primary-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">Acciones Rápidas</h3>
            <div className="space-y-3">
                <a
                    href={submitHref}
                    className="block w-full bg-primary-600 hover:bg-primary-700 text-white text-center font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                    Enviar Nuevo Código
                </a>
                <a
                    href={submissionsHref}
                    className="block w-full bg-white hover:bg-gray-50 text-primary-600 text-center font-medium py-2 px-4 rounded-lg border border-primary-600 transition-colors duration-200"
                >
                    Ver Todos los Envíos
                </a>
            </div>
        </div>
    );
}
