import InventoryItemForm from '../components/InventoryItemForm'

const config = {
  itemType: 'Roupa',
  title: 'Roupa',
  subtitle: 'Informe os dados de identificação, estoque e valores da roupa.',
  initialFields: {
    category: '',
    acquisitionCost: '',
    supplier: ''
  },
  requiredFields: ['description', 'category'],
  fields: [
    { label: 'Descrição', name: 'description', className: 'md:col-span-2' },
    {
      label: 'Categoria',
      name: 'category',
      type: 'select',
      options: [
        { value: '', label: 'Selecione a categoria' },
        { value: 'Vestido', label: 'Vestido' },
        { value: 'Vestido infantil', label: 'Vestido infantil' },
        { value: 'Terno', label: 'Terno' },
        { value: 'Calça', label: 'Calça' },
        { value: 'Camisa', label: 'Camisa' },
        { value: 'Outro', label: 'Outro' }
      ]
    },
    { label: 'Custo de aquisição', name: 'acquisitionCost', type: 'number', min: '0', step: '0.01' },
    { label: 'Fornecedor', name: 'supplier' }
  ]
}

export default function CadastroRoupa() {
  return <InventoryItemForm config={config} />
}
