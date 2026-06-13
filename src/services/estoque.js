import { supabase } from './supabase'

const ITEM_COLUMNS = [
  'id',
  'ref',
  'tipo_item',
  'foto_url',
  'descricao',
  'categoria',
  'modelo',
  'cor',
  'tamanho',
  'marca',
  'quantidade_total',
  'quantidade_reservada',
  'quantidade_locada',
  'quantidade_disponivel',
  'valor_locacao',
  'custo_aquisicao',
  'fornecedor',
  'status',
  'observacoes',
  'created_at',
  'updated_at'
].join(', ')

const KIT_COLUMNS = [
  'id',
  'ref',
  'nome',
  'descricao',
  'foto_url',
  'categoria',
  'cor',
  'tamanho',
  'quantidade_total',
  'quantidade_reservada',
  'quantidade_locada',
  'quantidade_disponivel',
  'valor_locacao',
  'status',
  'observacoes',
  'created_at',
  'updated_at'
].join(', ')

export const INVENTORY_STATUS = ['Disponível', 'Reservado', 'Locado', 'Inativo']

export async function listarEstoque() {
  const [itemsResult, kitsResult, kitItemsResult] = await Promise.all([
    supabase.from('itens_estoque').select(ITEM_COLUMNS).order('ref'),
    supabase.from('kits').select(KIT_COLUMNS).order('ref'),
    supabase.from('kit_itens').select('kit_id, item_estoque_id, quantidade')
  ])

  const failedResult = [itemsResult, kitsResult, kitItemsResult].find(({ error }) => error)
  if (failedResult?.error) throw failedResult.error

  const items = (itemsResult.data || []).map(normalizarItem)
  const itemsById = new Map(items.map((item) => [item.id, item]))
  const kitItemsByKit = agruparKitItens(kitItemsResult.data || [], itemsById)
  const kits = (kitsResult.data || []).map((kit) => normalizarKit(kit, kitItemsByKit.get(kit.id) || []))

  return [...items, ...kits]
}

export async function listarItensEstoque() {
  const { data, error } = await supabase
    .from('itens_estoque')
    .select(ITEM_COLUMNS)
    .order('ref')

  if (error) throw error
  return (data || []).map(normalizarItem)
}

export async function buscarItemEstoquePorId(id) {
  const { data, error } = await supabase
    .from('itens_estoque')
    .select(ITEM_COLUMNS)
    .eq('id', id)
    .single()

  if (error) throw error
  return normalizarItem(data)
}

export async function criarItemEstoque(itemType, item) {
  const payload = {
    ...mapearItemParaBanco(itemType, item),
    quantidade_reservada: 0,
    quantidade_locada: 0
  }

  const { data, error } = await supabase
    .from('itens_estoque')
    .insert(payload)
    .select(ITEM_COLUMNS)
    .single()

  if (error) throw error
  return normalizarItem(data)
}

export async function atualizarItemEstoque(id, itemType, item) {
  const { data, error } = await supabase
    .from('itens_estoque')
    .update(mapearItemParaBanco(itemType, item))
    .eq('id', id)
    .select(ITEM_COLUMNS)
    .single()

  if (error) throw error
  return normalizarItem(data)
}

export async function inativarRegistroEstoque(item) {
  const table = item.type === 'Kit' ? 'kits' : 'itens_estoque'
  const columns = item.type === 'Kit' ? KIT_COLUMNS : ITEM_COLUMNS
  const { data, error } = await supabase
    .from(table)
    .update({ status: 'Inativo' })
    .eq('id', item.id)
    .select(columns)
    .single()

  if (error) throw error
  return item.type === 'Kit'
    ? normalizarKit(data, item.kitItems || [])
    : normalizarItem(data)
}

export async function listarMovimentacoesEstoque(item) {
  const foreignKey = item.type === 'Kit' ? 'kit_id' : 'item_estoque_id'
  const { data, error } = await supabase
    .from('estoque_movimentacoes')
    .select('id, tipo, quantidade, detalhes, created_at')
    .eq(foreignKey, item.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map((movement) => ({
    id: movement.id,
    action: movement.tipo,
    quantity: movement.quantidade,
    details: movement.detalhes || '',
    createdAt: movement.created_at
  }))
}

export async function buscarKitPorId(id) {
  const [kitResult, kitItemsResult, itemsResult] = await Promise.all([
    supabase.from('kits').select(KIT_COLUMNS).eq('id', id).single(),
    supabase.from('kit_itens').select('item_estoque_id, quantidade').eq('kit_id', id),
    supabase.from('itens_estoque').select(ITEM_COLUMNS)
  ])

  const failedResult = [kitResult, kitItemsResult, itemsResult].find(({ error }) => error)
  if (failedResult?.error) throw failedResult.error

  const itemsById = new Map((itemsResult.data || []).map((item) => {
    const normalized = normalizarItem(item)
    return [normalized.id, normalized]
  }))
  const components = montarKitItens(kitItemsResult.data || [], itemsById)
  return normalizarKit(kitResult.data, components)
}

export async function criarKit(kit) {
  const { data, error } = await supabase
    .from('kits')
    .insert(mapearKitParaBanco(kit))
    .select(KIT_COLUMNS)
    .single()

  if (error) throw error

  try {
    await substituirKitItens(data.id, kit.items)
  } catch (kitItemsError) {
    await supabase.from('kits').delete().eq('id', data.id)
    throw kitItemsError
  }

  return buscarKitPorId(data.id)
}

export async function atualizarKit(id, kit) {
  const { data: previousItems, error: previousItemsError } = await supabase
    .from('kit_itens')
    .select('item_estoque_id, quantidade')
    .eq('kit_id', id)

  if (previousItemsError) throw previousItemsError

  const { error } = await supabase
    .from('kits')
    .update(mapearKitParaBanco(kit))
    .eq('id', id)

  if (error) throw error

  try {
    await substituirKitItens(id, kit.items)
  } catch (kitItemsError) {
    await restaurarKitItens(id, previousItems || [])
    throw kitItemsError
  }

  return buscarKitPorId(id)
}

async function substituirKitItens(kitId, items) {
  const { error: deleteError } = await supabase
    .from('kit_itens')
    .delete()
    .eq('kit_id', kitId)

  if (deleteError) throw deleteError

  if (!items.length) return

  const { error } = await supabase
    .from('kit_itens')
    .insert(items.map((item) => ({
      kit_id: kitId,
      item_estoque_id: typeof item === 'string' ? item : item.itemId,
      quantidade: typeof item === 'string' ? 1 : Number(item.quantity || 1)
    })))

  if (error) throw error
}

async function restaurarKitItens(kitId, items) {
  await supabase.from('kit_itens').delete().eq('kit_id', kitId)
  if (items.length) {
    await supabase.from('kit_itens').insert(items.map((item) => ({
      kit_id: kitId,
      item_estoque_id: item.item_estoque_id,
      quantidade: item.quantidade
    })))
  }
}

function mapearItemParaBanco(itemType, item) {
  const normalizedType = itemType === 'Acessorio' ? 'Acessório' : itemType
  const isShoe = normalizedType === 'Sapato'
  return {
    ref: item.ref.trim(),
    tipo_item: normalizedType,
    foto_url: textoOpcional(item.photo),
    descricao: item.description.trim(),
    categoria: textoOpcional(normalizedType === 'Sapato' ? item.shoeType : item.category),
    modelo: textoOpcional(item.model),
    cor: textoOpcional(item.color),
    tamanho: textoOpcional(item.size),
    marca: isShoe ? textoOpcional(item.brand) : null,
    quantidade_total: numeroInteiro(item.totalQuantity),
    valor_locacao: valorMonetarioParaBanco(item.rentalValue),
    custo_aquisicao: valorMonetarioOpcionalParaBanco(item.acquisitionCost),
    fornecedor: isShoe ? null : textoOpcional(item.supplier),
    status: item.status,
    observacoes: textoOpcional(item.notes)
  }
}

function mapearKitParaBanco(kit) {
  return {
    ref: kit.ref.trim(),
    nome: kit.name.trim(),
    descricao: kit.description.trim(),
    foto_url: textoOpcional(kit.photo),
    categoria: textoOpcional(kit.category),
    cor: textoOpcional(kit.color),
    tamanho: textoOpcional(kit.size),
    quantidade_total: numeroInteiro(kit.totalQuantity),
    valor_locacao: valorMonetarioParaBanco(kit.totalValue),
    status: kit.status,
    observacoes: textoOpcional(kit.notes)
  }
}

function normalizarItem(item) {
  const type = item.tipo_item === 'Acessório' ? 'Acessorio' : item.tipo_item
  return {
    id: item.id,
    type,
    ref: item.ref,
    photo: item.foto_url || '',
    description: item.descricao,
    category: item.categoria || '',
    shoeType: item.tipo_item === 'Sapato' ? item.categoria || '' : '',
    model: item.modelo || '',
    color: item.cor || '',
    size: item.tamanho || '',
    brand: type === 'Sapato' ? item.marca || '' : '',
    totalQuantity: Number(item.quantidade_total || 0),
    reservedQuantity: Number(item.quantidade_reservada || 0),
    rentedQuantity: Number(item.quantidade_locada || 0),
    availableQuantity: Number(item.quantidade_disponivel || 0),
    rentalValue: valorMonetarioDoBanco(item.valor_locacao),
    acquisitionCost: item.custo_aquisicao === null
      ? ''
      : valorMonetarioDoBanco(item.custo_aquisicao),
    supplier: type === 'Sapato' ? '' : item.fornecedor || '',
    status: item.status,
    notes: item.observacoes || '',
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }
}

function normalizarKit(kit, kitItems) {
  return {
    id: kit.id,
    type: 'Kit',
    ref: kit.ref,
    name: kit.nome,
    photo: kit.foto_url || '',
    description: kit.descricao,
    category: kit.categoria || '',
    color: kit.cor || '',
    size: kit.tamanho || '',
    totalQuantity: Number(kit.quantidade_total || 0),
    reservedQuantity: Number(kit.quantidade_reservada || 0),
    rentedQuantity: Number(kit.quantidade_locada || 0),
    availableQuantity: Number(kit.quantidade_disponivel || 0),
    totalValue: valorMonetarioDoBanco(kit.valor_locacao),
    rentalValue: valorMonetarioDoBanco(kit.valor_locacao),
    status: kit.status,
    notes: kit.observacoes || '',
    kitItems,
    items: kitItems.map(({ item, quantity }) => `${quantity}x ${item.ref} - ${item.description}`),
    createdAt: kit.created_at,
    updatedAt: kit.updated_at
  }
}

function agruparKitItens(rows, itemsById) {
  const grouped = new Map()
  rows.forEach((row) => {
    const item = itemsById.get(row.item_estoque_id)
    if (!item) return
    const current = grouped.get(row.kit_id) || []
    current.push({ itemId: item.id, quantity: Number(row.quantidade), item })
    grouped.set(row.kit_id, current)
  })
  return grouped
}

function montarKitItens(rows, itemsById) {
  return rows
    .map((row) => {
      const item = itemsById.get(row.item_estoque_id)
      return item
        ? { itemId: item.id, quantity: Number(row.quantidade), item }
        : null
    })
    .filter(Boolean)
}

function numeroInteiro(value) {
  return Math.max(0, Number.parseInt(value, 10) || 0)
}

function valorMonetarioParaBanco(value) {
  const normalized = String(value ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(/^R\$/, '')

  if (!normalized) return '0.00'

  const decimalValue = normalized.includes(',')
    ? normalized.replace(/\./g, '').replace(',', '.')
    : normalized
  const number = Number(decimalValue)

  if (!Number.isFinite(number) || number < 0) return '0.00'
  return (Math.round((number + Number.EPSILON) * 100) / 100).toFixed(2)
}

function valorMonetarioOpcionalParaBanco(value) {
  if (value === '' || value === null || value === undefined) return null
  return valorMonetarioParaBanco(value)
}

function valorMonetarioDoBanco(value) {
  const number = Number(value ?? 0)
  return Number.isFinite(number)
    ? (Math.round((number + Number.EPSILON) * 100) / 100).toFixed(2)
    : '0.00'
}

function textoOpcional(value) {
  const normalized = value?.trim()
  return normalized || null
}
