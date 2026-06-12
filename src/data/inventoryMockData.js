export const INVENTORY_STATUS = ['Disponível', 'Reservado', 'Locado', 'Inativo']

export const MOCK_CLOTHES = [
  {
    id: 1,
    type: 'Roupa',
    ref: 'ROP-001',
    photo: '',
    description: 'Vestido longo de formatura',
    category: 'Vestido',
    color: 'Vinho',
    size: 'M',
    totalQuantity: 8,
    minimumQuantity: 2,
    rentalValue: 280,
    acquisitionCost: 950,
    supplier: 'Maison Elegance',
    status: 'Disponível',
    notes: 'Modelo com ajuste de cintura.',
    reservedQuantity: 2,
    rentedQuantity: 1
  },
  {
    id: 2,
    type: 'Roupa',
    ref: 'ROP-002',
    photo: '',
    description: 'Terno slim completo',
    category: 'Terno',
    color: 'Preto',
    size: '48',
    totalQuantity: 6,
    minimumQuantity: 2,
    rentalValue: 320,
    acquisitionCost: 1100,
    supplier: 'Alfaiataria Central',
    status: 'Reservado',
    notes: 'Acompanha paleto e calca.',
    reservedQuantity: 4,
    rentedQuantity: 0
  },
  {
    id: 3,
    type: 'Roupa',
    ref: 'ROP-003',
    photo: '',
    description: 'Vestido infantil bordado',
    category: 'Vestido infantil',
    color: 'Rosa',
    size: '10',
    totalQuantity: 4,
    minimumQuantity: 1,
    rentalValue: 190,
    acquisitionCost: 620,
    supplier: 'Encanto Kids',
    status: 'Locado',
    notes: 'Uma unidade locada para evento escolar.',
    reservedQuantity: 0,
    rentedQuantity: 1
  }
]

export const MOCK_SHOES = [
  {
    id: 101,
    type: 'Sapato',
    ref: 'SAP-001',
    photo: '',
    description: 'Scarpin classico',
    category: 'Feminino',
    shoeType: 'Feminino',
    color: 'Nude',
    size: '36',
    brand: 'Belle',
    totalQuantity: 5,
    rentalValue: 90,
    status: 'Disponível',
    notes: 'Salto de 7 cm.',
    reservedQuantity: 1,
    rentedQuantity: 0
  },
  {
    id: 102,
    type: 'Sapato',
    ref: 'SAP-002',
    photo: '',
    description: 'Sapato social masculino',
    category: 'Masculino',
    shoeType: 'Masculino',
    color: 'Preto',
    size: '41',
    brand: 'Vittore',
    totalQuantity: 7,
    rentalValue: 110,
    status: 'Reservado',
    notes: 'Couro sintetico.',
    reservedQuantity: 5,
    rentedQuantity: 0
  }
]

export const MOCK_ACCESSORIES = [
  {
    id: 201,
    type: 'Acessorio',
    ref: 'ACE-001',
    photo: '',
    description: 'Tiara com cristais',
    category: 'Tiara',
    model: 'Coroa delicada',
    color: 'Prata',
    size: 'Unico',
    totalQuantity: 10,
    rentalValue: 55,
    status: 'Disponível',
    notes: 'Guardar em embalagem individual.',
    reservedQuantity: 2,
    rentedQuantity: 0
  },
  {
    id: 202,
    type: 'Acessorio',
    ref: 'ACE-002',
    photo: '',
    description: 'Gravata slim',
    category: 'Gravata',
    model: 'Slim lisa',
    color: 'Vinho',
    size: 'Unico',
    totalQuantity: 12,
    rentalValue: 35,
    status: 'Locado',
    notes: 'Duas unidades locadas.',
    reservedQuantity: 3,
    rentedQuantity: 2
  }
]

export const MOCK_KITS = [
  {
    id: 301,
    type: 'Kit',
    ref: 'KIT-001',
    name: 'Kit Formando Classico',
    description: 'Composicao masculina completa para formatura.',
    category: 'Kit masculino',
    color: 'Preto',
    size: 'Variado',
    items: ['ROP-002 - Terno slim completo', 'SAP-002 - Sapato social masculino', 'ACE-002 - Gravata slim'],
    totalValue: 420,
    status: 'Disponível',
    notes: 'Confirmar numeracao do sapato antes da reserva.',
    totalQuantity: 3,
    reservedQuantity: 1,
    rentedQuantity: 0
  },
  {
    id: 302,
    type: 'Kit',
    ref: 'KIT-002',
    name: 'Kit Formanda Vinho',
    description: 'Vestido longo com sapato e tiara.',
    category: 'Kit feminino',
    color: 'Vinho',
    size: 'M / 36',
    items: ['ROP-001 - Vestido longo de formatura', 'SAP-001 - Scarpin classico', 'ACE-001 - Tiara com cristais'],
    totalValue: 390,
    status: 'Reservado',
    notes: 'Kit montado para evento de junho.',
    totalQuantity: 2,
    reservedQuantity: 2,
    rentedQuantity: 0
  }
]

export const MOCK_INVENTORY_HISTORY = [
  { id: 1, itemRef: 'ROP-001', date: '10/06/2026', action: 'Reserva', user: 'Marina Alves', details: 'Duas unidades reservadas.' },
  { id: 2, itemRef: 'ROP-001', date: '08/06/2026', action: 'Locação', user: 'Julia Santos', details: 'Uma unidade entregue ao cliente.' },
  { id: 3, itemRef: 'ROP-002', date: '11/06/2026', action: 'Reserva', user: 'Pedro Souza', details: 'Quatro unidades vinculadas a turma.' },
  { id: 4, itemRef: 'SAP-001', date: '09/06/2026', action: 'Devolucao', user: 'Marina Alves', details: 'Item devolvido e liberado.' },
  { id: 5, itemRef: 'ACE-002', date: '12/06/2026', action: 'Locação', user: 'Julia Santos', details: 'Duas unidades entregues ao cliente.' }
]

export const MOCK_INVENTORY_ITEMS = [
  ...MOCK_CLOTHES,
  ...MOCK_SHOES,
  ...MOCK_ACCESSORIES,
  ...MOCK_KITS
]

export function getInventoryItemById(id) {
  return MOCK_INVENTORY_ITEMS.find((item) => String(item.id) === String(id))
}

export function getEditPath(item) {
  if (item.type === 'Roupa') return `/cadastro-roupa/${item.id}`
  if (item.type === 'Sapato') return `/cadastro-sapato/${item.id}`
  if (item.type === 'Acessorio') return `/cadastro-acessorio/${item.id}`
  return `/kits-locacao/${item.id}`
}
