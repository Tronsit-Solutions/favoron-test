import { Globe, Shield, DollarSign, Users } from "lucide-react";

const PlatformDescriptionSection = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200/20 rounded-full blur-2xl"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-200/20 rounded-full blur-2xl"></div>
      
      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            ¿Qué es <span className="bg-gradient-to-r from-traveler to-shopper bg-clip-text text-transparent">Favoron</span>?
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-traveler to-shopper mx-auto rounded-full"></div>
        </div>

        {/* Main description */}
        <div className="text-center mb-12">
          <p className="text-xl sm:text-2xl text-gray-700 leading-relaxed max-w-4xl mx-auto font-medium">
            La plataforma que conecta compradores que necesitan productos del extranjero 
            con viajeros dispuestos a traerlos de forma <span className="text-blue-800 font-semibold">segura</span>, 
            <span className="text-green-600 font-semibold"> económica</span> y 
            <span className="text-cyan-500 font-semibold"> confiable</span>.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center shadow-sm border border-white/50 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Global</h3>
            <p className="text-sm text-gray-600">Productos de cualquier parte del mundo</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center shadow-sm border border-white/50 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Seguro</h3>
            <p className="text-sm text-gray-600">Verificación y protección garantizada</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center shadow-sm border border-white/50 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Económico</h3>
            <p className="text-sm text-gray-600">Precios justos y transparentes</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center shadow-sm border border-white/50 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Confiable</h3>
            <p className="text-sm text-gray-600">Comunidad verificada y activa</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformDescriptionSection;