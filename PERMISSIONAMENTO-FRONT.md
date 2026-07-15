# Handoff — Permissionamento MCI (API NestJS → Front Next.js)

> Documento de contexto para implementar o permissionamento do front Next.js
> (rotas, sidemenu, sessão). Gerado a partir da análise da API `mci-api` (NestJS/Prisma)
> e do projeto original legado (Laravel) em 2026-07-14.

## 1. Modelo de permissão (fonte de verdade: API)

Toda a lógica de escopo está centralizada em `src/common/utils/permissoes.util.ts` da API.

**Identidade do usuário (payload do JWT / sessão):**

```ts
interface UsuarioAutenticado {
  id_usuario: string;
  nome: string;
  email: string;
  id_role: number;   // 1 = admin global, 2 = admin local
  id_nivel: number;  // 1 = franqueadora, 2 = filial, 3 = departamento
  relacao: string | null; // UUID da entidade do nível (franqueadora, filial OU departamento)
  ano_ativo: number;
}
```

**Hierarquia:** Franqueadora → Filiais → Departamentos → Copas → Jogos → Previdências → (PLPs, Observações, Atualizações).

**Regra de escopo por nível (quem está logado × o que enxerga):**

| Recurso | Admin global | Franqueadora | Filial | Departamento |
|---|---|---|---|---|
| Franqueadoras | todas | só a sua | a dona da sua filial | a dona da cadeia acima |
| Filiais | todas | todas da sua franqueadora | só a sua | a dona do seu departamento |
| Departamentos | todos | todos da sua cadeia | todos da sua filial | só o seu |
| Copas / Jogos | todos | toda a cadeia abaixo | dos seus departamentos | só do seu departamento |
| Previdências etc. | herdam do escopo do jogo/copa | idem | idem | idem |
| Usuários | todos | só da própria cadeia (franqueadora + suas filiais + departamentos delas) | filial + seus departamentos | só do departamento |
| Líderes | todos | da sua franqueadora | da franqueadora da cadeia acima | da franqueadora da cadeia acima |

Observações importantes para o front:

- Níveis inferiores enxergam a cadeia **para cima** também (um usuário de departamento
  lista sua filial e sua franqueadora — um registro de cada). Útil para breadcrumb/contexto.
- Listagens de copas e jogos têm recorte adicional pelo `ano_ativo` do usuário.
- Registro fora do escopo retorna **404** (filtro no `findFirst`), não 403.
  O 403 vem do `RolesGuard` (checa `id_role`) ou de usuário sem `relacao` resolvível (líderes).
- Tudo respeita soft delete (`deletado_em: null`) em cada nível da cadeia.

## 2. Correções feitas na API em 2026-07-14 (alinhamento com o legado)

O projeto original (Laravel, `MCI-master/MCI-master/api`) escopava usuários e líderes
pela cadeia; a reescrita NestJS tinha divergido. Corrigido em `permissoes.util.ts`:

1. `filtroUsuarios` — franqueadora via usuários de filial/departamento de **todas** as
   franqueadoras (vazamento) e filial não via os dos seus departamentos. Agora: cadeia exata.
2. `filtroLideres` — logins de filial/departamento recebiam lista vazia. Agora o helper
   `resolverIdFranqueadora()` sobe a cadeia (departamento → filial → franqueadora) e filtra
   pela franqueadora resolvida, como o `getFranqueadoraIdFromUser` do legado.
3. `criar` líder — qualquer não-admin vincula o líder à franqueadora resolvida pela cadeia
   (antes só nível franqueadora vinculava; filial/departamento criava com `null`).

A API nova também corrigiu IDORs que existiam no legado (escopo em operações por ID via
`escopoCopaPorId`/`escopoJogoPorId`) — não regredir isso.

## 3. Decisão de arquitetura do front (já discutida e decidida)

**NÃO criar tabela auxiliar de permissões no banco.** O modelo é estrutural e estável
(2 roles × 3 níveis); tabela seria cópia do que o código sabe, com risco de dessincronizar.
Só reavaliar se surgir configuração dinâmica por tenant (módulos habilitados por plano) —
e nesse caso seria tabela de módulos por tenant consumida pela API, não de rotas do front.

**Plano para o Next.js (majoritariamente server-side):**

1. **Sessão**: no login, guardar `id_role`, `id_nivel`, `relacao` (e `ano_ativo`) em cookie
   httpOnly. Para exibir o nome da entidade vinculada, usar/criar um `/auth/me` que devolva
   `relacao_info` (o legado tinha esse formato).
2. **Mapa estático único** (ex.: `src/lib/permissoes.ts`) mapeando rota → roles/níveis:

   ```ts
   export const ROTAS = {
     '/franqueadoras': { roles: [1, 2] },
     '/usuarios':      { roles: [1, 2] },
     '/copas':         { roles: [1, 2] },
     // ...
   } as const;
   ```

   Esse mesmo mapa alimenta o `middleware.ts` (bloqueio de rota) **e** a renderização
   do sidemenu — rota e menu nunca divergem.
3. **Enforcement server-side**: checagem no `middleware.ts`/Server Component lendo a sessão;
   usuário não recebe HTML de tela proibida. Nada de esconder botão via JS como única barreira.
4. **Front é UX, API é segurança**: mesmo forçando rota, a API devolve 403/404.
   O front pode manter o permissionamento simples.

## 4. Instrução para a nova sessão

Leia este documento, explore a estrutura do projeto front e implemente o permissionamento
conforme a seção 3, validando os nomes reais das rotas/páginas existentes antes de montar
o mapa estático.
