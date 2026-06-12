import InventoryItemForm from '../components/InventoryItemForm'

const config = {
  itemType: 'Acessorio',
  title: 'Acessorio',
  subtitle: 'Cadastre modelo, caracteristicas e quantidade do acessorio.',
  initialFields: {
    model: ''
  },
  requiredFields: ['model'],
  fields: [
    { label: 'Modelo', name: 'model', className: 'md:col-span-2' }
  ]
}

export default function CadastroAcessorio() {
  return <InventoryItemForm config={config} />
}
