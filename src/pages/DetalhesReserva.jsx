import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  CalendarDays,
  CreditCard,
  FileText,
  Edit2,
  LoaderCircle,
  PackageCheck,
  RotateCcw,
  Ruler,
  Truck,
  Upload,
  UserRound
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { listarMedidas } from '../services/medidas'
import {
  buscarReservaPorId,
  getReservationItemsQuantity
} from '../services/reservas'
import {
  listarDocumentosReserva,
  salvarDocumentoReserva
} from '../services/documentos'
import {
  criarPreviewArquivo,
  DOCUMENT_FILE_RULES,
  validarArquivo
} from '../services/storage'

const RESERVATION_DOCUMENT_TYPES = [
  'Contrato',
  'Recibo',
  'Termo de entrega',
  'Termo de devolução'
]

export default function DetalhesReserva() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [reservation, setReservation] = useState(null)
  const [measurement, setMeasurement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [documents, setDocuments] = useState([])
  const [documentType, setDocumentType] = useState('Contrato')
  const [documentFile, setDocumentFile] = useState(null)
  const [documentPreview, setDocumentPreview] = useState('')
  const [uploadingDocument, setUploadingDocument] = useState(false)

  useEffect(() => {
    let active = true
    const loadData = async () => {
      setLoading(true)
      setErrorMessage('')
      try {
        const reservationData = await buscarReservaPorId(id)
        const [measurements, documentData] = await Promise.all([
          listarMedidas(reservationData.studentId),
          listarDocumentosReserva(reservationData.id)
        ])
        if (!active) return
        setReservation(reservationData)
        setMeasurement(
          measurements.find((item) => item.status === 'Ativa') ||
          measurements[0] ||
          null
        )
        setDocuments(documentData)
      } catch (error) {
        if (!active) return
        if (error?.code === 'PGRST116') {
          setNotFound(true)
        } else {
          setErrorMessage(getErrorMessage(error, 'Não foi possível carregar a reserva.'))
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [id])

  useEffect(() => () => {
    if (documentPreview?.startsWith('blob:')) URL.revokeObjectURL(documentPreview)
  }, [documentPreview])

  const handleDocumentChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      validarArquivo(file, DOCUMENT_FILE_RULES)
      if (documentPreview?.startsWith('blob:')) URL.revokeObjectURL(documentPreview)
      setDocumentFile(file)
      setDocumentPreview(file.type.startsWith('image/') ? criarPreviewArquivo(file) : '')
      setErrorMessage('')
    } catch (error) {
      event.target.value = ''
      setDocumentFile(null)
      setDocumentPreview('')
      setErrorMessage(error.message)
    }
  }

  const uploadDocument = async () => {
    if (!documentFile || !reservation) return
    setUploadingDocument(true)
    setErrorMessage('')
    try {
      const currentDocument = documents.find((document) => document.documentType === documentType)
      const saved = await salvarDocumentoReserva({
        reservationId: reservation.id,
        documentType,
        file: documentFile,
        replaceDocument: currentDocument
      })
      setDocuments((current) => [
        saved,
        ...current.filter((document) => document.id !== currentDocument?.id)
      ])
      setDocumentFile(null)
      if (documentPreview?.startsWith('blob:')) URL.revokeObjectURL(documentPreview)
      setDocumentPreview('')
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível enviar o documento.'))
    } finally {
      setUploadingDocument(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-80 items-center justify-center gap-3 p-8 text-sm text-gray-500">
          <LoaderCircle className="animate-spin" size={20} /> Carregando reserva...
        </div>
      </MainLayout>
    )
  }

  if (notFound || !reservation || !reservation.student) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-3xl p-4 md:p-8">
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-bold text-nirart-text">Reserva não encontrada</h1>
            <p className="mt-2 text-gray-600">Selecione uma reserva válida na listagem.</p>
            <Button className="mt-6" onClick={() => navigate('/reservas')}>Voltar para Reservas</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const student = reservation.student

  return (
    <MainLayout>
      <div className="mx-auto min-w-0 max-w-7xl space-y-6 p-4 md:p-8">
        {errorMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-nirart-text md:text-3xl">
                Reserva #{shortId(reservation.id)}
              </h1>
              <StatusBadge status={reservation.status} />
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Evento escolar · {formatDateBR(reservation.eventDate)}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <Button variant="outline" onClick={() => navigate('/reservas')} className="whitespace-nowrap">
              Voltar
            </Button>
            <Button
              variant="outline"
              disabled={reservation.status === 'cancelado'}
              onClick={() => navigate(`/cadastro-reserva/${reservation.id}`)}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Edit2 size={17} /> Editar
            </Button>
            <Button
              disabled={reservation.status === 'cancelado'}
              onClick={() => navigate(`/cadastro-pagamento?reservaId=${reservation.id}`)}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <CreditCard size={17} /> Pagamento
            </Button>
            <Button
              variant="outline"
              disabled={['entregue', 'devolvido', 'cancelado'].includes(reservation.status)}
              onClick={() => navigate(`/registrar-entrega/${reservation.id}`)}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Truck size={17} /> Registrar Entrega
            </Button>
            <Button
              variant="outline"
              disabled={reservation.status !== 'entregue'}
              onClick={() => navigate(`/registrar-devolucao/${reservation.id}`)}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <RotateCcw size={17} /> Registrar Devolução
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Evento" value={formatDateBR(reservation.eventDate)} icon={CalendarDays} />
          <SummaryCard label="Quantidade de itens" value={getReservationItemsQuantity(reservation)} icon={PackageCheck} />
          <SummaryCard label="Valor total" value={formatCurrency(reservation.totalValue)} icon={CreditCard} />
          <SummaryCard label="Última medição" value={measurement ? formatDateBR(measurement.measurementDate) : 'Não registrada'} icon={Ruler} />
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
            <SectionTitle icon={UserRound} title="Dados do aluno" />
            <div className="mt-5 space-y-4">
              <InfoRow label="Nome" value={student.fullName} />
              <InfoRow label="Escola" value={reservation.school?.fantasyName || 'Aluno avulso'} />
              <InfoRow label="Turma" value={reservation.studentClass?.name || 'Sem turma'} />
              <InfoRow label="Responsável" value={student.guardianName || 'Não informado'} />
              <InfoRow label="Telefone" value={student.guardianPhone || student.phone || 'Não informado'} />
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6 xl:col-span-2">
            <SectionTitle icon={CalendarDays} title="Dados da reserva" />
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoRow label="Data do evento" value={formatDateBR(reservation.eventDate)} />
              <InfoRow label="Data da prova" value={formatDateBR(reservation.fittingDate)} />
              <InfoRow label="Data da entrega" value={formatDateBR(reservation.deliveryDate)} />
              <InfoRow label="Devolução prevista" value={formatDateBR(reservation.expectedReturnDate)} />
              <InfoRow label="Status" value={<StatusBadge status={reservation.status} />} />
              <InfoRow label="Tipo de atendimento" value={reservation.serviceType} />
              <InfoRow label="Local de atendimento" value={reservation.serviceLocation} className="sm:col-span-2" />
              <InfoRow label="Observações" value={reservation.notes || 'Sem observações.'} className="sm:col-span-2 lg:col-span-3" />
              {reservation.status === 'cancelado' && (
                <InfoRow label="Motivo do cancelamento" value={reservation.cancellationReason} className="sm:col-span-2 lg:col-span-3" />
              )}
            </div>
          </section>
        </div>

        {measurement && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SectionTitle icon={Ruler} title="Medidas do aluno" />
              <Button size="sm" variant="outline" onClick={() => navigate(`/historico-medidas/${student.id}`)} className="whitespace-nowrap">
                Ver histórico de medidas
              </Button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {getMeasurementEntries(measurement).map(([label, value]) => (
                <div key={label} className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="mt-1 font-semibold text-nirart-text">{value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5 md:p-6">
            <SectionTitle icon={PackageCheck} title="Itens reservados" />
          </div>
          <ReservationItems reservation={reservation} />
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <SectionTitle icon={FileText} title="Documentos da reserva" />
          <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-[240px_1fr]">
            <div className="space-y-3">
              {RESERVATION_DOCUMENT_TYPES.map((type) => {
                const document = documents.find((entry) => entry.documentType === type)
                return (
                  <div key={type} className="rounded-lg border border-gray-200 p-3">
                    <p className="text-xs text-gray-500">{type}</p>
                    {document ? (
                      <a href={document.fileUrl} target="_blank" rel="noreferrer" className="mt-1 block break-words text-sm font-semibold text-nirart-green hover:underline">{document.fileName}</a>
                    ) : (
                      <p className="mt-1 text-sm text-gray-400">Não enviado</p>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-[180px_1fr]">
              <div className="flex min-h-40 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-gray-50">
                {documentPreview ? (
                  <img src={documentPreview} alt="Pré-visualização do documento" className="h-44 w-full object-cover" />
                ) : (
                  <FileText className="text-gray-300" size={44} />
                )}
              </div>
              <div className="min-w-0 space-y-4">
                <FieldControl label="Tipo de documento">
                  <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className={documentInputClass}>
                    {RESERVATION_DOCUMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </FieldControl>
                <FieldControl label="Arquivo">
                  <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={handleDocumentChange} className="block w-full min-w-0 text-sm text-gray-600 file:mr-3 file:whitespace-nowrap file:rounded-lg file:border-0 file:bg-green-50 file:px-4 file:py-2 file:font-semibold file:text-nirart-green" />
                </FieldControl>
                <p className="text-xs text-gray-500">PDF, JPG, PNG ou WEBP. Máximo de 10 MB.</p>
                {documentFile && <p className="break-words text-sm font-medium text-gray-700">{documentFile.name}</p>}
                <Button type="button" disabled={!documentFile || uploadingDocument} onClick={uploadDocument} className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap sm:w-auto">
                  {uploadingDocument ? <LoaderCircle className="animate-spin" size={17} /> : <Upload size={17} />}
                  {uploadingDocument ? 'Enviando...' : documents.some((document) => document.documentType === documentType) ? 'Substituir documento' : 'Enviar documento'}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="text-lg font-semibold text-nirart-text">Resumo financeiro</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-5">
              <p className="text-sm text-gray-500">Quantidade total de itens</p>
              <p className="mt-2 text-2xl font-bold text-nirart-text">{getReservationItemsQuantity(reservation)}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-5">
              <p className="text-sm text-green-800">Valor total da reserva</p>
              <p className="mt-2 text-2xl font-bold text-nirart-green">{formatCurrency(reservation.totalValue)}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <OperationCard
            title="Entrega"
            icon={Truck}
            status={reservation.status === 'entregue' || reservation.status === 'devolvido' ? 'entregue' : 'pendente'}
            details={[
              ['Data prevista', formatDateBR(reservation.deliveryDate)],
              ['Status da reserva', capitalize(reservation.status)]
            ]}
            actionLabel="Registrar Entrega"
            disabled={['entregue', 'devolvido', 'cancelado'].includes(reservation.status)}
            onAction={() => navigate(`/registrar-entrega/${reservation.id}`)}
          />
          <OperationCard
            title="Devolução"
            icon={RotateCcw}
            status={reservation.status === 'devolvido' ? 'devolvido' : 'pendente'}
            details={[
              ['Data prevista', formatDateBR(reservation.expectedReturnDate)],
              ['Status da reserva', capitalize(reservation.status)]
            ]}
            actionLabel="Registrar Devolução"
            disabled={reservation.status !== 'entregue'}
            onAction={() => navigate(`/registrar-devolucao/${reservation.id}`)}
          />
        </section>
      </div>
    </MainLayout>
  )
}

function ReservationItems({ reservation }) {
  return (
    <>
      <div className="hidden lg:block">
        <table className="w-full table-fixed text-left">
          <thead className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="w-[42%] px-4 py-3">Item</th>
              <th className="w-[28%] px-4 py-3">Características</th>
              <th className="w-[14%] px-4 py-3">Quantidade</th>
              <th className="w-[16%] px-4 py-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {reservation.items.map((entry) => {
              const item = entry.inventory
              return (
                <tr key={entry.id || `${entry.inventoryType}-${entry.inventoryId}`} className="border-b last:border-0">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-nirart-text">{item?.ref || '-'}</p>
                    <p className="mt-1 break-words text-sm text-gray-600">{item?.description || item?.name || 'Item indisponível'}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    <p>{item?.category || item?.type || '-'}</p>
                    <p className="mt-1">{item?.color || '-'} · Tam. {item?.size || '-'}</p>
                  </td>
                  <td className="px-4 py-4 font-semibold text-nirart-text">{entry.quantity}</td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-500">{formatCurrency(entry.unitValue)} un.</p>
                    <p className="mt-1 font-semibold text-nirart-text">{formatCurrency(entry.totalValue)}</p>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 lg:hidden">
        {reservation.items.map((entry) => {
          const item = entry.inventory
          return (
            <article key={entry.id || `${entry.inventoryType}-${entry.inventoryId}`} className="min-w-0 rounded-lg border border-gray-200 p-4">
              <p className="font-semibold text-nirart-text">{item?.ref || '-'}</p>
              <p className="mt-1 break-words text-sm text-gray-600">{item?.description || item?.name || 'Item indisponível'}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <InfoRow label="Categoria" value={item?.category || item?.type} />
                <InfoRow label="Cor" value={item?.color || '-'} />
                <InfoRow label="Tamanho" value={item?.size || '-'} />
                <InfoRow label="Quantidade" value={entry.quantity} />
                <InfoRow label="Valor unitário" value={formatCurrency(entry.unitValue)} />
                <InfoRow label="Valor total" value={formatCurrency(entry.totalValue)} />
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}

function OperationCard({ title, icon: Icon, status, details, actionLabel, disabled, onAction }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle icon={Icon} title={title} />
        <OperationStatus status={status} />
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {details.map(([label, value]) => <InfoRow key={label} label={label} value={value} />)}
      </div>
      <Button variant="outline" disabled={disabled} onClick={onAction} className="mt-5 w-full whitespace-nowrap">
        {actionLabel}
      </Button>
    </section>
  )
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-green-50 p-2 text-nirart-green"><Icon size={20} /></div>
      <h2 className="text-lg font-semibold text-nirart-text">{title}</h2>
    </div>
  )
}

function SummaryCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="inline-flex rounded-lg bg-green-50 p-2 text-nirart-green"><Icon size={20} /></div>
      <p className="mt-3 text-sm text-gray-500">{label}</p>
      <p className="mt-1 break-words text-xl font-bold text-nirart-text">{value}</p>
    </div>
  )
}

function InfoRow({ label, value, className = '' }) {
  return (
    <div className={className}>
      <p className="text-xs text-gray-500">{label}</p>
      <div className="mt-1 break-words font-semibold text-nirart-text">{value || '—'}</div>
    </div>
  )
}

function FieldControl({ label, children }) {
  return <label className="block min-w-0"><span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>{children}</label>
}

function StatusBadge({ status }) {
  const styles = {
    'pré-reserva': 'bg-purple-100 text-purple-800',
    reservado: 'bg-yellow-100 text-yellow-800',
    confirmado: 'bg-green-100 text-green-800',
    entregue: 'bg-blue-100 text-blue-800',
    devolvido: 'bg-gray-100 text-gray-700',
    cancelado: 'bg-red-100 text-red-800'
  }
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || styles.cancelado}`}>
      {capitalize(status)}
    </span>
  )
}

function OperationStatus({ status }) {
  const styles = {
    pendente: 'bg-yellow-100 text-yellow-800',
    entregue: 'bg-blue-100 text-blue-800',
    devolvido: 'bg-green-100 text-green-800'
  }
  return (
    <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || styles.pendente}`}>
      {capitalize(status)}
    </span>
  )
}

function getMeasurementEntries(measurement) {
  const labels = {
    altura: 'Altura',
    busto: 'Busto',
    cintura: 'Cintura',
    quadril: 'Quadril',
    comprimento: 'Comprimento',
    shoeSize: 'Calçado',
    suitSize: 'Terno',
    shirtSize: 'Camisa',
    pantsSize: 'Calça',
    waist: 'Cintura da calça',
    pantsLength: 'Comp. calça'
  }
  return Object.entries(labels)
    .filter(([key]) => measurement[key])
    .slice(0, 6)
    .map(([key, label]) => [label, measurement[key]])
}

function formatDateBR(value) {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0))
}

function capitalize(value = '') {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function shortId(value) {
  return String(value).slice(0, 8).toUpperCase()
}

function getErrorMessage(error, fallback) {
  return error?.message ? `${fallback} ${error.message}` : fallback
}

const documentInputClass = 'w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-nirart-green focus:ring-1 focus:ring-nirart-green'
