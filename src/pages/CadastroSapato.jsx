import InventoryItemForm from '../components/InventoryItemForm'

const config = {
  itemType: 'Sapato',
  title: 'Sapato',
  subtitle: 'Cadastre numeração, marca e disponibilidade do calçado.',
  initialFields: {
    shoeType: 'Feminino',
    brand: ''
  },
  requiredFields: ['description', 'shoeType', 'brand'],
  fields: [
    { label: 'Descrição', name: 'description', className: 'md:col-span-2' },
    {
      label: 'Tipo',
      name: 'shoeType',
      type: 'select',
      options: [
        { value: 'Feminino', label: 'Feminino' },
        { value: 'Masculino', label: 'Masculino' },
        { value: 'Unissex', label: 'Unissex' }
      ]
    },
    { label: 'Marca', name: 'brand' }
  ]
}

export default function CadastroSapato() {
  return <InventoryItemForm config={config} />
}
