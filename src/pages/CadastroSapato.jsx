import InventoryItemForm from '../components/InventoryItemForm'

const config = {
  itemType: 'Sapato',
  title: 'Sapato',
  subtitle: 'Cadastre numeracao, marca e disponibilidade do calcado.',
  initialFields: {
    shoeType: 'Feminino',
    brand: ''
  },
  requiredFields: ['shoeType', 'brand'],
  fields: [
    {
      label: 'Tipo',
      name: 'shoeType',
      type: 'select',
      options: [
        { value: 'Feminino', label: 'Feminino' },
        { value: 'Masculino', label: 'Masculino' }
      ]
    },
    { label: 'Marca', name: 'brand' }
  ]
}

export default function CadastroSapato() {
  return <InventoryItemForm config={config} />
}
