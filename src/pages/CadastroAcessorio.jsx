import InventoryItemForm from '../components/InventoryItemForm'

const config = {
  itemType: 'Acessorio',
  title: 'Acessório',
  subtitle: 'Cadastre modelo, características e quantidade do acessório.',
  initialFields: {
    category: 'Unissex',
    model: '',
    supplier: ''
  },
  requiredFields: ['description', 'category', 'model'],
  fields: [
    { label: 'Descrição', name: 'description', className: 'md:col-span-2' },
    {
      label: 'Tipo',
      name: 'category',
      type: 'select',
      options: [
        { value: 'Feminino', label: 'Feminino' },
        { value: 'Masculino', label: 'Masculino' },
        { value: 'Unissex', label: 'Unissex' }
      ]
    },
    { label: 'Modelo', name: 'model' },
    { label: 'Fornecedor', name: 'supplier' }
  ]
}

export default function CadastroAcessorio() {
  return <InventoryItemForm config={config} />
}
