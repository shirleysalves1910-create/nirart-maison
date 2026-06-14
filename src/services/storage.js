import { supabase } from './supabase'

export const STORAGE_BUCKETS = {
  students: 'alunos',
  inventory: 'estoque',
  receipts: 'comprovantes',
  contracts: 'contratos',
  documents: 'documentos'
}

export const IMAGE_FILE_RULES = {
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxSize: 5 * 1024 * 1024
}

export const DOCUMENT_FILE_RULES = {
  allowedTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ],
  maxSize: 10 * 1024 * 1024
}

export function validarArquivo(file, rules) {
  if (!file) throw new Error('Selecione um arquivo.')
  if (!rules.allowedTypes.includes(file.type)) {
    throw new Error(`Formato inválido. Formatos permitidos: ${formatAllowedTypes(rules.allowedTypes)}.`)
  }
  if (file.size > rules.maxSize) {
    throw new Error(`O arquivo deve ter no máximo ${formatFileSize(rules.maxSize)}.`)
  }
}

export async function uploadArquivo({
  bucket,
  file,
  folder = '',
  rules = DOCUMENT_FILE_RULES
}) {
  validarArquivo(file, rules)
  const path = buildUniquePath(file, folder)
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false
    })

  if (error) throw new Error(`Não foi possível enviar o arquivo: ${error.message}`)

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  if (!data?.publicUrl) {
    await removerArquivo(bucket, path)
    throw new Error('O Supabase não retornou a URL pública do arquivo.')
  }

  return {
    bucket,
    path,
    url: data.publicUrl,
    name: file.name,
    size: file.size,
    type: file.type
  }
}

export async function removerArquivo(bucket, path) {
  if (!bucket || !path) return
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw new Error(`Não foi possível remover o arquivo: ${error.message}`)
}

export async function removerArquivoPorUrl(bucket, url) {
  const path = extrairCaminhoDaUrl(bucket, url)
  if (path) await removerArquivo(bucket, path)
}

export function criarPreviewArquivo(file) {
  return file ? URL.createObjectURL(file) : ''
}

function buildUniquePath(file, folder) {
  const extension = getExtension(file)
  const uniqueName = `${Date.now()}-${crypto.randomUUID()}.${extension}`
  return [sanitizeFolder(folder), uniqueName].filter(Boolean).join('/')
}

function getExtension(file) {
  const originalExtension = file.name.split('.').pop()?.toLowerCase()
  if (originalExtension && /^[a-z0-9]+$/.test(originalExtension)) return originalExtension
  const mimeExtension = file.type.split('/').pop()
  return mimeExtension === 'jpeg' ? 'jpg' : mimeExtension
}

function sanitizeFolder(folder) {
  return String(folder || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9/_-]/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^\/|\/$/g, '')
}

function extrairCaminhoDaUrl(bucket, url) {
  if (!url) return ''
  const markers = [
    `/storage/v1/object/public/${bucket}/`,
    `/storage/v1/object/sign/${bucket}/`
  ]
  const marker = markers.find((item) => url.includes(item))
  return marker ? decodeURIComponent(url.split(marker)[1].split('?')[0]) : ''
}

function formatAllowedTypes(types) {
  const labels = {
    'image/jpeg': 'JPG',
    'image/png': 'PNG',
    'image/webp': 'WEBP',
    'application/pdf': 'PDF'
  }
  return types.map((type) => labels[type] || type).join(', ')
}

function formatFileSize(bytes) {
  return `${Math.round(bytes / 1024 / 1024)} MB`
}
