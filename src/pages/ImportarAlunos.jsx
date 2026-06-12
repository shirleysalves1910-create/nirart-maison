import { useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { MOCK_SCHOOLS, MOCK_CLASSES } from '../data/mockData'
import { Image, FileText, CheckCircle } from 'lucide-react'

export default function ImportarAlunos() {
  const [schoolId, setSchoolId] = useState('')
  const [classId, setClassId] = useState('')
  const [fileName, setFileName] = useState('')
  const [previewNames, setPreviewNames] = useState([])
  const [pastedNames, setPastedNames] = useState('')
  const [ocrMode, setOcrMode] = useState(false)
  const [importResult, setImportResult] = useState(null)

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const extension = file.name.split('.').pop()?.toLowerCase()

    if (extension === 'csv') {
      const text = await file.text()
      const names = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
      setPreviewNames(names)
      setOcrMode(false)
    } else if (extension === 'xlsx' || extension === 'xls') {
      setPreviewNames(['Lista de alunos importada do arquivo Excel (mock)'])
      setOcrMode(false)
    } else if (['png', 'jpg', 'jpeg'].includes(extension || '')) {
      setPreviewNames(['Ana Beatriz Souza', 'Bruno Lima', 'Carla Nunes'])
      setOcrMode(true)
    } else {
      setPreviewNames([])
      setOcrMode(false)
    }
  }

  const handlePasteChange = (event) => {
    const value = event.target.value
    setPastedNames(value)
    const names = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    setPreviewNames(names)
    setOcrMode(false)
  }

  const handleConfirm = () => {
    if (!schoolId || !classId || !previewNames.length) return
    const identified = previewNames.length
    const imported = Math.max(0, identified - Math.floor(identified * 0.15))
    const errors = identified - imported
    setImportResult({ identified, imported, errors, schoolId: Number(schoolId), classId: Number(classId) })
    setFileName('')
    setPastedNames('')
    setPreviewNames([])
    setOcrMode(false)
  }

  const selectedSchool = MOCK_SCHOOLS.find((item) => item.id === Number(schoolId))
  const selectedClass = MOCK_CLASSES.find((item) => item.id === Number(classId))

  return (
    <MainLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-nirart-text">Importar Alunos</h1>
          <p className="text-gray-600 text-sm mt-1">Selecione a escola, turma e importe a lista de alunos.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Escola</label>
              <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">Selecione a escola</option>
                {MOCK_SCHOOLS.map((school) => (
                  <option key={school.id} value={school.id}>{school.fantasyName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Turma</label>
              <select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">Selecione a turma</option>
                {MOCK_CLASSES.filter((item) => !schoolId || item.schoolId === Number(schoolId)).map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700">Upload de arquivo</label>
            <input type="file" accept=".csv,.xlsx,.xls,.png,.jpg,.jpeg" onChange={handleFileChange} className="w-full text-sm text-gray-700" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Ou cole a lista de nomes</p>
            <textarea
              value={pastedNames}
              onChange={handlePasteChange}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Cole cada nome em uma nova linha"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 flex items-center gap-3">
              <Image className="text-blue-500" size={20} />
              <div>
                <p className="font-semibold text-gray-700">Upload de imagem (OCR mockado)</p>
                <p className="text-sm text-gray-600">Envie uma foto contendo nomes e veja a prévia gerada.</p>
              </div>
            </div>
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 flex items-center gap-3">
              <FileText className="text-green-500" size={20} />
              <div>
                <p className="font-semibold text-gray-700">Upload de Excel / CSV</p>
                <p className="text-sm text-gray-600">O CSV é convertido automaticamente; o Excel é simulado como importação mock.</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-gray-800">Prévia de alunos</p>
              {ocrMode && <span className="text-sm text-blue-600">OCR mockado ativado</span>}
            </div>
            {previewNames.length === 0 ? (
              <p className="text-gray-500">Nenhum aluno selecionado ainda. Faça upload ou cole os nomes acima.</p>
            ) : (
              <ul className="space-y-2">
                {previewNames.map((name, index) => (
                  <li key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-3">{name}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600">Arquivo selecionado: <span className="font-medium text-gray-800">{fileName || 'Nenhum arquivo'}</span></p>
              {selectedSchool && selectedClass && (
                <p className="text-sm text-gray-600 mt-1">Importando para <span className="font-medium">{selectedSchool.fantasyName}</span> / <span className="font-medium">{selectedClass.name}</span></p>
              )}
            </div>
            <Button variant="primary" onClick={handleConfirm} disabled={!schoolId || !classId || previewNames.length === 0}>Confirmar Importação</Button>
          </div>

          {importResult && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} />
                  <div>
                    <p className="font-semibold">Importação concluída</p>
                    <p className="text-sm text-green-800">{importResult.identified} alunos identificados.</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm text-green-900">
                  <div className="rounded-lg bg-white p-3 text-center">
                    <p className="font-semibold">Total identificado</p>
                    <p>{importResult.identified}</p>
                  </div>
                  <div className="rounded-lg bg-white p-3 text-center">
                    <p className="font-semibold">Total importado</p>
                    <p>{importResult.imported}</p>
                  </div>
                  <div className="rounded-lg bg-white p-3 text-center">
                    <p className="font-semibold">Total com erro</p>
                    <p>{importResult.errors}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
