import { Link } from 'react-router-dom';
import { Code2, CheckCircle, Users, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  const features = [
    {
      icon: Code2,
      title: 'Evaluación Automática',
      description: 'Envía tu código en C y recibe feedback inmediato con resultados detallados.',
    },
    {
      icon: CheckCircle,
      title: 'Tests Completos',
      description: 'Cada ejercicio incluye casos de prueba exhaustivos para validar tu solución.',
    },
    {
      icon: Users,
      title: 'Seguimiento de Progreso',
      description: 'Monitorea tu progreso y revisa tus envíos anteriores en cualquier momento.',
    },
    {
      icon: Zap,
      title: 'Resultados Instantáneos',
      description: 'Obtén resultados en segundos con información detallada sobre rendimiento.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Bienvenido a{' '}
              <span className="text-primary-600">Leet PI</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Plataforma de evaluación automática para ejercicios de programación en C. 
              Envía tu código y recibe feedback instantáneo con resultados detallados.
            </p>
            
            {isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Enviar Código
                </Link>
                <Link
                  to="/submissions"
                  className="bg-white hover:bg-gray-50 text-primary-600 font-medium py-3 px-6 rounded-lg border border-primary-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Ver Mis Envíos
                </Link>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  ¡Inicia sesión para comenzar!
                </h3>
                <p className="text-blue-700 mb-4">
                  Usa el botón de "Iniciar Sesión" en la esquina superior derecha para acceder al sistema.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Características Principales
            </h2>
            <p className="text-lg text-gray-600">
              Todo lo que necesitas para mejorar tus habilidades de programación
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Cómo Funciona?
            </h2>
            <p className="text-lg text-gray-600">
              Proceso simple en 3 pasos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Inicia Sesión
              </h3>
              <p className="text-gray-600">
                Usa tu cuenta de Auth0 para acceder al sistema de forma segura.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Envía tu Código
              </h3>
              <p className="text-gray-600">
                Escribe tu solución en C y envíala especificando el ejercicio y guía.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Recibe Feedback
              </h3>
              <p className="text-gray-600">
                Obtén resultados instantáneos con detalles de cada test y sugerencias.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
