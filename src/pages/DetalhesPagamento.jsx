import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Banknote, CalendarClock, CreditCard, Edit2, FileCheck2, LoaderCircle, ReceiptText, Upload, UserRound, WalletCards } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import {
  buscarPagamentoPorId,
  getNextDueInstallment,
  getPaidTotal,
  getPaymentStatus,
  getRemainingTotal
} from '../services/pagamentos'
import {
  listarDocumentosReserva,
  salvarDocumentoReserva
} from '../services/documentos'
import {
  criarPreviewArquivo,
  DOCUMENT_FILE_RULES,
  validarArquivo
} from '../services/storage'

export default function DetalhesPagamento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [documents, setDocuments] = useState([])
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState('')
  const [uploadingProof, setUploadingProof] = useState(false)

  useEffect(() => {
    let active = true
    buscarPagamentoPorId(id)
      .then(async (data) => {
        const documentData = await listarDocumentosReserva(data.reservationId)
        if (active) {
          setPayment(data)
          setDocuments(documentData)
        }
      })
      .catch((error) => {
        if (!active) return
        if (error?.code === 'PGRST116') setNotFound(true)
        else setErrorMessage(getErrorMessage(error, 'Não foi possível carregar o pagamento.'))
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  useEffect(() => () => {
    if (proofPreview?.startsWith('blob:')) URL.revokeObjectURL(proofPreview)
  }, [proofPreview])

  const handleProofChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      validarArquivo(file, DOCUMENT_FILE_RULES)
      if (proofPreview?.startsWith('blob:')) URL.revokeObjectURL(proofPreview)
      setProofFile(file)
      setProofPreview(file.type.startsWith('image/') ? criarPreviewArquivo(file) : '')
      setErrorMessage('')
    } catch (error) {
      event.target.value = ''
      setProofFile(null)
      setProofPreview('')
      setErrorMessage(error.message)
    }
  }

  const uploadProof = async () => {
    if (!proofFile || !payment) return
    setUploadingProof(true)
    setErrorMessage('')
    try {
      const currentProof = documents.find((document) => document.documentType === 'Comprovante')
      const saved = await salvarDocumentoReserva({
        reservationId: payment.reservationId,
        documentType: 'Comprovante',
        file: proofFile,
        replaceDocument: currentProof
      })
      setDocuments((current) => [
        saved,
        ...current.filter((document) => document.id !== currentProof?.id)
      ])
      setProofFile(null)
      if (proofPreview?.startsWith('blob:')) URL.revokeObjectURL(proofPreview)
      setProofPreview('')
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível enviar o comprovante.'))
    } finally {
      setUploadingProof(false)
    }
  }

  if (loading) return <MainLayout><div className="flex min-h-80 items-center justify-center gap-3"><LoaderCircle className="animate-spin" /> Carregando pagamento...</div></MainLayout>
  if (notFound || !payment?.reservation) return <NotFound navigate={navigate} />

  const reservation = payment.reservation
  const paidTotal = getPaidTotal(payment)
  const remainingTotal = getRemainingTotal(payment)
  const nextInstallment = getNextDueInstallment(payment)

  return (
    <MainLayout>
      <div className="mx-auto min-w-0 max-w-7xl space-y-6 p-4 md:p-8">
        {errorMessage && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{errorMessage}</div>}
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold md:text-3xl">Pagamento #{shortId(payment.id)}</h1>
              <PaymentStatus status={getPaymentStatus(payment)} />
            </div>
            <p className="mt-2 text-sm text-gray-600">Reserva #{shortId(payment.reservationId)} · {reservation.student?.fullName}</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <Button variant="outline" onClick={() => navigate('/pagamentos')}>Voltar</Button>
            <Button variant="outline" disabled={payment.status === 'cancelado'} onClick={() => navigate(`/cadastro-pagamento/${payment.id}`)} className="inline-flex items-center justify-center gap-2 whitespace-nowrap"><Edit2 size={17} /> Editar</Button>
            <Button variant="outline" disabled={!nextInstallment || payment.status === 'cancelado'} onClick={() => navigate(`/pagamentos/${payment.id}/baixa/${nextInstallment?.id}`)} className="inline-flex items-center justify-center gap-2 whitespace-nowrap"><Banknote size={17} /> Dar baixa</Button>
            <Button disabled={Number(paidTotal) === 0} onClick={() => navigate(`/pagamentos/${payment.id}/recibo`)} className="inline-flex items-center justify-center gap-2 whitespace-nowrap"><ReceiptText size={17} /> Recibo</Button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Valor final" value={formatCurrency(payment.finalValue)} icon={CreditCard} />
          <SummaryCard label="Total pago" value={formatCurrency(paidTotal)} icon={Banknote} valueClassName="text-green-700" />
          <SummaryCard label="Total a receber" value={formatCurrency(remainingTotal)} icon={WalletCards} valueClassName="text-yellow-700" />
          <SummaryCard label="Próximo vencimento" value={nextInstallment ? formatDateBR(nextInstallment.dueDate) : 'Sem pendências'} icon={CalendarClock} />
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="rounded-lg border bg-white p-5 shadow-sm md:p-6">
            <SectionTitle icon={UserRound} title="Cliente e reserva" />
            <div className="mt-5 space-y-4">
              <Info label="Aluno" value={reservation.student?.fullName} />
              <Info label="Escola" value={reservation.school?.fantasyName || 'Aluno avulso'} />
              <Info label="Turma" value={reservation.studentClass?.name || 'Sem turma'} />
              <Info label="Reserva" value={`#${shortId(payment.reservationId)}`} />
              <Info label="Evento" value={formatDateBR(reservation.eventDate)} />
            </div>
          </section>
          <section className="rounded-lg border bg-white p-5 shadow-sm md:p-6 xl:col-span-2">
            <SectionTitle icon={CreditCard} title="Dados do pagamento" />
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Valor da reserva" value={formatCurrency(payment.totalValue)} />
              <Info label="Desconto" value={formatCurrency(payment.discount)} />
              <Info label="Acréscimo" value={formatCurrency(payment.surcharge)} />
              <Info label="Valor final" value={formatCurrency(payment.finalValue)} />
              <Info label="Valor de entrada" value={formatCurrency(payment.downPayment)} />
              <Info label="Data da entrada" value={formatDateBR(payment.downPaymentDate)} />
              <Info label="Forma da entrada" value={payment.downPaymentMethod || '—'} />
              <Info label="Quantidade de parcelas" value={payment.installmentCount} />
              <Info label="Status" value={<PaymentStatus status={getPaymentStatus(payment)} />} />
              <Info label="Observação" value={payment.notes || 'Sem observações.'} className="sm:col-span-2 lg:col-span-3" />
              {payment.cancellationReason && <Info label="Motivo do cancelamento" value={payment.cancellationReason} className="sm:col-span-2 lg:col-span-3" />}
            </div>
          </section>
        </div>

        <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="border-b p-5 md:p-6"><SectionTitle icon={CalendarClock} title="Parcelas" /></div>
          <Installments payment={payment} navigate={navigate} />
        </section>

        <section className="rounded-lg border bg-white p-5 shadow-sm md:p-6">
          <SectionTitle icon={FileCheck2} title="Comprovante de pagamento" />
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[180px_1fr]">
            <div className="flex min-h-36 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-gray-50">
              {proofPreview ? (
                <img src={proofPreview} alt="Pré-visualização do comprovante" className="h-40 w-full object-cover" />
              ) : (
                <FileCheck2 className="text-gray-300" size={42} />
              )}
            </div>
            <div className="min-w-0">
              <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={handleProofChange} className="block w-full min-w-0 text-sm text-gray-600 file:mr-3 file:whitespace-nowrap file:rounded-lg file:border-0 file:bg-green-50 file:px-4 file:py-2 file:font-semibold file:text-nirart-green" />
              <p className="mt-2 text-xs text-gray-500">PDF, JPG, PNG ou WEBP. Máximo de 10 MB.</p>
              {proofFile && <p className="mt-3 break-words text-sm font-medium text-gray-700">{proofFile.name}</p>}
              <Button type="button" disabled={!proofFile || uploadingProof} onClick={uploadProof} className="mt-4 inline-flex w-full items-center justify-center gap-2 whitespace-nowrap sm:w-auto">
                {uploadingProof ? <LoaderCircle className="animate-spin" size={17} /> : <Upload size={17} />}
                {uploadingProof ? 'Enviando...' : documents.some((document) => document.documentType === 'Comprovante') ? 'Substituir comprovante' : 'Enviar comprovante'}
              </Button>
              {documents.filter((document) => document.documentType === 'Comprovante').map((document) => (
                <a key={document.id} href={document.fileUrl} target="_blank" rel="noreferrer" className="mt-4 block break-words text-sm font-semibold text-nirart-green hover:underline">
                  Abrir comprovante: {document.fileName}
                </a>
              ))}
            </div>
          </div>
        </section>

      </div>
    </MainLayout>
  )
}

function Installments({ payment, navigate }) {
  if (!payment.installments.length) return <p className="p-8 text-center text-gray-500">Pagamento quitado sem parcelas.</p>
  return (
    <>
      <div className="hidden lg:block">
        <table className="w-full text-left"><thead className="border-b bg-gray-50 text-xs uppercase text-gray-600"><tr>{['Parcela', 'Valor', 'Vencimento', 'Pagamento', 'Forma', 'Status', 'Ação'].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead>
          <tbody>{payment.installments.map((item) => <tr key={item.id} className="border-b"><td className="px-4 py-4 font-semibold">{item.number}/{payment.installmentCount}</td><td className="px-4 py-4">{formatCurrency(item.value)}</td><td className="px-4 py-4">{formatDateBR(item.dueDate)}</td><td className="px-4 py-4">{formatDateBR(item.paymentDate)}</td><td className="px-4 py-4">{item.paymentMethod || '—'}</td><td className="px-4 py-4"><InstallmentStatus status={item.displayStatus} /></td><td className="px-4 py-4"><button type="button" disabled={!['pendente', 'vencido'].includes(item.displayStatus) || payment.status === 'cancelado'} onClick={() => navigate(`/pagamentos/${payment.id}/baixa/${item.id}`)} className="whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-40">Dar baixa</button></td></tr>)}</tbody>
        </table>
      </div>
      <div className="space-y-3 p-3 lg:hidden">{payment.installments.map((item) => <article key={item.id} className="rounded-lg border p-4"><div className="flex justify-between gap-3"><p className="font-semibold">Parcela {item.number}/{payment.installmentCount}</p><InstallmentStatus status={item.displayStatus} /></div><div className="mt-4 grid grid-cols-2 gap-3"><Info label="Valor" value={formatCurrency(item.value)} /><Info label="Vencimento" value={formatDateBR(item.dueDate)} /><Info label="Pagamento" value={formatDateBR(item.paymentDate)} /><Info label="Forma" value={item.paymentMethod || '—'} /></div>{['pendente', 'vencido'].includes(item.displayStatus) && payment.status !== 'cancelado' && <Button className="mt-4 w-full" onClick={() => navigate(`/pagamentos/${payment.id}/baixa/${item.id}`)}>Dar baixa na parcela</Button>}</article>)}</div>
    </>
  )
}

function SectionTitle({ icon: Icon, title }) { return <div className="flex items-center gap-3"><div className="rounded-lg bg-green-50 p-2 text-nirart-green"><Icon size={20} /></div><h2 className="text-lg font-semibold">{title}</h2></div> }
function SummaryCard({ label, value, icon: Icon, valueClassName = '' }) { return <div className="rounded-lg border bg-white p-5 shadow-sm"><Icon className="text-nirart-green" /><p className="mt-3 text-sm text-gray-500">{label}</p><p className={`mt-1 text-xl font-bold ${valueClassName}`}>{value}</p></div> }
function Info({ label, value, className = '' }) { return <div className={className}><p className="text-xs text-gray-500">{label}</p><div className="mt-1 break-words font-semibold">{value || '—'}</div></div> }
function PaymentStatus({ status }) { const styles = { aberto: 'bg-yellow-100 text-yellow-800', parcial: 'bg-blue-100 text-blue-800', quitado: 'bg-green-100 text-green-800', cancelado: 'bg-red-100 text-red-800' }; return <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>{capitalize(status)}</span> }
function InstallmentStatus({ status }) { const styles = { pendente: 'bg-yellow-100 text-yellow-800', pago: 'bg-green-100 text-green-800', vencido: 'bg-red-100 text-red-800', cancelado: 'bg-gray-100 text-gray-700' }; return <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>{capitalize(status)}</span> }
function NotFound({ navigate }) { return <MainLayout><div className="p-8 text-center"><h1 className="text-2xl font-bold">Pagamento não encontrado</h1><Button className="mt-6" onClick={() => navigate('/pagamentos')}>Voltar</Button></div></MainLayout> }
function formatDateBR(value) { if (!value) return '—'; const [year, month, day] = value.split('-'); return `${day}/${month}/${year}` }
function formatCurrency(value) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0)) }
function capitalize(value = '') { return value.charAt(0).toUpperCase() + value.slice(1) }
function shortId(value) { return String(value).slice(0, 8).toUpperCase() }
function getErrorMessage(error, fallback) { return error?.message ? `${fallback} ${error.message}` : fallback }
