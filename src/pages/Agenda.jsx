import MainLayout from '../layouts/MainLayout'
import { Calendar } from 'lucide-react'

export default function Agenda() {
  return (
    <MainLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-nirart-text">Agenda</h1>
          <p className="text-gray-600 text-sm mt-1">Visualizar agenda de eventos</p>
        </div>
        <div className="bg-nirart-card rounded-lg border border-gray-200 p-12 shadow-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-lg mb-4">
            <Calendar size={32} className="text-gray-400" />
          </div>
          <p className="text-nirart-text text-lg font-semibold">Este módulo será disponibilizado em breve</p>
          <p className="text-gray-600 text-sm mt-2">Volte mais tarde para visualizar a agenda</p>
        </div>
      </div>
    </MainLayout>
  )
}
