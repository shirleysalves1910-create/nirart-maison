import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  LoaderCircle,
  Trash2
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { importarAlunos } from '../services/alunos'
import { listarEscolas } from '../services/escolas'
import { listarTurmas } from '../services/turmas'

export default function ImportarAlunos() {
  const fileInputRef = useRef(null)
  const submitLockRef = useRef(false)
  const [schools, setSchools] = useState([])
  const [classes, setClasses] = useState([])
  const [schoolId, setSchoolId] = useState('')
  const [classId, setClassId] = useState('')
  const [fileName, setFileName] = useState('')
  const [previewNames, setPreviewNames] = useState([])
  const [pastedNames, setPastedNames] = useState('')
  const [loading, setLoading] = useState(true)
  const [readingFile, setReadingFile] = useState(false)
  const [importing, setImporting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [importResult, setImportResult] = useState(null)

  useEffect(() => {
    let active = true

    const loadData = async () => {
      setLoading(true)
      setErrorMessage('')
      try {
        const [schoolsData, classesData] = await Promise.all([
          listarEscolas(),
          listarTurmas()
        ])
        if (!active) return
        setSchools(schoolsData)
        setClasses(classesData)
      } catch (error) {
        if (active) {
          setErrorMessage(getErrorMessage(error, 'Não foi possível carregar escolas e turmas.'))
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [])

  const availableClasses = useMemo(() => (
    classes.filter((classData) => classData.schoolId === schoolId)
  ), [classes, schoolId])

  const selectedSchool = schools.find((school) => school.id === schoolId)
  const selectedClass = classes.find((classData) => classData.id === classId)

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setReadingFile(true)
    setErrorMessage('')
    setImportResult(null)
    setFileName(file.name)
    setPastedNames('')

    try {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!['csv', 'xlsx', 'xls'].includes(extension || '')) {
        throw new Error('Selecione um arquivo Excel ou CSV válido.')
      }

      const XLSX = await import('xlsx')
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      if (!firstSheet) throw new Error('O arquivo não possui uma planilha válida.')

      const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' })
      const names = extractNames(rows)
      if (!names.length) throw new Error('Nenhum nome foi encontrado no arquivo.')

      setPreviewNames(names)
    } catch (error) {
      setPreviewNames([])
      setErrorMessage(getErrorMessage(error, 'Não foi possível ler o arquivo.'))
    } finally {
      setReadingFile(false)
    }
  }

  const handlePasteChange = (event) => {
    const value = event.target.value
    setPastedNames(value)
    setFileName('')
    setImportResult(null)
    setErrorMessage('')
    setPreviewNames(normalizeNames(value.split(/\r?\n/)))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const updatePreviewName = (index, value) => {
    setPreviewNames((current) => current.map((name, itemIndex) => (
      itemIndex === index ? value : name
    )))
    setImportResult(null)
  }

  const removePreviewName = (index) => {
    setPreviewNames((current) => current.filter((_, itemIndex) => itemIndex !== index))
    setImportResult(null)
  }

  const handleConfirm = async () => {
    if (submitLockRef.current || importing) return

    const names = normalizeNames(previewNames)
    if (!schoolId || !classId) {
      setErrorMessage('Selecione a escola e a turma.')
      return
    }
    if (!names.length) {
      setErrorMessage('Adicione pelo menos um aluno para importar.')
      return
    }

    const selectedClassData = classes.find((classData) => classData.id === classId)
    if (selectedClassData?.schoolId !== schoolId) {
      setErrorMessage('A turma selecionada não pertence à escola.')
      return
    }

    submitLockRef.current = true
    setImporting(true)
    setErrorMessage('')
    setImportResult(null)
    try {
      const result = await importarAlunos({ names, schoolId, classId })
      setImportResult(result)
      if (result.imported === names.length) {
        clearInput()
      } else {
        setPreviewNames(result.errors.map(({ name }) => name))
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível importar os alunos.'))
    } finally {
      submitLockRef.current = false
      setImporting(false)
    }
  }

  const clearInput = () => {
    setFileName('')
    setPastedNames('')
    setPreviewNames([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
        <div>
          <h1 className="text-2xl font-bold text-nirart-text">Importar Alunos</h1>
          <p className="mt-1 text-sm text-gray-600">Selecione a escola e a turma, revise os nomes e confirme a importação.</p>
        </div>

        {errorMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-5 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center gap-3 p-8 text-sm text-gray-500">
              <LoaderCircle className="animate-spin" size={20} /> Carregando escolas e turmas...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Escola">
                  <select
                    value={schoolId}
                    onChange={(event) => {
                      setSchoolId(event.target.value)
                      setClassId('')
                      setImportResult(null)
                    }}
                    className={inputClass}
                  >
                    <option value="">Selecione a escola</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>{school.fantasyName}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Turma">
                  <select
                    value={classId}
                    onChange={(event) => {
                      setClassId(event.target.value)
                      setImportResult(null)
                    }}
                    disabled={!schoolId}
                    className={`${inputClass} disabled:bg-gray-50`}
                  >
                    <option value="">Selecione a turma</option>
                    {availableClasses.map((classData) => (
                      <option key={classData.id} value={classData.id}>{classData.name}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <section className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <FileSpreadsheet className="mt-0.5 shrink-0 text-nirart-green" size={22} />
                  <div>
                    <h2 className="font-semibold text-nirart-text">Upload Excel / CSV</h2>
                    <p className="mt-1 text-sm text-gray-600">Use a primeira coluna para os nomes. Cabeçalhos como “Nome” ou “Aluno” são ignorados.</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={readingFile || importing}
                  className="mt-4 block w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-green-50 file:px-4 file:py-2 file:font-semibold file:text-nirart-green"
                />
                {readingFile && (
                  <p className="mt-3 inline-flex items-center gap-2 text-sm text-gray-500">
                    <LoaderCircle className="animate-spin" size={16} /> Lendo arquivo...
                  </p>
                )}
              </section>

              <Field label="Ou cole a lista de nomes">
                <textarea
                  value={pastedNames}
                  onChange={handlePasteChange}
                  rows={5}
                  disabled={importing}
                  className={`${inputClass} resize-none`}
                  placeholder="Cole um nome em cada linha"
                />
              </Field>

              <section className="rounded-lg border border-gray-200 p-4">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-800">Prévia dos alunos</h2>
                    <p className="mt-1 text-sm text-gray-500">{previewNames.length} nomes identificados</p>
                  </div>
                  {previewNames.length > 0 && (
                    <button type="button" onClick={clearInput} disabled={importing} className="self-start text-sm font-semibold text-red-700 sm:self-auto">
                      Limpar lista
                    </button>
                  )}
                </div>

                {!previewNames.length ? (
                  <p className="rounded-lg bg-gray-50 p-5 text-center text-sm text-gray-500">
                    Faça upload de um arquivo ou cole os nomes para gerar a prévia.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {previewNames.map((name, index) => (
                      <div key={`${index}-${name}`} className="flex min-w-0 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
                        <span className="w-7 shrink-0 text-center text-xs font-semibold text-gray-500">{index + 1}</span>
                        <input
                          value={name}
                          onChange={(event) => updatePreviewName(index, event.target.value)}
                          disabled={importing}
                          className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                          aria-label={`Nome do aluno ${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removePreviewName(index)}
                          disabled={importing}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-700 hover:bg-red-50"
                          aria-label={`Remover ${name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 text-sm text-gray-600">
                  <p className="break-words">Arquivo selecionado: <span className="font-medium text-gray-800">{fileName || 'Nenhum arquivo'}</span></p>
                  {selectedSchool && selectedClass && (
                    <p className="mt-1 break-words">
                      Destino: <span className="font-medium">{selectedSchool.fantasyName}</span> / <span className="font-medium">{selectedClass.name}</span>
                    </p>
                  )}
                </div>
                <Button
                  variant="primary"
                  onClick={handleConfirm}
                  disabled={!schoolId || !classId || !previewNames.length || importing || readingFile}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {importing && <LoaderCircle className="animate-spin" size={18} />}
                  {importing ? 'Importando...' : 'Confirmar Importação'}
                </Button>
              </div>

              {importResult && <ImportResult result={importResult} />}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

function ImportResult({ result }) {
  return (
    <div className={`rounded-lg border p-4 ${
      result.errors.length ? 'border-yellow-200 bg-yellow-50 text-yellow-900' : 'border-green-200 bg-green-50 text-green-800'
    }`}>
      <div className="flex items-start gap-2">
        <CheckCircle className="mt-0.5 shrink-0" size={20} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Importação concluída</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
            <ResultCard label="Identificados" value={result.identified} />
            <ResultCard label="Importados" value={result.imported} />
            <ResultCard label="Com erro" value={result.errors.length} />
          </div>
          {result.errors.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="font-semibold">Registros não importados:</p>
              {result.errors.map((error) => (
                <p key={`${error.name}-${error.message}`} className="break-words text-sm">
                  <strong>{error.name}:</strong> {error.message}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ResultCard({ label, value }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <p className="text-xs font-semibold">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  )
}

function extractNames(rows) {
  const firstColumn = rows.map((row) => (
    Array.isArray(row)
      ? row.find((cell) => String(cell).trim()) ?? ''
      : ''
  ))
  return normalizeNames(firstColumn)
}

function normalizeNames(names) {
  const seen = new Set()
  return names
    .map((name) => String(name).trim())
    .filter((name) => name && !isHeader(name))
    .filter((name) => {
      const key = name.toLocaleLowerCase('pt-BR')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function isHeader(value) {
  return ['nome', 'nome completo', 'aluno', 'alunos', 'nome do aluno']
    .includes(value.toLocaleLowerCase('pt-BR'))
}

function getErrorMessage(error, fallback) {
  return error?.message ? `${fallback} ${error.message}` : fallback
}

const inputClass = 'w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-nirart-green focus:ring-1 focus:ring-nirart-green'
