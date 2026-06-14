# Plano de Segurança RLS - Nirart Maison

> Documento para revisão. Este plano não executa SQL, não habilita RLS e não altera o schema atual.

## 1. Visão geral da segurança

A segurança deve ser aplicada em camadas:

1. **Supabase Auth** autentica o usuário e trata senha, sessão, recuperação e alteração de senha.
2. **`public.usuarios`** mantém somente o perfil operacional: nome, e-mail, perfil, status e último acesso.
3. **RLS** valida cada operação diretamente no PostgreSQL, independentemente do que a interface esconder.
4. **Grants de tabela/coluna** limitam operações que RLS, por trabalhar com linhas, não consegue restringir sozinho.
5. **Edge Functions** executam operações administrativas que exigem `service_role`, como convidar ou excluir usuários do Auth.
6. **Storage RLS** protege fotos e documentos separadamente das tabelas públicas.
7. **Auditoria** registra alterações em dados públicos, sem registrar senhas, tokens ou segredos.

Princípios obrigatórios:

- Negar por padrão e liberar apenas o necessário.
- Toda política para usuários autenticados deve exigir `auth.uid()` válido e perfil com status `Ativo`.
- Permissões da interface são apenas conveniência; RLS é a autorização efetiva.
- A chave `service_role` nunca pode existir no front-end.
- Usuário `Inativo` não deve acessar dados mesmo que ainda possua uma sessão válida.
- Alteração de perfil, status e identidade deve ser tratada como operação privilegiada.

### Identidade e perfil

O schema já utiliza a relação correta:

- `auth.users.id`: identidade de autenticação.
- `public.usuarios.id`: chave estrangeira para `auth.users.id`.
- `public.usuarios.perfil`: `Administrador`, `Atendente` ou `Financeiro`.
- `public.usuarios.status`: `Ativo` ou `Inativo`.

Antes de habilitar RLS, deve ser criada uma função auxiliar estável para consultar o perfil do usuário atual sem causar recursão na política de `public.usuarios`. A função deve:

- Usar `auth.uid()`.
- Retornar somente `perfil` e `status`.
- Ser `SECURITY DEFINER` com `search_path` fixo.
- Ter execução revogada de `public` e concedida apenas a `authenticated`.
- Ser propriedade de uma role administrativa controlada.
- Não aceitar um `usuario_id` arbitrário enviado pelo cliente.

As políticas devem usar verificações equivalentes a:

- usuário autenticado e ativo;
- usuário ativo com perfil específico;
- registro próprio quando aplicável.

## 2. Tabelas e objetos afetados

### Tabelas públicas

| Grupo | Tabelas |
|---|---|
| Acesso e configuração | `usuarios`, `configuracoes` |
| Cadastros | `clientes`, `escolas`, `turmas`, `alunos`, `aluno_parentesco` |
| Medidas | `medidas`, `ajustes` |
| Estoque | `itens_estoque`, `kits`, `kit_itens`, `estoque_movimentacoes` |
| Operação | `reservas`, `reserva_itens`, `lista_espera`, `entregas`, `devolucoes` |
| Financeiro | `pagamentos`, `parcelas` |
| Agenda | `eventos`, `evento_historico` |
| Documentos e comunicação | `documentos_reserva`, `notificacoes` |
| Auditoria | `logs_sistema` |

### Views

- `vw_dashboard_financeiro`
- `vw_dashboard_estoque`
- `vw_dashboard_reservas`
- `vw_dashboard_agenda`

As quatro views usam `security_invoker = true`. Portanto, elas respeitarão as permissões e o RLS das tabelas-base. Isso é seguro, mas pode impedir relatórios se o perfil não tiver acesso às tabelas consultadas.

### Funções

- `set_updated_at`: somente trigger; revogar execução direta de clientes.
- `validar_escola_turma`: somente trigger; revogar execução direta de clientes.
- `registrar_log_sistema`: `SECURITY DEFINER`; manter `search_path` fixo, restringir execução direta e permitir uso pelos triggers.
- `consultar_disponibilidade_item`: conceder execução somente a Administrador e Atendente. A função deve continuar sujeita ao acesso às tabelas-base ou aplicar validação explícita de perfil.

### Supabase Storage

Buckets previstos no front atual:

- `alunos`
- `estoque`
- `comprovantes`
- `contratos`
- `documentos`

Fotos de alunos, comprovantes, contratos e documentos não devem permanecer públicos. O desenho recomendado é bucket privado com URL assinada de curta duração.

## 3. Permissões por perfil

Legenda:

- `CRUD`: consultar, criar, alterar e excluir/inativar conforme regra de negócio.
- `R`: somente consulta.
- `-`: sem acesso.
- Operações destrutivas podem ser substituídas por inativação/cancelamento.

| Recurso | Administrador | Atendente | Financeiro |
|---|---:|---:|---:|
| Usuários | CRUD administrativo | Próprio perfil: R | Próprio perfil: R |
| Configurações | CRUD | - | - |
| Clientes | CRUD | CRUD | R |
| Escolas | CRUD | CRUD | R contextual |
| Turmas | CRUD | CRUD | R contextual |
| Alunos e parentesco | CRUD | CRUD | R |
| Medidas e ajustes | CRUD | CRUD | - |
| Itens, kits e composição | CRUD | CRUD | R somente por relatório, se necessário |
| Movimentações de estoque | CRUD/R de auditoria operacional | CRUD | - |
| Reservas e itens | CRUD | CRUD | R |
| Lista de espera | CRUD | CRUD | - |
| Pagamentos e parcelas | CRUD | - | CRUD |
| Eventos e histórico | CRUD | CRUD | R somente quando necessário ao relatório |
| Entregas | CRUD | CRUD | R somente quando necessário ao relatório |
| Devoluções | CRUD | CRUD | R financeiro para multas/recebimentos |
| Documentos da reserva | CRUD | - | Comprovantes financeiros: CRU limitado |
| Notificações | CRUD | - | - |
| Logs do sistema | R | - | - |
| Views de reservas/estoque/agenda | R | R conforme tabelas-base | R agregado conforme necessidade |
| Dashboard financeiro | R | - | R |

### Administrador

Tem acesso funcional total, mas não recebe acesso a:

- senhas;
- hashes de senha;
- tokens de sessão;
- `service_role`;
- segredos de integração;
- alteração direta de `auth.users` pelo navegador.

Mesmo o Administrador deve usar Edge Function para criar, convidar, inativar ou excluir identidades do Auth.

### Atendente

Pode operar:

- escolas, turmas, clientes e alunos;
- medidas, ajustes e parentesco;
- estoque, kits e movimentações;
- reservas, itens e lista de espera;
- entregas, devoluções e agenda.

Não pode consultar nem alterar pagamentos, parcelas, configurações, usuários, logs ou relatórios financeiros. Valores existentes em reservas podem continuar visíveis quando necessários ao fluxo operacional; dados financeiros detalhados permanecem protegidos em `pagamentos` e `parcelas`.

### Financeiro

Pode:

- consultar clientes e alunos;
- consultar escola e turma apenas para contextualizar aluno/reserva;
- consultar reservas e itens;
- criar e administrar pagamentos e parcelas;
- consultar multas e recebimentos de devolução;
- acessar relatórios e dashboard financeiro;
- incluir e consultar comprovantes financeiros.

Não pode alterar dados de alunos, reservas, estoque, agenda, entrega ou devolução.

## 4. Políticas RLS necessárias

Todas as tabelas abaixo devem ter RLS habilitado somente depois da criação e validação das respectivas políticas.

### Política-base

Para cada política destinada a usuários internos:

- `authenticated` é a única role cliente autorizada.
- A condição exige usuário presente em `public.usuarios`.
- O usuário deve estar com `status = 'Ativo'`.
- O perfil deve pertencer à lista autorizada.
- `WITH CHECK` deve repetir a autorização de `USING` em inserções e alterações.

Não criar políticas permissivas genéricas como “qualquer autenticado pode tudo”.

### `usuarios`

Políticas necessárias:

- Administrador pode listar todos os perfis.
- Usuário ativo pode consultar somente o próprio perfil.
- Inserção e exclusão diretas pelo cliente devem ser negadas; usar Edge Function.
- Alteração de `perfil`, `status` e `email` deve ocorrer por Edge Function administrativa.
- Alteração de nome próprio, se desejada futuramente, deve usar política e grant de coluna específicos.
- Nenhum cliente pode alterar `id`, `ultimo_acesso`, `created_at` ou `updated_at` livremente.

Proteções adicionais:

- Impedir que um administrador remova ou inative o último Administrador ativo.
- Impedir autoelevação de `Atendente` ou `Financeiro`.
- Manter o e-mail sincronizado com o Auth por fluxo privilegiado.

### `configuracoes`

- Administrador: `SELECT`, `INSERT`, `UPDATE` e, se necessário, `DELETE`.
- Atendente e Financeiro: sem acesso direto.
- Se dados públicos da loja forem necessários em recibos, expor apenas os campos necessários por uma view/RPC específica de leitura.

### Cadastros

`clientes`, `escolas`, `turmas`, `alunos`, `aluno_parentesco`:

- Administrador: CRUD.
- Atendente: CRUD.
- Financeiro: somente `SELECT`.

Para Financeiro, avaliar uma view limitada sem endereço, telefone ou observações quando esses campos não forem necessários.

### Medidas e ajustes

`medidas`, `ajustes`:

- Administrador e Atendente: CRUD.
- Financeiro: sem acesso.
- Em inserção, `registrado_por` ou `responsavel_id` deve ser o usuário atual ou ser preenchido pelo banco.

### Estoque e kits

`itens_estoque`, `kits`, `kit_itens`, `estoque_movimentacoes`:

- Administrador e Atendente: CRUD.
- Financeiro: sem escrita.
- Financeiro só deve ter leitura agregada se o relatório atual realmente exigir estoque.
- `usuario_id` em movimentações deve ser derivado de `auth.uid()`, não confiado ao payload do cliente.
- Exclusão física de itens com histórico deve ser evitada; usar `status = 'Inativo'`.

### Reservas

`reservas`, `reserva_itens`, `lista_espera`:

- Administrador e Atendente: CRUD.
- Financeiro: `SELECT`.
- `criado_por` deve ser o usuário atual ou ser preenchido pelo banco.
- Cancelamento deve preservar o registro e o motivo.
- Alterações em itens e no total devem ocorrer de forma transacional para evitar valores divergentes.

### Pagamentos e parcelas

`pagamentos`, `parcelas`:

- Administrador e Financeiro: CRUD.
- Atendente: sem acesso.
- `criado_por` e `baixado_por` devem ser o usuário atual.
- Baixa, cancelamento e recálculo de status devem migrar para RPC transacional ou Edge Function.
- Não permitir alteração de parcela já paga sem uma operação explícita de estorno auditada.

### Agenda

`eventos`, `evento_historico`:

- Administrador e Atendente: CRUD.
- Financeiro: sem escrita e leitura apenas se necessária aos relatórios.
- `responsavel_id` e `usuario_id` devem ser validados contra o usuário atual.
- Eventos automáticos devem ser protegidos contra edição que quebre o vínculo com sua origem.

### Entregas e devoluções

`entregas`, `devolucoes`:

- Administrador e Atendente: CRUD.
- Financeiro: `SELECT` limitado em devoluções para multa, cobrança e recebimento.
- `responsavel_entrega_id` e `recebedor_id` devem ser derivados ou validados.
- Registro e atualização do status da reserva devem ser transacionais.

### Documentos

`documentos_reserva`:

- Administrador: CRUD.
- Financeiro: `SELECT`, `INSERT` e atualização limitada a `tipo_documento = 'Comprovante'`.
- Atendente: sem acesso conforme matriz solicitada.
- A política deve validar também acesso à reserva vinculada.
- Exclusão do registro e remoção do objeto do Storage devem ocorrer no mesmo fluxo privilegiado.

RLS não restringe colunas. A limitação do Financeiro ao tipo `Comprovante` precisa de `WITH CHECK`, e alterações devem impedir a troca de um documento para outro tipo.

### Notificações

`notificacoes`:

- Administrador: CRUD.
- Atendente e Financeiro: sem acesso.
- Envio real futuro deve ocorrer por Edge Function.
- Telefone e conteúdo não devem aparecer em logs externos sem mascaramento.

### Auditoria

`logs_sistema`:

- Administrador: somente `SELECT`.
- Nenhum cliente: `INSERT`, `UPDATE` ou `DELETE`.
- Inserção somente pela função de auditoria.
- A função `registrar_log_sistema` deve ter execução direta bloqueada.
- Definir retenção e arquivamento para evitar crescimento indefinido.

O schema audita tabelas públicas por `to_jsonb(old/new)`. Isso é aceitável apenas enquanto nenhuma tabela pública contiver senha, token ou segredo.

### Views e relatórios

Como as views são `security_invoker`, o usuário precisa de acesso às tabelas-base. Existem duas estratégias:

1. **Temporária:** conceder ao Financeiro `SELECT` nas tabelas-base estritamente necessárias às views.
2. **Recomendada:** criar views/RPCs de relatório com saída agregada, validação explícita de perfil e sem exposição dos registros-base.

Antes de ativar RLS, os serviços de Relatórios e Dashboard devem ser testados para identificar todas as tabelas-base consultadas. Não ampliar acesso bruto apenas para corrigir um erro de tela.

### Função de disponibilidade

`consultar_disponibilidade_item` consulta itens, reservas, itens da reserva e kits. A execução deve ser concedida somente a Administrador e Atendente. Também deve ser verificado se o chamador possui acesso às tabelas-base e se a função não permite inferir reservas financeiras.

### Storage

Políticas de `storage.objects` recomendadas:

| Bucket | Administrador | Atendente | Financeiro |
|---|---|---|---|
| `alunos` | CRUD | CRUD | R somente se necessário |
| `estoque` | CRUD | CRUD | - |
| `comprovantes` | CRUD | - | CRUD |
| `contratos` | CRUD | - | - |
| `documentos` | CRUD | - | - |

Regras adicionais:

- Validar `bucket_id`, extensão, MIME type e limite de tamanho.
- Usar caminho previsível por entidade, por exemplo `reserva_id/documento_id`.
- Não confiar apenas no nome do arquivo para autorizar acesso.
- Preferir upload após a criação do registro ou usar área temporária sob `auth.uid()`.
- Gerar URL assinada depois de validar acesso ao registro vinculado.
- Remover metadados EXIF de fotos quando possível.

## 5. Riscos identificados

### Críticos

1. **Cadastro atual recebe senha definida pelo administrador.**  
   `CadastroUsuario.jsx` possui “Senha inicial” e confirmação. Isso faz o administrador manipular uma credencial que deveria ser conhecida apenas pelo próprio usuário. O fluxo recomendado é convite por e-mail, sem senha no formulário administrativo.

2. **Criação usa `supabase.auth.signUp` no navegador.**  
   `criarUsuario` pode trocar a sessão ativa, depende de restauração local e não representa uma operação administrativa confiável. Deve ser substituído por Edge Function com `auth.admin.inviteUserByEmail`.

3. **Exclusão remove somente `public.usuarios`.**  
   `excluirUsuario` não remove a identidade em `auth.users`; o próprio modal reconhece isso. Pode restar uma conta autenticável sem perfil. A exclusão deve ser coordenada por Edge Function.

4. **RLS ainda não está habilitado.**  
   Com a chave anônima no navegador, a segurança atual depende das permissões padrão do banco. Antes de produção, grants e RLS precisam ser aplicados e testados.

5. **Arquivos sensíveis podem estar públicos.**  
   Fotos, comprovantes, contratos e documentos devem usar buckets privados e URLs assinadas.

### Altos

6. **Criação de Auth e perfil não é atômica.**  
   Se o Auth for criado e o insert em `public.usuarios` falhar, haverá identidade órfã.

7. **E-mail pode divergir entre Auth e perfil público.**  
   A tela bloqueia edição no navegador, mas não existe sincronização privilegiada documentada.

8. **Alteração direta de perfil permite elevação de privilégio se a política for ampla.**  
   RLS por linha não restringe quais colunas podem ser modificadas.

9. **Inativar perfil não encerra automaticamente sessões existentes.**  
   Todas as políticas precisam validar `status = 'Ativo'`; opcionalmente uma Edge Function deve revogar sessões.

10. **Views de relatório podem exigir acesso excessivo às tabelas-base.**  
    `security_invoker` é seguro, mas pode levar à concessão ampla por conveniência.

### Médios

11. **Redefinição de senha pode revelar existência do e-mail.**  
    A interface deve apresentar resposta genérica e aplicar limitação de tentativas.

12. **`ultimo_acesso` não é atualizado pelo fluxo analisado.**  
    O valor pode ficar vazio ou desatualizado. A atualização deve ocorrer em fluxo controlado sem conceder escrita ampla.

13. **Campos de autoria são enviados ou alteráveis pelo cliente.**  
    `criado_por`, `baixado_por`, `registrado_por` e equivalentes devem derivar de `auth.uid()`.

14. **Logs armazenam snapshots completos.**  
    Observações, telefones, endereços e documentos podem ficar duplicados no log. Definir acesso, retenção e eventual mascaramento.

15. **Textos do módulo apresentam sinais de codificação incorreta.**  
    Não é uma falha de autorização, mas mensagens ilegíveis podem prejudicar confirmação de ações sensíveis.

## 6. Ordem segura de ativação

1. Criar ambiente de homologação com cópia sanitizada dos dados.
2. Inventariar todas as consultas atuais e operações por módulo.
3. Definir o primeiro Administrador em `auth.users` e `public.usuarios` por procedimento administrativo controlado.
4. Criar e testar funções auxiliares de perfil/status com privilégios mínimos.
5. Revogar grants públicos excessivos e conceder somente o necessário a `authenticated`.
6. Implantar Edge Functions de gestão de usuários antes de bloquear inserts e deletes diretos.
7. Criar políticas de `usuarios`, `configuracoes` e `logs_sistema`.
8. Criar políticas de cadastros: clientes, escolas, turmas e alunos.
9. Criar políticas de medidas, estoque, kits e reservas.
10. Criar políticas de entregas, devoluções, agenda e documentos.
11. Criar políticas de pagamentos e parcelas.
12. Validar views e substituir acessos agregados que exigirem permissões excessivas.
13. Tornar buckets privados e criar políticas de Storage.
14. Habilitar RLS uma tabela por vez, sempre com política e teste preparados.
15. Executar testes automatizados por perfil e testes negativos via API REST.
16. Somente depois repetir a migração em produção, com plano de rollback.

Não habilitar RLS em todas as tabelas de uma vez sem políticas prontas; isso pode interromper o sistema e dificultar o diagnóstico.

## 7. Como testar cada perfil

### Preparação

Criar em homologação:

- um Administrador ativo;
- um Atendente ativo;
- um Financeiro ativo;
- um usuário inativo de cada perfil;
- registros de teste em todos os módulos;
- ao menos uma reserva com pagamento, parcela, entrega, devolução, evento e documento.

Cada teste deve ser executado pela interface e diretamente pela API Supabase usando o token do perfil.

### Administrador

- Lista, cria, edita e inativa perfis por Edge Function.
- Não recebe nem visualiza senha.
- Acessa configurações e todos os módulos.
- Consulta logs, mas não consegue alterá-los ou excluí-los.
- Não consegue remover o último Administrador ativo.
- Upload e leitura de documentos respeitam bucket e registro.

### Atendente

- Opera escolas, turmas, alunos, medidas, ajustes, estoque, kits, reservas, entregas, devoluções e agenda.
- Não lista `usuarios`, exceto o próprio perfil.
- Não acessa `configuracoes`, `pagamentos`, `parcelas`, dashboard financeiro ou logs.
- Não altera `criado_por` ou outros campos de autoria para outro usuário.
- Não acessa comprovantes, contratos ou documentos restritos.

### Financeiro

- Consulta alunos, clientes e reservas sem alterá-los.
- Cria pagamentos e até cinco parcelas.
- Dá baixa e cancela conforme regras.
- Acessa dashboard financeiro e relatórios autorizados.
- Não altera reserva, aluno, estoque, evento, entrega ou devolução.
- Faz upload e consulta somente de comprovantes financeiros autorizados.

### Usuário inativo

- Com sessão antiga ainda válida, todas as consultas e alterações devem falhar.
- URLs assinadas não devem ser geradas.
- Edge Functions devem rejeitar a chamada.

### Usuário anônimo

- Não acessa tabelas, views, funções de negócio ou objetos privados.
- Pode usar somente endpoints públicos explicitamente necessários ao login e recuperação.

### Testes de abuso obrigatórios

- Alterar `perfil` no payload para `Administrador`.
- Alterar `usuario_id`, `criado_por` ou `baixado_por`.
- Consultar tabela proibida diretamente pela REST API.
- Atualizar uma linha permitida modificando coluna proibida.
- Usar ID de reserva alheio em documento/comprovante.
- Trocar o caminho do objeto no Storage.
- Reutilizar token após inativação.
- Forçar exclusão do último Administrador.
- Repetir solicitação de recuperação de senha para testar rate limit.

## 8. Regras de senha e autenticação

### Regras obrigatórias

- Senha existe exclusivamente no Supabase Auth.
- Não criar coluna `senha`, `password`, hash ou equivalente em tabela pública.
- Não salvar senha em `public.usuarios`, metadata pública, logs, analytics ou auditoria.
- Não retornar senha em serviços.
- Não exibir senha em listagem, detalhe, modal ou formulário administrativo.
- Administrador não pode visualizar ou recuperar senha antiga.
- O front usa somente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- `service_role` fica somente em secrets de Edge Functions.

### Cadastro recomendado

1. Administrador informa nome, e-mail, perfil e status.
2. Edge Function valida que o chamador é Administrador ativo.
3. Edge Function envia convite usando API administrativa do Supabase Auth.
4. O usuário abre o link e define a própria senha.
5. A Edge Function ou um trigger seguro cria/sincroniza `public.usuarios`.
6. Nenhuma senha passa pelo formulário administrativo.

### Redefinição

- O botão “Redefinir senha” apenas dispara `resetPasswordForEmail`.
- A resposta visual deve ser genérica para reduzir enumeração de contas.
- Não reenviar automaticamente.
- Aplicar rate limit e CAPTCHA quando necessário.
- O link deve apontar para uma rota específica de recuperação, não apenas para o login.

### Alteração da própria senha

- Usuário autenticado informa a nova senha em tela própria.
- A alteração usa `supabase.auth.updateUser`.
- A tela não consulta nem solicita a senha antiga como dado recuperável do sistema.
- Após recuperação, validar o evento de sessão `PASSWORD_RECOVERY`.
- Considerar encerramento de outras sessões após alteração.

### Último acesso

`ultimo_acesso` pode ser atualizado por Edge Function, trigger controlado ou processo de login. Não conceder update geral em `public.usuarios` somente para esse campo.

## 9. O que não deve ser feito

- Não armazenar senha em `public.usuarios` ou qualquer tabela pública.
- Não criar endpoint que retorne senha ou hash.
- Não enviar senha por e-mail, WhatsApp ou notificação.
- Não registrar senha, token, refresh token ou `service_role` em logs.
- Não colocar `service_role` em variável `VITE_*`.
- Não usar apenas o menu ou a rota do React como controle de acesso.
- Não confiar em `perfil` enviado pelo cliente.
- Não liberar CRUD geral para a role `authenticated`.
- Não usar política RLS baseada somente em e-mail.
- Não permitir que o usuário altere o próprio perfil ou status.
- Não permitir exclusão direta de `auth.users` pelo navegador.
- Não deixar buckets de documentos sensíveis públicos.
- Não usar URLs públicas permanentes para comprovantes e contratos.
- Não criar função `SECURITY DEFINER` sem `search_path` fixo e grants restritos.
- Não conceder acesso direto de escrita a `logs_sistema`.
- Não habilitar RLS antes de criar e testar as políticas correspondentes.

## 10. Plano futuro para Edge Functions

### `admin-create-user`

- Exige Administrador ativo.
- Recebe nome, e-mail, perfil e status; nunca recebe senha definida pelo administrador.
- Envia convite pelo Auth Admin.
- Cria o perfil público.
- Trata compensação em caso de falha parcial.
- Registra auditoria sem credenciais.

### `admin-update-user`

- Exige Administrador ativo.
- Atualiza perfil, status e, quando necessário, e-mail no Auth e no perfil.
- Impede autoelevação indevida e remoção do último Administrador.
- Ao inativar, revoga sessões quando suportado.

### `admin-delete-user`

- Exige Administrador ativo e confirmação reforçada.
- Impede exclusão do próprio operador e do último Administrador.
- Remove ou anonimiza dependências conforme política de retenção.
- Exclui Auth e perfil público de forma coordenada.

### `send-password-recovery`

- Pode continuar usando o método cliente do Auth, mas uma Edge Function permite rate limit próprio, CAPTCHA e resposta genérica.
- Nunca verifica ou retorna a senha existente.

### `financial-transaction`

- Executa baixa, estorno, cancelamento e atualização do status do pagamento em transação.
- Define `baixado_por` a partir do token.
- Evita alterações parciais entre pagamento e parcelas.

### `reservation-lifecycle`

- Salva reserva e itens em transação.
- Registra entrega/devolução e atualiza status da reserva.
- Atualiza estoque quando essa etapa for implementada.
- Valida disponibilidade sem confiar no cálculo do navegador.

### `generate-signed-document-url`

- Valida perfil e vínculo com reserva/pagamento.
- Retorna URL assinada curta para objeto privado.
- Impede acesso por simples conhecimento do caminho.

### `send-notification`

- Protege credenciais de WhatsApp/e-mail.
- Valida destinatário e modelo.
- Registra apenas conteúdo necessário e resultado do envio.
- Implementa rate limit e idempotência.

## Revisão do módulo Usuários atual

### Conforme

- `public.usuarios` não possui senha.
- `USER_COLUMNS` não consulta senha.
- A listagem exibe nome, e-mail, perfil, status e último acesso.
- Existe botão de redefinição por e-mail.
- O cliente Supabase usa URL e chave anônima.
- O botão de cadastro já bloqueia submissões simultâneas no navegador.

### Deve ser corrigido antes da ativação definitiva

- Remover os campos de senha do cadastro administrativo.
- Substituir `auth.signUp` no navegador por convite via Edge Function.
- Substituir exclusão direta do perfil por operação coordenada com Auth.
- Restringir edição de perfil/status a uma operação administrativa segura.
- Criar rota própria para recuperação e alteração da própria senha.
- Aplicar resposta genérica e proteção contra abuso na recuperação.
- Implementar RLS e grants antes de considerar o módulo seguro para produção.

