#!/bin/bash

# Scripts de utilidad para Scrum Poker
# Ejecutar desde la raíz del proyecto

echo "🎯 Scrum Poker - Scripts de Utilidad"
echo "=================================="

show_help() {
    echo "Comandos disponibles:"
    echo ""
    echo "🚀 Desarrollo:"
    echo "  npm run dev                 - Ejecutar backend + frontend en desarrollo"
    echo "  npm run start:backend:dev   - Solo backend en desarrollo"
    echo "  npm run start:frontend:dev  - Solo frontend en desarrollo"
    echo ""
    echo "🧪 QA:"
    echo "  npm run qa                  - Ejecutar backend + frontend en QA"
    echo "  npm run start:backend:qa    - Solo backend en QA"
    echo "  npm run start:frontend:qa   - Solo frontend en QA"
    echo ""
    echo "🏭 Producción:"
    echo "  npm run prod                - Ejecutar backend + frontend en producción"
    echo "  npm run start:backend:prod  - Solo backend en producción"
    echo "  npm run start:frontend:prod - Solo frontend en producción"
    echo ""
    echo "📦 Build:"
    echo "  npm run build:dev           - Build frontend para desarrollo"
    echo "  npm run build:qa            - Build frontend para QA"
    echo "  npm run build:prod          - Build frontend para producción"
    echo ""
    echo "🔧 Utilidades:"
    echo "  npm run install:all         - Instalar todas las dependencias"
    echo ""
    echo "📁 Estructura de archivos de configuración:"
    echo "  packages/backend/.env.development"
    echo "  packages/backend/.env.qa"
    echo "  packages/backend/.env.production"
    echo "  packages/frontend/.env.development"
    echo "  packages/frontend/.env.qa"
    echo "  packages/frontend/.env.production"
}

check_environment() {
    echo "🔍 Verificando entorno..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js no está instalado"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ NPM no está instalado"
        exit 1
    fi
    
    echo "✅ Node.js: $(node --version)"
    echo "✅ NPM: $(npm --version)"
}

install_all() {
    echo "📦 Instalando dependencias..."
    npm run install:all
    echo "✅ Dependencias instaladas"
}

# Función principal
main() {
    case "$1" in
        "help"|"-h"|"--help"|"")
            show_help
            ;;
        "check")
            check_environment
            ;;
        "install")
            install_all
            ;;
        *)
            echo "❌ Comando no reconocido: $1"
            echo "💡 Usa: $0 help"
            exit 1
            ;;
    esac
}

main "$@"