-- ============================================================================
-- NIRART MAISON - SCHEMA V3
-- PostgreSQL / Supabase
-- Arquivo para revisão. Não executado automaticamente.
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ============================================================================
-- FUNÇÕES GERAIS
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.validar_escola_turma()
returns trigger
language plpgsql
as $$
begin
  if new.turma_id is not null and new.escola_id is null then
    raise exception 'Uma turma exige uma escola vinculada';
  end if;

  if new.turma_id is not null and not exists (
    select 1
    from public.turmas t
    where t.id = new.turma_id
      and t.escola_id = new.escola_id
  ) then
    raise exception 'A turma informada não pertence à escola';
  end if;

  return new;
end;
$$;

-- ============================================================================
-- USUÁRIOS E CONFIGURAÇÕES
-- ============================================================================

create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email citext not null unique,
  perfil text not null check (perfil in ('Administrador', 'Atendente', 'Financeiro')),
  status text not null default 'Ativo' check (status in ('Ativo', 'Inativo')),
  ultimo_acesso timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.configuracoes (
  id uuid primary key default gen_random_uuid(),
  nome_loja text not null,
  telefone text,
  endereco text,
  cnpj text unique,
  logo_url text,
  cor_principal varchar(7) not null default '#6FBFA9',
  cor_destaque varchar(7) not null default '#B2181B',
  cor_fundo varchar(7) not null default '#F8F6F2',
  cor_texto varchar(7) not null default '#2B2B2B',
  mensagem_reserva text,
  mensagem_entrega text,
  mensagem_devolucao text,
  mensagem_pagamento text,
  termos_locacao text,
  regras_devolucao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cor_principal ~ '^#[0-9A-Fa-f]{6}$'),
  check (cor_destaque ~ '^#[0-9A-Fa-f]{6}$'),
  check (cor_fundo ~ '^#[0-9A-Fa-f]{6}$'),
  check (cor_texto ~ '^#[0-9A-Fa-f]{6}$')
);

-- ============================================================================
-- CLIENTES, ESCOLAS E TURMAS
-- ============================================================================

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  tipo_cliente text not null default 'Pessoa física'
    check (tipo_cliente in ('Pessoa física', 'Pessoa jurídica', 'Escola', 'Responsável')),
  nome_razao_social text not null,
  nome_fantasia text,
  cpf_cnpj text unique,
  telefone text,
  email citext,
  endereco text,
  observacoes text,
  status text not null default 'Ativo' check (status in ('Ativo', 'Inativo', 'Pendente')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.escolas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid unique references public.clientes(id) on update cascade on delete set null,
  nome_fantasia text not null,
  cnpj text unique,
  email citext,
  telefone text,
  endereco text,
  cidade text,
  estado char(2),
  cep text,
  responsavel text,
  observacoes text,
  status text not null default 'Ativa' check (status in ('Ativa', 'Inativa', 'Pendente')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.turmas (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references public.escolas(id) on update cascade on delete restrict,
  nome text not null,
  turno text check (turno in ('morning', 'afternoon', 'night')),
  data_evento date,
  local_evento text,
  observacoes text,
  status text not null default 'Ativa' check (status in ('Ativa', 'Inativa', 'Pendente')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (escola_id, nome)
);

-- ============================================================================
-- ALUNOS, PARENTESCO, MEDIDAS E AJUSTES
-- ============================================================================

create table public.alunos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on update cascade on delete restrict,
  escola_id uuid references public.escolas(id) on update cascade on delete set null,
  turma_id uuid references public.turmas(id) on update cascade on delete set null,
  nome_completo text not null,
  foto_url text,
  sexo char(1) not null check (sexo in ('F', 'M', 'O')),
  data_nascimento date,
  telefone text,
  endereco text,
  nome_responsavel text,
  telefone_responsavel text,
  observacoes text,
  status text not null default 'Ativo' check (status in ('Ativo', 'Inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (turma_id is null or escola_id is not null)
);

create table public.aluno_parentesco (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos(id) on update cascade on delete cascade,
  aluno_relacionado_id uuid not null references public.alunos(id) on update cascade on delete cascade,
  parentesco text not null,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (aluno_id <> aluno_relacionado_id),
  unique (aluno_id, aluno_relacionado_id)
);

create table public.medidas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos(id) on update cascade on delete cascade,
  registrado_por uuid references public.usuarios(id) on update cascade on delete set null,
  tipo text not null check (tipo in ('feminina', 'masculina')),
  data_medicao date not null default current_date,
  status text not null default 'Ativa' check (status in ('Ativa', 'Anterior')),
  foto_medida_url text,
  arquivo_medida_url text,
  altura numeric(7,2),
  busto numeric(7,2),
  abaixo_busto numeric(7,2),
  cintura numeric(7,2),
  quadril numeric(7,2),
  comprimento numeric(7,2),
  tamanho_terno text,
  comprimento_manga numeric(7,2),
  tamanho_camisa text,
  tamanho_calca text,
  cintura_calca numeric(7,2),
  comprimento_calca numeric(7,2),
  numero_sapato text,
  observacoes text,
  alteracoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (altura is null or altura >= 0),
  check (busto is null or busto >= 0),
  check (abaixo_busto is null or abaixo_busto >= 0),
  check (cintura is null or cintura >= 0),
  check (quadril is null or quadril >= 0),
  check (comprimento is null or comprimento >= 0),
  check (comprimento_manga is null or comprimento_manga >= 0),
  check (cintura_calca is null or cintura_calca >= 0),
  check (comprimento_calca is null or comprimento_calca >= 0)
);

create table public.ajustes (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos(id) on update cascade on delete cascade,
  medida_id uuid references public.medidas(id) on update cascade on delete set null,
  responsavel_id uuid references public.usuarios(id) on update cascade on delete set null,
  peca text not null,
  tipo_ajuste text not null,
  descricao text not null,
  responsavel_nome text,
  data_ajuste date not null default current_date,
  observacoes text,
  status text not null default 'Pendente'
    check (status in ('Pendente', 'Em andamento', 'Concluído', 'Cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- ESTOQUE E KITS
-- ============================================================================

create table public.itens_estoque (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  tipo_item text not null check (tipo_item in ('Roupa', 'Sapato', 'Acessório')),
  foto_url text,
  descricao text not null,
  categoria text,
  modelo text,
  cor text,
  tamanho text,
  marca text,
  quantidade_total integer not null default 0 check (quantidade_total >= 0),
  quantidade_reservada integer not null default 0 check (quantidade_reservada >= 0),
  quantidade_locada integer not null default 0 check (quantidade_locada >= 0),
  quantidade_disponivel integer generated always as (
    quantidade_total - quantidade_reservada - quantidade_locada
  ) stored,
  valor_locacao numeric(12,2) not null default 0 check (valor_locacao >= 0),
  custo_aquisicao numeric(12,2) check (custo_aquisicao is null or custo_aquisicao >= 0),
  fornecedor text,
  status text not null default 'Disponível'
    check (status in ('Disponível', 'Reservado', 'Locado', 'Inativo')),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (quantidade_reservada + quantidade_locada <= quantidade_total)
);

create table public.kits (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  nome text not null,
  descricao text not null,
  foto_url text,
  categoria text,
  cor text,
  tamanho text,
  quantidade_total integer not null default 0 check (quantidade_total >= 0),
  quantidade_reservada integer not null default 0 check (quantidade_reservada >= 0),
  quantidade_locada integer not null default 0 check (quantidade_locada >= 0),
  quantidade_disponivel integer generated always as (
    quantidade_total - quantidade_reservada - quantidade_locada
  ) stored,
  valor_locacao numeric(12,2) not null default 0 check (valor_locacao >= 0),
  status text not null default 'Disponível'
    check (status in ('Disponível', 'Reservado', 'Locado', 'Inativo')),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (quantidade_reservada + quantidade_locada <= quantidade_total)
);

create table public.kit_itens (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid not null references public.kits(id) on update cascade on delete cascade,
  item_estoque_id uuid not null references public.itens_estoque(id) on update cascade on delete restrict,
  quantidade integer not null default 1 check (quantidade > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kit_id, item_estoque_id)
);

create table public.estoque_movimentacoes (
  id uuid primary key default gen_random_uuid(),
  item_estoque_id uuid references public.itens_estoque(id) on update cascade on delete restrict,
  kit_id uuid references public.kits(id) on update cascade on delete restrict,
  usuario_id uuid references public.usuarios(id) on update cascade on delete set null,
  tipo text not null check (
    tipo in (
      'Entrada', 'Reserva', 'Cancelamento de reserva', 'Locação',
      'Devolução', 'Inativação', 'Ajuste de estoque'
    )
  ),
  quantidade integer not null check (quantidade > 0),
  detalhes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(item_estoque_id, kit_id) = 1)
);

-- ============================================================================
-- RESERVAS, PRÉ-RESERVAS E LISTA DE ESPERA
-- ============================================================================

create table public.reservas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on update cascade on delete restrict,
  aluno_id uuid not null references public.alunos(id) on update cascade on delete restrict,
  escola_id uuid references public.escolas(id) on update cascade on delete set null,
  turma_id uuid references public.turmas(id) on update cascade on delete set null,
  evento_id uuid,
  data_evento date not null,
  data_prova date,
  data_entrega date,
  data_prevista_devolucao date,
  data_validade_pre_reserva timestamptz,
  pre_reserva_expirada boolean not null default false,
  tipo_atendimento text not null check (tipo_atendimento in ('Na loja', 'Na escola', 'Em domicílio')),
  local_atendimento text not null,
  status text not null default 'pré-reserva'
    check (status in ('pré-reserva', 'reservado', 'confirmado', 'entregue', 'devolvido', 'cancelado')),
  valor_total numeric(12,2) not null default 0 check (valor_total >= 0),
  observacoes text,
  motivo_cancelamento text,
  criado_por uuid references public.usuarios(id) on update cascade on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (turma_id is null or escola_id is not null),
  check (data_entrega is null or data_entrega <= data_evento),
  check (data_prevista_devolucao is null or data_prevista_devolucao >= data_evento),
  check (status <> 'pré-reserva' or data_validade_pre_reserva is not null)
);

create table public.reserva_itens (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references public.reservas(id) on update cascade on delete cascade,
  item_estoque_id uuid references public.itens_estoque(id) on update cascade on delete restrict,
  kit_id uuid references public.kits(id) on update cascade on delete restrict,
  quantidade integer not null default 1 check (quantidade > 0),
  valor_unitario numeric(12,2) not null check (valor_unitario >= 0),
  valor_total numeric(12,2) generated always as (quantidade * valor_unitario) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(item_estoque_id, kit_id) = 1)
);

create table public.lista_espera (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on update cascade on delete restrict,
  escola_id uuid references public.escolas(id) on update cascade on delete set null,
  turma_id uuid references public.turmas(id) on update cascade on delete set null,
  aluno_id uuid references public.alunos(id) on update cascade on delete set null,
  item_estoque_id uuid references public.itens_estoque(id) on update cascade on delete set null,
  kit_id uuid references public.kits(id) on update cascade on delete set null,
  item_desejado text not null,
  quantidade integer not null default 1 check (quantidade > 0),
  data_evento date not null,
  telefone_contato text not null,
  observacoes text,
  status text not null default 'Aguardando'
    check (status in ('Aguardando', 'Contatado', 'Convertido', 'Cancelado', 'Expirado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (turma_id is null or escola_id is not null),
  check (num_nonnulls(item_estoque_id, kit_id) <= 1)
);

-- ============================================================================
-- PAGAMENTOS E PARCELAS
-- ============================================================================

create table public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null unique references public.reservas(id) on update cascade on delete restrict,
  valor_total numeric(12,2) not null check (valor_total >= 0),
  desconto numeric(12,2) not null default 0 check (desconto >= 0),
  acrescimo numeric(12,2) not null default 0 check (acrescimo >= 0),
  valor_final numeric(12,2) generated always as (valor_total - desconto + acrescimo) stored,
  valor_entrada numeric(12,2) not null default 0 check (valor_entrada >= 0),
  data_entrada date,
  forma_pagamento_entrada text check (
    forma_pagamento_entrada is null or forma_pagamento_entrada in (
      'Dinheiro', 'PIX', 'Cartão de débito', 'Cartão de crédito', 'Transferência bancária'
    )
  ),
  quantidade_parcelas smallint not null default 1 check (quantidade_parcelas between 0 and 5),
  status text not null default 'aberto' check (status in ('aberto', 'parcial', 'quitado', 'cancelado')),
  observacoes text,
  motivo_cancelamento text,
  criado_por uuid references public.usuarios(id) on update cascade on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (desconto <= valor_total + acrescimo),
  check (valor_entrada <= valor_total - desconto + acrescimo),
  check (valor_entrada = 0 or (data_entrada is not null and forma_pagamento_entrada is not null))
);

create table public.parcelas (
  id uuid primary key default gen_random_uuid(),
  pagamento_id uuid not null references public.pagamentos(id) on update cascade on delete cascade,
  numero smallint not null check (numero between 1 and 5),
  valor numeric(12,2) not null check (valor > 0),
  data_vencimento date not null,
  data_pagamento date,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'vencido', 'cancelado')),
  forma_pagamento text check (
    forma_pagamento is null or forma_pagamento in (
      'Dinheiro', 'PIX', 'Cartão de débito', 'Cartão de crédito', 'Transferência bancária'
    )
  ),
  observacoes text,
  baixado_por uuid references public.usuarios(id) on update cascade on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pagamento_id, numero),
  check (status <> 'pago' or (data_pagamento is not null and forma_pagamento is not null))
);

-- ============================================================================
-- EVENTOS E AGENDA
-- ============================================================================

create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text not null check (
    tipo in (
      'prova de roupa', 'medição', 'ajuste', 'entrega', 'devolução',
      'evento escolar', 'atendimento', 'pagamento', 'outro'
    )
  ),
  cor varchar(7) not null default '#6FBFA9',
  data date not null,
  hora_inicio time not null,
  hora_fim time not null,
  cliente_id uuid references public.clientes(id) on update cascade on delete set null,
  aluno_id uuid references public.alunos(id) on update cascade on delete set null,
  escola_id uuid references public.escolas(id) on update cascade on delete set null,
  turma_id uuid references public.turmas(id) on update cascade on delete set null,
  reserva_id uuid references public.reservas(id) on update cascade on delete cascade,
  responsavel_id uuid references public.usuarios(id) on update cascade on delete set null,
  responsavel_nome text,
  local text not null,
  status text not null default 'agendado'
    check (status in ('agendado', 'confirmado', 'realizado', 'cancelado', 'reagendado')),
  observacoes text,
  automatico boolean not null default false,
  origem text check (origem is null or origem in ('manual', 'reserva', 'pagamento', 'entrega', 'devolução', 'ajuste')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cor ~ '^#[0-9A-Fa-f]{6}$'),
  check (hora_fim > hora_inicio),
  check (turma_id is null or escola_id is not null)
);

alter table public.reservas
  add constraint reservas_evento_id_fkey
  foreign key (evento_id) references public.eventos(id)
  on update cascade on delete set null;

create table public.evento_historico (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on update cascade on delete cascade,
  usuario_id uuid references public.usuarios(id) on update cascade on delete set null,
  acao text not null,
  detalhes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- ENTREGAS E DEVOLUÇÕES
-- ============================================================================

create table public.entregas (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null unique references public.reservas(id) on update cascade on delete restrict,
  data_entrega date not null,
  responsavel_entrega_id uuid references public.usuarios(id) on update cascade on delete set null,
  responsavel_entrega_nome text,
  recebedor text,
  observacoes text,
  roupa_entregue boolean not null default false,
  sapato_entregue boolean not null default false,
  acessorio_entregue boolean not null default false,
  kit_entregue boolean not null default false,
  embalagem_entregue boolean not null default false,
  status text not null default 'pendente' check (status in ('pendente', 'entregue', 'cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.devolucoes (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null unique references public.reservas(id) on update cascade on delete restrict,
  data_prevista date not null,
  data_real date,
  recebedor_id uuid references public.usuarios(id) on update cascade on delete set null,
  recebedor_nome text,
  condicao_itens text check (
    condicao_itens is null or condicao_itens in (
      'Perfeito estado', 'Bom estado', 'Necessita higienização', 'Com avaria'
    )
  ),
  houve_atraso boolean not null default false,
  houve_avaria boolean not null default false,
  valor_multa_atraso numeric(12,2) not null default 0 check (valor_multa_atraso >= 0),
  valor_multa_avaria numeric(12,2) not null default 0 check (valor_multa_avaria >= 0),
  valor_cobrado numeric(12,2) not null default 0 check (valor_cobrado >= 0),
  foi_recebido boolean not null default false,
  roupa_devolvida boolean not null default false,
  sapato_devolvido boolean not null default false,
  acessorio_devolvido boolean not null default false,
  kit_devolvido boolean not null default false,
  embalagem_devolvida boolean not null default false,
  observacoes text,
  status text not null default 'pendente'
    check (status in ('pendente', 'devolvido', 'atrasado', 'com avaria', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('pendente', 'cancelado') or data_real is not null)
);

-- ============================================================================
-- DOCUMENTOS E NOTIFICAÇÕES
-- ============================================================================

create table public.documentos_reserva (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references public.reservas(id) on update cascade on delete cascade,
  tipo_documento text not null check (
    tipo_documento in ('Contrato', 'Recibo', 'Comprovante', 'Termo de entrega', 'Termo de devolução')
  ),
  nome_arquivo text not null,
  url_arquivo text not null,
  tamanho bigint check (tamanho is null or tamanho >= 0),
  criado_por uuid references public.usuarios(id) on update cascade on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on update cascade on delete set null,
  aluno_id uuid references public.alunos(id) on update cascade on delete set null,
  reserva_id uuid references public.reservas(id) on update cascade on delete cascade,
  telefone text not null,
  tipo text not null check (
    tipo in (
      'Confirmação de reserva', 'Confirmação de prova', 'Lembrete de pagamento',
      'Lembrete de devolução', 'Reserva pronta', 'Reserva cancelada'
    )
  ),
  mensagem text not null,
  status text not null default 'Pendente'
    check (status in ('Pendente', 'Enviada', 'Entregue', 'Respondida', 'Falha', 'Cancelada')),
  data_envio timestamptz,
  resposta text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status not in ('Enviada', 'Entregue', 'Respondida') or data_envio is not null)
);

-- ============================================================================
-- AUDITORIA
-- ============================================================================

create table public.logs_sistema (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.usuarios(id) on update cascade on delete set null,
  tabela text not null,
  registro_id uuid,
  acao text not null check (acao in ('INSERT', 'UPDATE', 'DELETE')),
  dados_anteriores jsonb,
  dados_novos jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.registrar_log_sistema()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_id uuid;
  v_registro_id uuid;
begin
  select u.id into v_usuario_id
  from public.usuarios u
  where u.id = auth.uid();

  if tg_op = 'INSERT' then
    v_registro_id := new.id;
    insert into public.logs_sistema (
      usuario_id, tabela, registro_id, acao, dados_anteriores, dados_novos
    ) values (
      v_usuario_id, tg_table_name, v_registro_id, tg_op, null, to_jsonb(new)
    );
    return new;
  elsif tg_op = 'UPDATE' then
    v_registro_id := new.id;
    insert into public.logs_sistema (
      usuario_id, tabela, registro_id, acao, dados_anteriores, dados_novos
    ) values (
      v_usuario_id, tg_table_name, v_registro_id, tg_op, to_jsonb(old), to_jsonb(new)
    );
    return new;
  elsif tg_op = 'DELETE' then
    v_registro_id := old.id;
    insert into public.logs_sistema (
      usuario_id, tabela, registro_id, acao, dados_anteriores, dados_novos
    ) values (
      v_usuario_id, tg_table_name, v_registro_id, tg_op, to_jsonb(old), null
    );
    return old;
  end if;
  return null;
end;
$$;

-- ============================================================================
-- DISPONIBILIDADE POR PERÍODO
-- ============================================================================

create or replace function public.consultar_disponibilidade_item(
  p_item_estoque_id uuid,
  p_data_inicio date,
  p_data_fim date
)
returns table (
  item_estoque_id uuid,
  ref text,
  descricao text,
  quantidade_total integer,
  quantidade_comprometida bigint,
  quantidade_disponivel bigint,
  disponivel boolean
)
language plpgsql
stable
as $$
begin
  if p_data_inicio is null or p_data_fim is null then
    raise exception 'O período deve ser informado';
  end if;
  if p_data_fim < p_data_inicio then
    raise exception 'A data final deve ser igual ou posterior à inicial';
  end if;

  return query
  with reservas_periodo as (
    select r.id
    from public.reservas r
    where r.status in ('pré-reserva', 'reservado', 'confirmado', 'entregue')
      and (
        r.status <> 'pré-reserva'
        or (
          r.pre_reserva_expirada = false
          and r.data_validade_pre_reserva >= now()
        )
      )
      and daterange(
        coalesce(r.data_entrega, r.data_evento),
        coalesce(r.data_prevista_devolucao, r.data_evento) + 1,
        '[)'
      ) && daterange(p_data_inicio, p_data_fim + 1, '[)')
  ),
  quantidade_direta as (
    select coalesce(sum(ri.quantidade), 0)::bigint as quantidade
    from public.reserva_itens ri
    join reservas_periodo rp on rp.id = ri.reserva_id
    where ri.item_estoque_id = p_item_estoque_id
  ),
  quantidade_em_kits as (
    select coalesce(sum(ri.quantidade * ki.quantidade), 0)::bigint as quantidade
    from public.reserva_itens ri
    join reservas_periodo rp on rp.id = ri.reserva_id
    join public.kit_itens ki on ki.kit_id = ri.kit_id
    where ki.item_estoque_id = p_item_estoque_id
  )
  select
    ie.id,
    ie.ref,
    ie.descricao,
    ie.quantidade_total,
    qd.quantidade + qk.quantidade,
    greatest(ie.quantidade_total::bigint - qd.quantidade - qk.quantidade, 0::bigint),
    (
      ie.status <> 'Inativo'
      and ie.quantidade_total::bigint - qd.quantidade - qk.quantidade > 0
    )
  from public.itens_estoque ie
  cross join quantidade_direta qd
  cross join quantidade_em_kits qk
  where ie.id = p_item_estoque_id;
end;
$$;

-- ============================================================================
-- VIEWS DOS DASHBOARDS
-- ============================================================================

create or replace view public.vw_dashboard_financeiro
with (security_invoker = true)
as
with parcelas_pagas as (
  select pagamento_id, coalesce(sum(valor), 0) as total_pago
  from public.parcelas
  where status = 'pago'
  group by pagamento_id
),
recebido_mes as (
  select coalesce(sum(valor), 0) as valor
  from (
    select pg.valor_entrada as valor
    from public.pagamentos pg
    where pg.status <> 'cancelado'
      and pg.data_entrada >= date_trunc('month', current_date)::date
      and pg.data_entrada < (date_trunc('month', current_date) + interval '1 month')::date
    union all
    select pa.valor
    from public.parcelas pa
    join public.pagamentos pg on pg.id = pa.pagamento_id
    where pa.status = 'pago'
      and pg.status <> 'cancelado'
      and pa.data_pagamento >= date_trunc('month', current_date)::date
      and pa.data_pagamento < (date_trunc('month', current_date) + interval '1 month')::date
    union all
    select d.valor_cobrado
    from public.devolucoes d
    where d.foi_recebido = true
      and d.data_real >= date_trunc('month', current_date)::date
      and d.data_real < (date_trunc('month', current_date) + interval '1 month')::date
  ) recebimentos
),
saldo as (
  select coalesce(sum(
    greatest(pg.valor_final - pg.valor_entrada - coalesce(pp.total_pago, 0), 0)
  ), 0) as valor
  from public.pagamentos pg
  left join parcelas_pagas pp on pp.pagamento_id = pg.id
  where pg.status <> 'cancelado'
),
parcelas_resumo as (
  select
    count(*) filter (
      where status = 'vencido' or (status = 'pendente' and data_vencimento < current_date)
    ) as pagamentos_vencidos,
    coalesce(sum(valor) filter (
      where status = 'vencido' or (status = 'pendente' and data_vencimento < current_date)
    ), 0) as valor_vencido,
    count(*) filter (
      where status = 'pendente' and data_vencimento >= current_date
    ) as pagamentos_a_vencer,
    coalesce(sum(valor) filter (
      where status = 'pendente' and data_vencimento >= current_date
    ), 0) as valor_a_vencer
  from public.parcelas
)
select
  rm.valor as total_recebido_mes,
  s.valor as total_a_receber,
  pr.pagamentos_vencidos,
  pr.valor_vencido,
  pr.pagamentos_a_vencer,
  pr.valor_a_vencer
from recebido_mes rm
cross join saldo s
cross join parcelas_resumo pr;

create or replace view public.vw_dashboard_estoque
with (security_invoker = true)
as
select
  tipo_item,
  count(*) as quantidade_referencias,
  sum(quantidade_total) as quantidade_total,
  sum(quantidade_disponivel) as quantidade_disponivel,
  sum(quantidade_reservada) as quantidade_reservada,
  sum(quantidade_locada) as quantidade_locada
from (
  select tipo_item, quantidade_total, quantidade_disponivel, quantidade_reservada, quantidade_locada
  from public.itens_estoque
  union all
  select 'Kit'::text, quantidade_total, quantidade_disponivel, quantidade_reservada, quantidade_locada
  from public.kits
) estoque
group by tipo_item;

create or replace view public.vw_dashboard_reservas
with (security_invoker = true)
as
select
  date_trunc('month', r.data_evento)::date as mes,
  r.escola_id,
  e.nome_fantasia as escola,
  r.turma_id,
  t.nome as turma,
  r.status,
  count(*) as quantidade_reservas,
  sum(r.valor_total) as valor_total
from public.reservas r
left join public.escolas e on e.id = r.escola_id
left join public.turmas t on t.id = r.turma_id
group by
  date_trunc('month', r.data_evento)::date,
  r.escola_id, e.nome_fantasia, r.turma_id, t.nome, r.status;

create or replace view public.vw_dashboard_agenda
with (security_invoker = true)
as
select
  ev.id, ev.titulo, ev.tipo, ev.cor, ev.data, ev.hora_inicio, ev.hora_fim,
  ev.status, ev.local, ev.responsavel_nome, ev.automatico,
  ev.cliente_id, c.nome_razao_social as cliente,
  ev.aluno_id, a.nome_completo as aluno,
  ev.escola_id, e.nome_fantasia as escola,
  ev.turma_id, t.nome as turma,
  ev.reserva_id,
  ev.data = current_date as evento_hoje,
  ev.data >= current_date as evento_futuro
from public.eventos ev
left join public.clientes c on c.id = ev.cliente_id
left join public.alunos a on a.id = ev.aluno_id
left join public.escolas e on e.id = ev.escola_id
left join public.turmas t on t.id = ev.turma_id;

-- ============================================================================
-- ÍNDICES
-- ============================================================================

create index idx_usuarios_perfil on public.usuarios(perfil);
create index idx_usuarios_status on public.usuarios(status);
create index idx_clientes_nome on public.clientes(nome_razao_social);
create index idx_clientes_tipo on public.clientes(tipo_cliente);
create index idx_clientes_status on public.clientes(status);
create index idx_escolas_cliente on public.escolas(cliente_id);
create index idx_escolas_nome on public.escolas(nome_fantasia);
create index idx_escolas_status on public.escolas(status);
create index idx_turmas_escola on public.turmas(escola_id);
create index idx_turmas_evento on public.turmas(data_evento);
create index idx_turmas_status on public.turmas(status);
create index idx_alunos_cliente on public.alunos(cliente_id);
create index idx_alunos_escola on public.alunos(escola_id);
create index idx_alunos_turma on public.alunos(turma_id);
create index idx_alunos_nome on public.alunos(nome_completo);
create index idx_alunos_status on public.alunos(status);
create index idx_parentesco_aluno on public.aluno_parentesco(aluno_id);
create index idx_parentesco_relacionado on public.aluno_parentesco(aluno_relacionado_id);
create index idx_medidas_aluno on public.medidas(aluno_id);
create index idx_medidas_data on public.medidas(data_medicao desc);
create index idx_medidas_status on public.medidas(status);
create index idx_ajustes_aluno on public.ajustes(aluno_id);
create index idx_ajustes_medida on public.ajustes(medida_id);
create index idx_ajustes_data on public.ajustes(data_ajuste desc);
create index idx_estoque_tipo on public.itens_estoque(tipo_item);
create index idx_estoque_categoria on public.itens_estoque(categoria);
create index idx_estoque_status on public.itens_estoque(status);
create index idx_estoque_descricao on public.itens_estoque(descricao);
create index idx_kits_status on public.kits(status);
create index idx_kit_itens_kit on public.kit_itens(kit_id);
create index idx_kit_itens_item on public.kit_itens(item_estoque_id);
create index idx_movimentacoes_item on public.estoque_movimentacoes(item_estoque_id);
create index idx_movimentacoes_kit on public.estoque_movimentacoes(kit_id);
create index idx_movimentacoes_data on public.estoque_movimentacoes(created_at desc);
create index idx_reservas_cliente on public.reservas(cliente_id);
create index idx_reservas_aluno on public.reservas(aluno_id);
create index idx_reservas_escola on public.reservas(escola_id);
create index idx_reservas_turma on public.reservas(turma_id);
create index idx_reservas_evento on public.reservas(evento_id);
create index idx_reservas_status on public.reservas(status);
create index idx_reservas_data_evento on public.reservas(data_evento);
create index idx_reservas_pre_reserva on public.reservas(data_validade_pre_reserva)
  where status = 'pré-reserva';
create index idx_reserva_itens_reserva on public.reserva_itens(reserva_id);
create index idx_reserva_itens_item on public.reserva_itens(item_estoque_id);
create index idx_reserva_itens_kit on public.reserva_itens(kit_id);
create index idx_lista_espera_cliente on public.lista_espera(cliente_id);
create index idx_lista_espera_aluno on public.lista_espera(aluno_id);
create index idx_lista_espera_evento on public.lista_espera(data_evento);
create index idx_lista_espera_status on public.lista_espera(status);
create index idx_pagamentos_status on public.pagamentos(status);
create index idx_parcelas_pagamento on public.parcelas(pagamento_id);
create index idx_parcelas_status on public.parcelas(status);
create index idx_parcelas_vencimento on public.parcelas(data_vencimento);
create index idx_eventos_data on public.eventos(data);
create index idx_eventos_tipo on public.eventos(tipo);
create index idx_eventos_status on public.eventos(status);
create index idx_eventos_cliente on public.eventos(cliente_id);
create index idx_eventos_aluno on public.eventos(aluno_id);
create index idx_eventos_escola on public.eventos(escola_id);
create index idx_eventos_turma on public.eventos(turma_id);
create index idx_eventos_reserva on public.eventos(reserva_id);
create index idx_evento_historico_evento on public.evento_historico(evento_id);
create index idx_entregas_data on public.entregas(data_entrega);
create index idx_entregas_status on public.entregas(status);
create index idx_devolucoes_data on public.devolucoes(data_prevista);
create index idx_devolucoes_status on public.devolucoes(status);
create index idx_devolucoes_recebimento on public.devolucoes(foi_recebido);
create index idx_documentos_reserva on public.documentos_reserva(reserva_id);
create index idx_documentos_tipo on public.documentos_reserva(tipo_documento);
create index idx_notificacoes_cliente on public.notificacoes(cliente_id);
create index idx_notificacoes_aluno on public.notificacoes(aluno_id);
create index idx_notificacoes_reserva on public.notificacoes(reserva_id);
create index idx_notificacoes_status on public.notificacoes(status);
create index idx_notificacoes_envio on public.notificacoes(data_envio);
create index idx_logs_usuario on public.logs_sistema(usuario_id);
create index idx_logs_registro on public.logs_sistema(tabela, registro_id);
create index idx_logs_data on public.logs_sistema(created_at desc);

-- ============================================================================
-- TRIGGERS DE UPDATED_AT
-- ============================================================================

do $$
declare
  tabela text;
begin
  foreach tabela in array array[
    'usuarios', 'configuracoes', 'clientes', 'escolas', 'turmas', 'alunos',
    'aluno_parentesco', 'medidas', 'ajustes', 'itens_estoque', 'kits',
    'kit_itens', 'estoque_movimentacoes', 'reservas', 'reserva_itens',
    'lista_espera', 'pagamentos', 'parcelas', 'eventos', 'evento_historico',
    'entregas', 'devolucoes', 'documentos_reserva', 'notificacoes'
  ]
  loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()',
      tabela, tabela
    );
  end loop;
end;
$$;

-- ============================================================================
-- TRIGGERS DE VALIDAÇÃO ESCOLA / TURMA
-- ============================================================================

create trigger alunos_validar_escola_turma
before insert or update of escola_id, turma_id on public.alunos
for each row execute function public.validar_escola_turma();

create trigger reservas_validar_escola_turma
before insert or update of escola_id, turma_id on public.reservas
for each row execute function public.validar_escola_turma();

create trigger eventos_validar_escola_turma
before insert or update of escola_id, turma_id on public.eventos
for each row execute function public.validar_escola_turma();

create trigger lista_espera_validar_escola_turma
before insert or update of escola_id, turma_id on public.lista_espera
for each row execute function public.validar_escola_turma();

-- ============================================================================
-- TRIGGERS DE AUDITORIA
-- ============================================================================

do $$
declare
  tabela text;
begin
  foreach tabela in array array[
    'usuarios', 'configuracoes', 'clientes', 'escolas', 'turmas', 'alunos',
    'aluno_parentesco', 'medidas', 'ajustes', 'itens_estoque', 'kits',
    'kit_itens', 'estoque_movimentacoes', 'reservas', 'reserva_itens',
    'lista_espera', 'pagamentos', 'parcelas', 'eventos', 'evento_historico',
    'entregas', 'devolucoes', 'documentos_reserva', 'notificacoes'
  ]
  loop
    execute format(
      'create trigger %I_audit after insert or update or delete on public.%I
       for each row execute function public.registrar_log_sistema()',
      tabela, tabela
    );
  end loop;
end;
$$;

-- ============================================================================
-- RLS
-- ============================================================================

-- Row Level Security não foi habilitado.
-- As políticas serão criadas posteriormente para os perfis:
-- Administrador, Atendente e Financeiro.
