import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Box, PackageOpen, Plus, Ruler, Shirt, Sparkles, Trash2 } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { MOCK_CLASSES, MOCK_MEASUREMENTS, MOCK_SCHOOLS, MOCK_STUDENTS } from '../data/mockData'
import { MOCK_INVENTORY_ITEMS } from '../data/inventoryMockData'
import {
  getInventoryRentalValue,
  getReservationById,
  RESERVATION_STATUSES,
  SERVICE_TYPES
} from '../data/reservationMockData'

const ITEM_TYPES = [
  { value: 'Roupa', label: 'Roupa', icon: Shirt },
  { value: 'Sapato', label: 'Sapato', icon: PackageOpen },
  { value: 'Acessorio', label: 'Acessório', icon: Sparkles },
  { value: 'Kit', label: 'Kit', icon: Box }
]

const EMPTY_FORM = {
  studentId: '',
  schoolId: '',
  classId: '',
  eventDate: '',
  fittingDate: '',
  deliveryDate: '',
  expectedReturnDate: '',
  serviceType: 'Na loja',
  serviceLocation: '',
  status: 'pré-reserva',
  notes: '',
  items: []
}

export default function CadastroReserva() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [selectedType, setSelectedType] = useState('Roupa')
  const [selectedInventoryId, setSelectedInventoryId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const reservation = isEdit ? getReservationById(id) : null
    if (reservation) {
      setFormData({ ...reservation })
      return
    }

    const studentId = searchParams.get('alunoId')
    const student = MOCK_STUDENTS.find((item) => String(item.id) === String(studentId))
    if (student) {
      setFormData((current) => ({
        ...current,
        studentId: student.id,
        schoolId: student.schoolId,
        classId: student.classId
      }))
    }
  }, [id, isEdit, searchParams])

  const availableItems = MOCK_INVENTORY_ITEMS.filter((item) => item.type === selectedType)
  const selectedInventory = MOCK_INVENTORY_ITEMS.find((item) => String(item.id) === String(selectedInventoryId))
  const selectedMeasurement = MOCK_MEASUREMENTS.find((item) => (
    String(item.studentId) === String(formData.studentId) && item.status === 'Ativa'
  )) || MOCK_MEASUREMENTS.find((item) => String(item.studentId) === String(formData.studentId))
  const total = useMemo(() => formData.items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unitValue),
    0
  ), [formData.items])

  const handleStudentChange = (studentId) => {
    const student = MOCK_STUDENTS.find((item) => String(item.id) === String(studentId))
    setFormData((current) => ({
      ...current,
      studentId: student ? student.id : '',
      schoolId: student?.schoolId || '',
      classId: student?.classId || ''
    }))
    setErrors((current) => ({ ...current, studentId: '', schoolId: '', classId: '' }))
  }

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  const addItem = () => {
    if (!selectedInventory) {
      setErrors((current) => ({ ...current, items: 'Selecione um item do estoque.' }))
      return
    }

    const availableQuantity = getAvailableQuantity(selectedInventory)
    const parsedQuantity = Math.max(1, Number(quantity) || 1)
    const existing = formData.items.find((item) => String(item.inventoryId) === String(selectedInventory.id))
    const finalQuantity = parsedQuantity + Number(existing?.quantity || 0)

    if (finalQuantity > availableQuantity) {
      setErrors((current) => ({
        ...current,
        items: `Quantidade indisponível. Há ${availableQuantity} unidade(s) disponível(is).`
      }))
      return
    }

    setFormData((current) => ({
      ...current,
      items: existing
        ? current.items.map((item) => (
          String(item.inventoryId) === String(selectedInventory.id)
            ? { ...item, quantity: finalQuantity }
            : item
        ))
        : [
          ...current.items,
          {
            inventoryId: selectedInventory.id,
            quantity: parsedQuantity,
            unitValue: getInventoryRentalValue(selectedInventory)
          }
        ]
    }))
    setSelectedInventoryId('')
    setQuantity(1)
    setErrors((current) => ({ ...current, items: '' }))
  }

  const removeItem = (inventoryId) => {
    setFormData((current) => ({
      ...current,
      items: current.items.filter((item) => String(item.inventoryId) !== String(inventoryId))
    }))
  }

  const updateQuantity = (inventoryId, nextQuantity) => {
    const inventory = MOCK_INVENTORY_ITEMS.find((item) => String(item.id) === String(inventoryId))
    const safeQuantity = Math.max(1, Math.min(Number(nextQuantity) || 1, getAvailableQuantity(inventory)))
    setFormData((current) => ({
      ...current,
      items: current.items.map((item) => (
        String(item.inventoryId) === String(inventoryId)
          ? { ...item, quantity: safeQuantity }
          : item
      ))
    }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!formData.studentId) nextErrors.studentId = 'Selecione o aluno.'
    if (!formData.schoolId) nextErrors.schoolId = 'A escola é obrigatória.'
    if (!formData.classId) nextErrors.classId = 'A turma é obrigatória.'
    if (!formData.eventDate) nextErrors.eventDate = 'Informe a data do evento.'
    if (!formData.fittingDate) nextErrors.fittingDate = 'Informe a data da prova.'
    if (!formData.deliveryDate) nextErrors.deliveryDate = 'Informe a data da entrega.'
    if (!formData.expectedReturnDate) nextErrors.expectedReturnDate = 'Informe a devolução prevista.'
    if (!formData.serviceType) nextErrors.serviceType = 'Selecione o tipo de atendimento.'
    if (!formData.serviceLocation.trim()) nextErrors.serviceLocation = 'Informe o local de atendimento.'
    if (formData.items.length === 0) nextErrors.items = 'Adicione pelo menos um item do estoque.'
    if (formData.deliveryDate && formData.eventDate && formData.deliveryDate > formData.eventDate) {
      nextErrors.deliveryDate = 'A entrega deve ocorrer até a data do evento.'
    }
    if (formData.expectedReturnDate && formData.eventDate && formData.expectedReturnDate < formData.eventDate) {
      nextErrors.expectedReturnDate = 'A devolução deve ocorrer após o evento.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validate()) return
    navigate(`/reservas?alunoId=${formData.studentId}`)
  }

  return (
    <MainLayout>
      <div className="mx-auto min-w-0 max-w-5xl p-4 md:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-nirart-text">{isEdit ? 'Editar Reserva' : 'Nova Reserva'}</h1>
          <p className="mt-1 text-sm text-gray-600">Preencha os dados do evento e selecione os itens do estoque.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-lg border border-gray-200 bg-white p-5 md:p-6">
            <h2 className="mb-4 text-lg font-semibold text-nirart-text">Aluno e evento</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Aluno" error={errors.studentId}>
                <select value={formData.studentId} onChange={(event) => handleStudentChange(event.target.value)} className={inputClass(errors.studentId)}>
                  <option value="">Selecione o aluno</option>
                  {MOCK_STUDENTS.map((student) => <option key={student.id} value={student.id}>{student.fullName}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={formData.status} onChange={(event) => updateField('status', event.target.value)} className={inputClass()}>
                  {RESERVATION_STATUSES.map((status) => <option key={status} value={status}>{capitalize(status)}</option>)}
                </select>
              </Field>
              <Field label="Escola" error={errors.schoolId}>
                <select value={formData.schoolId} disabled className={`${inputClass(errors.schoolId)} bg-gray-50`}>
                  <option value="">Selecione o aluno</option>
                  {MOCK_SCHOOLS.map((school) => <option key={school.id} value={school.id}>{school.fantasyName}</option>)}
                </select>
              </Field>
              <Field label="Turma" error={errors.classId}>
                <select value={formData.classId} disabled className={`${inputClass(errors.classId)} bg-gray-50`}>
                  <option value="">Selecione o aluno</option>
                  {MOCK_CLASSES.map((studentClass) => <option key={studentClass.id} value={studentClass.id}>{studentClass.name}</option>)}
                </select>
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <DateField label="Data do evento" field="eventDate" formData={formData} errors={errors} updateField={updateField} />
              <DateField label="Data da prova" field="fittingDate" formData={formData} errors={errors} updateField={updateField} />
              <DateField label="Data da entrega" field="deliveryDate" formData={formData} errors={errors} updateField={updateField} />
              <DateField label="Devolução prevista" field="expectedReturnDate" formData={formData} errors={errors} updateField={updateField} />
            </div>

            {formData.studentId && (
              <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-white p-2 text-nirart-green"><Ruler size={20} /></div>
                    <div>
                      <p className="font-semibold text-green-900">Medidas do aluno</p>
                      <p className="mt-1 text-sm text-green-800">
                        {selectedMeasurement
                          ? `Última medição ativa em ${selectedMeasurement.date}.`
                          : 'Nenhuma medição encontrada para este aluno.'}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/historico-medidas/${formData.studentId}`)}
                    className="whitespace-nowrap"
                  >
                    Ver medidas
                  </Button>
                </div>
                {selectedMeasurement && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {getMeasurementSummary(selectedMeasurement).map(([label, value]) => (
                      <div key={label} className="rounded-lg bg-white p-3">
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="mt-1 font-semibold text-nirart-text">{value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 md:p-6">
            <h2 className="mb-4 text-lg font-semibold text-nirart-text">Atendimento</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Tipo de atendimento" error={errors.serviceType}>
                <select value={formData.serviceType} onChange={(event) => updateField('serviceType', event.target.value)} className={inputClass(errors.serviceType)}>
                  {SERVICE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </Field>
              <Field label="Local de atendimento" error={errors.serviceLocation}>
                <input value={formData.serviceLocation} onChange={(event) => updateField('serviceLocation', event.target.value)} className={inputClass(errors.serviceLocation)} placeholder="Informe o endereço ou unidade" />
              </Field>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 md:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-nirart-text">Itens do estoque</h2>
              <p className="mt-1 text-sm text-gray-500">Adicione roupas, sapatos, acessórios ou kits disponíveis.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ITEM_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => { setSelectedType(type.value); setSelectedInventoryId('') }}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-semibold transition ${
                    selectedType === type.value
                      ? 'border-nirart-green bg-green-50 text-nirart-green'
                      : 'border-gray-200 text-gray-600 hover:border-nirart-green'
                  }`}
                >
                  <type.icon size={18} /> {type.label}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px_auto] md:items-end">
              <Field label="Item do estoque">
                <select value={selectedInventoryId} onChange={(event) => setSelectedInventoryId(event.target.value)} className={inputClass()}>
                  <option value="">Selecione um item</option>
                  {availableItems.map((item) => (
                    <option key={item.id} value={item.id} disabled={getAvailableQuantity(item) === 0}>
                      {item.ref} - {item.description || item.name} ({getAvailableQuantity(item)} disp.)
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Quantidade">
                <input type="number" min="1" max={selectedInventory ? getAvailableQuantity(selectedInventory) : undefined} value={quantity} onChange={(event) => setQuantity(event.target.value)} className={inputClass()} />
              </Field>
              <Button type="button" onClick={addItem} className="inline-flex items-center justify-center gap-2">
                <Plus size={18} /> Adicionar
              </Button>
            </div>
            {errors.items && <p className="mt-2 text-sm text-red-600">{errors.items}</p>}

            <div className="mt-5 overflow-hidden rounded-lg border border-gray-200">
              {formData.items.length === 0 ? (
                <p className="p-8 text-center text-sm text-gray-500">Nenhum item adicionado.</p>
              ) : (
                <ReservationItemEditor
                  entries={formData.items}
                  onQuantityChange={updateQuantity}
                  onRemove={removeItem}
                />
              )}
              <div className="flex flex-col gap-1 bg-gray-50 p-4 text-right sm:flex-row sm:items-center sm:justify-between">
                <span className="font-semibold text-gray-600">Valor total da reserva</span>
                <span className="text-2xl font-bold text-nirart-text">{formatCurrency(total)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 md:p-6">
            <Field label="Observação">
              <textarea value={formData.notes} onChange={(event) => updateField('notes', event.target.value)} className={`${inputClass()} min-h-28`} placeholder="Ajustes, preferências ou informações importantes" />
            </Field>
          </section>

          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => navigate(formData.studentId ? `/reservas?alunoId=${formData.studentId}` : '/reservas')}>Cancelar</Button>
            <Button type="submit">{isEdit ? 'Salvar Alterações' : 'Criar Reserva'}</Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  )
}

function DateField({ label, field, formData, errors, updateField }) {
  return (
    <Field label={label} error={errors[field]}>
      <input type="date" value={formData[field]} onChange={(event) => updateField(field, event.target.value)} className={inputClass(errors[field])} />
    </Field>
  )
}

function ReservationItemEditor({ entries, onQuantityChange, onRemove }) {
  return (
    <>
      <div className="hidden lg:block">
        <table className="w-full table-fixed text-left">
          <thead className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="w-[34%] px-3 py-3">Item</th>
              <th className="w-[25%] px-3 py-3">Características</th>
              <th className="w-[13%] px-3 py-3">Quantidade</th>
              <th className="w-[12%] px-3 py-3">Unitário</th>
              <th className="w-[12%] px-3 py-3">Total</th>
              <th className="w-[4%] px-2 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const item = getInventoryItem(entry.inventoryId)
              return (
                <tr key={entry.inventoryId} className="border-b last:border-0">
                  <td className="px-3 py-4">
                    <p className="font-semibold text-nirart-text">{item?.ref}</p>
                    <p className="mt-1 break-words text-sm text-gray-600">{item?.description || item?.name}</p>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-600">
                    <p>{item?.category || item?.type}</p>
                    <p className="mt-1">{item?.color || '-'} · Tam. {item?.size || '-'}</p>
                  </td>
                  <td className="px-3 py-4">
                    <input
                      aria-label={`Quantidade de ${item?.ref}`}
                      type="number"
                      min="1"
                      max={getAvailableQuantity(item)}
                      value={entry.quantity}
                      onChange={(event) => onQuantityChange(entry.inventoryId, event.target.value)}
                      className={inputClass()}
                    />
                  </td>
                  <td className="px-3 py-4 text-sm font-semibold text-nirart-text">{formatCurrency(entry.unitValue)}</td>
                  <td className="px-3 py-4 text-sm font-semibold text-nirart-text">{formatCurrency(entry.quantity * entry.unitValue)}</td>
                  <td className="px-2 py-4">
                    <RemoveButton item={item} onClick={() => onRemove(entry.inventoryId)} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 lg:hidden">
        {entries.map((entry) => {
          const item = getInventoryItem(entry.inventoryId)
          return (
            <article key={entry.inventoryId} className="min-w-0 rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-nirart-text">{item?.ref}</p>
                  <p className="mt-1 break-words text-sm text-gray-600">{item?.description || item?.name}</p>
                </div>
                <RemoveButton item={item} onClick={() => onRemove(entry.inventoryId)} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <ItemInfo label="Categoria" value={item?.category || item?.type} />
                <ItemInfo label="Cor" value={item?.color || '-'} />
                <ItemInfo label="Tamanho" value={item?.size || '-'} />
                <ItemInfo label="Valor unitário" value={formatCurrency(entry.unitValue)} />
                <label className="block">
                  <span className="mb-1 block text-xs text-gray-500">Quantidade</span>
                  <input
                    aria-label={`Quantidade de ${item?.ref}`}
                    type="number"
                    min="1"
                    max={getAvailableQuantity(item)}
                    value={entry.quantity}
                    onChange={(event) => onQuantityChange(entry.inventoryId, event.target.value)}
                    className={inputClass()}
                  />
                </label>
                <ItemInfo label="Valor total" value={formatCurrency(entry.quantity * entry.unitValue)} />
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}

function RemoveButton({ item, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Remover ${item?.ref}`}
      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
    >
      <Trash2 size={18} />
    </button>
  )
}

function ItemInfo({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 break-words font-semibold text-nirart-text">{value}</p>
    </div>
  )
}

function inputClass(error) {
  return `w-full rounded-lg border px-3 py-2 outline-none focus:ring-1 ${
    error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-nirart-green focus:ring-nirart-green'
  }`
}

function getAvailableQuantity(item) {
  if (!item) return 0
  return Math.max(
    0,
    Number(item.totalQuantity || 0) -
    Number(item.reservedQuantity || 0) -
    Number(item.rentedQuantity || 0)
  )
}

function getInventoryItem(inventoryId) {
  return MOCK_INVENTORY_ITEMS.find((item) => String(item.id) === String(inventoryId))
}

function getMeasurementSummary(measurement) {
  const fields = measurement.type === 'female'
    ? [['Altura', measurement.altura], ['Busto', measurement.busto], ['Cintura', measurement.cintura], ['Calçado', measurement.shoeSize]]
    : [['Altura', measurement.altura], ['Terno', measurement.suitSize], ['Calça', measurement.pantsSize], ['Calçado', measurement.shoeSize]]
  return fields.filter(([, value]) => value)
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
