import InventoryItemForm from '../components/InventoryItemForm'

const config = {
  itemType: 'Roupa',
  title: 'Roupa',
  subtitle: 'Informe os dados de identificacao, estoque e valores da roupa.',
  initialFields: {
    category: '',
    minimumQuantity: '',
    acquisitionCost: '',
    supplier: ''
  },
  requiredFields: ['description', 'category'],
  fields: [
    { label: 'Descricao', name: 'description', className: 'md:col-span-2' },
    {
      label: 'Categoria',
      name: 'category',
      type: 'select',
      options: [
        { value: '', label: 'Selecione a categoria' },
        { value: 'Vestido', label: 'Vestido' },
        { value: 'Vestido infantil', label: 'Vestido infantil' },
        { value: 'Terno', label: 'Terno' },
        { value: 'Calca', label: 'Calca' },
        { value: 'Camisa', label: 'Camisa' },
        { value: 'Outro', label: 'Outro' }
      ]
    },
    { label: 'Quantidade minima', name: 'minimumQuantity', type: 'number', min: '0' },
    { label: 'Custo de aquisicao', name: 'acquisitionCost', type: 'number', min: '0', step: '0.01' },
    { label: 'Fornecedor', name: 'supplier' }
  ]
}

export default function CadastroRoupa() {
  return <InventoryItemForm config={config} />
}
