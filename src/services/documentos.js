import { supabase } from './supabase'
import {
  DOCUMENT_FILE_RULES,
  removerArquivo,
  removerArquivoPorUrl,
  STORAGE_BUCKETS,
  uploadArquivo
} from './storage'

const DOCUMENT_COLUMNS = [
  'id',
  'reserva_id',
  'tipo_documento',
  'nome_arquivo',
  'url_arquivo',
  'tamanho',
  'criado_por',
  'created_at',
  'updated_at'
].join(', ')

export const DOCUMENT_TYPES = [
  'Contrato',
  'Recibo',
  'Comprovante',
  'Termo de entrega',
  'Termo de devolução'
]

export async function listarDocumentosReserva(reservationId) {
  const { data, error } = await supabase
    .from('documentos_reserva')
    .select(DOCUMENT_COLUMNS)
    .eq('reserva_id', reservationId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(normalizarDocumento)
}

export async function salvarDocumentoReserva({
  reservationId,
  documentType,
  file,
  replaceDocument = null
}) {
  const bucket = getBucketForDocumentType(documentType)
  const uploaded = await uploadArquivo({
    bucket,
    file,
    folder: reservationId,
    rules: DOCUMENT_FILE_RULES
  })

  const payload = {
    reserva_id: reservationId,
    tipo_documento: documentType,
    nome_arquivo: file.name,
    url_arquivo: uploaded.url,
    tamanho: file.size
  }

  const query = replaceDocument
    ? supabase
        .from('documentos_reserva')
        .update(payload)
        .eq('id', replaceDocument.id)
    : supabase.from('documentos_reserva').insert(payload)

  const { data, error } = await query.select(DOCUMENT_COLUMNS).single()

  if (error) {
    await removerArquivo(uploaded.bucket, uploaded.path)
    throw error
  }

  if (replaceDocument?.fileUrl) {
    try {
      await removerArquivoPorUrl(
        getBucketForDocumentType(replaceDocument.documentType),
        replaceDocument.fileUrl
      )
    } catch (cleanupError) {
      console.error(cleanupError)
    }
  }

  return normalizarDocumento(data)
}

export function getBucketForDocumentType(documentType) {
  if (documentType === 'Comprovante') return STORAGE_BUCKETS.receipts
  if (documentType === 'Contrato') return STORAGE_BUCKETS.contracts
  return STORAGE_BUCKETS.documents
}

function normalizarDocumento(document) {
  return {
    id: document.id,
    reservationId: document.reserva_id,
    documentType: document.tipo_documento,
    fileName: document.nome_arquivo,
    fileUrl: document.url_arquivo,
    size: Number(document.tamanho || 0),
    createdBy: document.criado_por,
    createdAt: document.created_at,
    updatedAt: document.updated_at
  }
}
