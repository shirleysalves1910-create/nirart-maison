import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ImagePlus, LoaderCircle } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import {
  atualizarAluno,
  buscarAlunoPorId,
  criarAluno
} from '../services/alunos'
import { listarEscolas } from '../services/escolas'
import { listarTurmas } from '../services/turmas'
import {
  criarPreviewArquivo,
  IMAGE_FILE_RULES,
  removerArquivo,
  removerArquivoPorUrl,
  STORAGE_BUCKETS,
  uploadArquivo,
  validarArquivo
} from '../services/storage'

const EMPTY_FORM = {
  schoolId: '',
  classId: '',
  fullName: '',
  sex: 'F',
  birthDate: '',
  phone: '',
  address: '',
  guardianName: '',
  guardianPhone: '',
  photoUrl: '',
  notes: '',
  status: 'Ativo'
}

export default function CadastroAluno() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [schools, setSchools] = useState([])
  const [classes, setClasses] = useState([])
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')

  useEffect(() => {
    let active = true

    const loadData = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const [schoolsData, classesData, student] = await Promise.all([
          listarEscolas(),
          listarTurmas(),
          isEdit ? buscarAlunoPorId(id) : Promise.resolve(null)
        ])

        if (!active) return
        setSchools(schoolsData)
        setClasses(classesData)

        if (student) {
          setFormData({
            schoolId: student.schoolId,
            classId: student.classId,
            fullName: student.fullName,
            sex: student.sex,
            birthDate: student.birthDate,
            phone: student.phone,
            address: student.address,
            guardianName: student.guardianName,
            guardianPhone: student.guardianPhone,
            photoUrl: student.photoUrl,
            notes: student.notes,
            status: student.status
          })
          setPhotoPreview(student.photoUrl || '')
        }
      } catch (error) {
        if (!active) return
        if (error?.code === 'PGRST116') {
          setNotFound(true)
        } else {
          setLoadError(getErrorMessage(error, 'Não foi possível carregar os dados do aluno.'))
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [id, isEdit])

  useEffect(() => () => {
    if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
  }, [photoPreview])

  const availableClasses = useMemo(() => (
    classes.filter((classData) => classData.schoolId === formData.schoolId)
  ), [classes, formData.schoolId])

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
      ...(field === 'schoolId' ? { classId: '' } : {})
    }))
    setErrors((current) => ({
      ...current,
      [field]: '',
      ...(field === 'schoolId' ? { classId: '' } : {})
    }))
    setSubmitError('')
  }

  const validateForm = () => {
    const nextErrors = {}
    if (!formData.schoolId) nextErrors.schoolId = 'Selecione a escola.'
    if (!formData.classId) nextErrors.classId = 'Selecione a turma.'
    if (!formData.fullName.trim()) nextErrors.fullName = 'Nome completo é obrigatório.'
    if (!formData.sex) nextErrors.sex = 'Sexo é obrigatório.'
    if (!formData.birthDate) nextErrors.birthDate = 'Data de nascimento é obrigatória.'
    if (!formData.phone.trim()) nextErrors.phone = 'Telefone é obrigatório.'
    if (!formData.address.trim()) nextErrors.address = 'Endereço é obrigatório.'
    if (!formData.guardianName.trim()) nextErrors.guardianName = 'Nome do responsável é obrigatório.'
    if (!formData.guardianPhone.trim()) nextErrors.guardianPhone = 'Telefone do responsável é obrigatório.'

    const selectedClass = classes.find((classData) => classData.id === formData.classId)
    if (formData.classId && selectedClass?.schoolId !== formData.schoolId) {
      nextErrors.classId = 'A turma selecionada não pertence à escola.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      validarArquivo(file, IMAGE_FILE_RULES)
      if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
      setPhotoFile(file)
      setPhotoPreview(criarPreviewArquivo(file))
      setErrors((current) => ({ ...current, photo: '' }))
      setSubmitError('')
    } catch (error) {
      event.target.value = ''
      setErrors((current) => ({ ...current, photo: error.message }))
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (loadError || !validateForm()) return

    setSubmitting(true)
    setSubmitError('')
    let uploadedPhoto = null
    try {
      let nextFormData = formData
      if (photoFile) {
        uploadedPhoto = await uploadArquivo({
          bucket: STORAGE_BUCKETS.students,
          file: photoFile,
          folder: isEdit ? id : 'novos',
          rules: IMAGE_FILE_RULES
        })
        nextFormData = { ...formData, photoUrl: uploadedPhoto.url }
      }

      if (isEdit) {
        await atualizarAluno(id, nextFormData)
      } else {
        await criarAluno(nextFormData)
      }

      if (uploadedPhoto && formData.photoUrl) {
        try {
          await removerArquivoPorUrl(STORAGE_BUCKETS.students, formData.photoUrl)
        } catch (cleanupError) {
          console.error(cleanupError)
        }
      }
      navigate('/alunos')
    } catch (error) {
      if (uploadedPhoto) {
        try {
          await removerArquivo(uploadedPhoto.bucket, uploadedPhoto.path)
        } catch (cleanupError) {
          console.error(cleanupError)
        }
      }
      setSubmitError(getErrorMessage(
        error,
        isEdit ? 'Não foi possível atualizar o aluno.' : 'Não foi possível cadastrar o aluno.'
      ))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-80 items-center justify-center gap-3 p-8 text-sm text-gray-500">
          <LoaderCircle className="animate-spin" size={20} /> Carregando aluno...
        </div>
      </MainLayout>
    )
  }

  if (notFound) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-4xl p-4 md:p-8">
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-bold text-nirart-text">Aluno não encontrado</h1>
            <p className="mt-2 text-gray-600">Selecione um aluno válido na listagem.</p>
            <Button className="mt-6" onClick={() => navigate('/alunos')}>Voltar para Alunos</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-nirart-text">{isEdit ? 'Editar Aluno' : 'Cadastrar Aluno'}</h1>
          <p className="mt-1 text-sm text-gray-600">Preencha os dados completos do aluno</p>
        </div>

        {(loadError || submitError) && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span>{loadError || submitError}</span>
          </div>
        )}

        {(!schools.length || !classes.length) && !loadError && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span>Cadastre pelo menos uma escola e uma turma antes de criar um aluno.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-[160px_1fr] sm:items-center">
            <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50">
              {photoPreview ? (
                <img src={photoPreview} alt="Pré-visualização do aluno" className="h-full w-full object-cover" />
              ) : (
                <div className="text-center text-gray-400">
                  <ImagePlus className="mx-auto" size={30} />
                  <span className="mt-2 block text-xs">Foto opcional</span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <label className="block text-sm font-medium text-gray-700">Foto do aluno</label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="mt-2 block w-full min-w-0 text-sm text-gray-600 file:mr-3 file:whitespace-nowrap file:rounded-lg file:border-0 file:bg-green-50 file:px-4 file:py-2 file:font-semibold file:text-nirart-green"
              />
              <p className="mt-2 text-xs text-gray-500">JPG, PNG ou WEBP. Máximo de 5 MB.</p>
              {errors.photo && <p className="mt-1 text-sm text-red-600">{errors.photo}</p>}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Escola" error={errors.schoolId}>
              <select
                value={formData.schoolId}
                onChange={(event) => updateField('schoolId', event.target.value)}
                className={inputClass(errors.schoolId)}
              >
                <option value="">Selecione a escola</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>{school.fantasyName}</option>
                ))}
              </select>
            </Field>
            <Field label="Turma" error={errors.classId}>
              <select
                value={formData.classId}
                onChange={(event) => updateField('classId', event.target.value)}
                disabled={!formData.schoolId}
                className={`${inputClass(errors.classId)} disabled:bg-gray-50`}
              >
                <option value="">Selecione a turma</option>
                {availableClasses.map((classData) => (
                  <option key={classData.id} value={classData.id}>{classData.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Nome Completo" error={errors.fullName}>
              <input
                value={formData.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                className={inputClass(errors.fullName)}
                type="text"
              />
            </Field>
            <Field label="Sexo" error={errors.sex}>
              <select
                value={formData.sex}
                onChange={(event) => updateField('sex', event.target.value)}
                className={inputClass(errors.sex)}
              >
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="O">Outro</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Data de Nascimento" error={errors.birthDate}>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(event) => updateField('birthDate', event.target.value)}
                className={inputClass(errors.birthDate)}
              />
            </Field>
            <Field label="Telefone" error={errors.phone}>
              <input
                type="tel"
                value={formData.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                className={inputClass(errors.phone)}
              />
            </Field>
            <Field label="Status">
              <select
                value={formData.status}
                onChange={(event) => updateField('status', event.target.value)}
                className={inputClass()}
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </Field>
          </div>

          <Field label="Endereço" error={errors.address}>
            <input
              type="text"
              value={formData.address}
              onChange={(event) => updateField('address', event.target.value)}
              className={inputClass(errors.address)}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Nome do Responsável" error={errors.guardianName}>
              <input
                type="text"
                value={formData.guardianName}
                onChange={(event) => updateField('guardianName', event.target.value)}
                className={inputClass(errors.guardianName)}
              />
            </Field>
            <Field label="Telefone do Responsável" error={errors.guardianPhone}>
              <input
                type="tel"
                value={formData.guardianPhone}
                onChange={(event) => updateField('guardianPhone', event.target.value)}
                className={inputClass(errors.guardianPhone)}
              />
            </Field>
          </div>

          <Field label="Observações">
            <textarea
              value={formData.notes}
              onChange={(event) => updateField('notes', event.target.value)}
              className={`${inputClass()} h-28 resize-none`}
            />
          </Field>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => navigate('/alunos')} disabled={submitting}>Cancelar</Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || Boolean(loadError) || !schools.length || !classes.length}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {submitting && <LoaderCircle className="animate-spin" size={18} />}
              {submitting ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Cadastrar Aluno'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}

function Field({ label, error, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  )
}

function inputClass(error) {
  return `w-full min-w-0 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 ${
    error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-nirart-green focus:ring-nirart-green'
  }`
}

function getErrorMessage(error, fallback) {
  return error?.message ? `${fallback} ${error.message}` : fallback
}
