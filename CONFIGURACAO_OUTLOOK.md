# Configuração da Integração com Outlook/Microsoft Graph

Este guia explica como configurar a integração entre o sistema Spark & Bloom e o Outlook Calendar usando Microsoft Graph API.

---

## ❓ “Não tenho Azure, só tenho Outlook do 365”

**Não precisas de nenhum serviço pago da Azure.** O teu **Outlook do Microsoft 365** já está no ecossistema da Microsoft. Para a app falar com o teu calendário, só é preciso:

1. **Registar uma “Aplicação” no Azure Portal** (portal.azure.com)  
   - Isto é **grátis**  
   - Não exige subscrição paga da Azure  
   - É só o sítio onde a Microsoft centraliza permissões para aceder a Outlook, Calendário, etc.

2. **Obter 3 valores:** Client ID, Client Secret e Tenant ID  
   - O **Tenant** é a “organização” do teu Microsoft 365 (a tua escola, clínica, ou conta)  
   - O **Client ID** e **Client Secret** são como o “utilizador e password” da tua app para a Microsoft

Resumindo: **Outlook 365 e o Azure Portal (para registar a app) usam a mesma identidade Microsoft. Não precisas de contratar mais nada na Azure** – só de criar essa aplicação e copiar os 3 valores para o `.env`. Os passos abaixo mostram como.

---

## 📋 Visão Geral

A integração permite:
- **Sincronização automática**: Eventos criados no Outlook são automaticamente importados como sessões
- **Sincronização bidirecional**: Criar sessões no sistema e elas aparecem no Outlook (a implementar)
- **Confirmação/Rejeição**: Terapeuta pode confirmar ou rejeitar sessões diretamente no Outlook

## 🔧 Passo 1: Registrar Aplicação no Azure Portal

1. Acesse o [Azure Portal](https://portal.azure.com)
2. Vá para **Azure Active Directory** > **App registrations**
3. Clique em **New registration**
4. Preencha:
   - **Name**: `Spark & Bloom - Speech Therapy`
   - **Supported account types**: Escolha conforme sua necessidade (Single tenant, Multi-tenant, etc.)
   - **Redirect URI**: Deixe em branco por enquanto (não necessário para Client Credentials)
5. Clique em **Register**

## 🔑 Passo 2: Configurar Permissões da API

1. Na página da aplicação, vá para **API permissions**
2. Clique em **Add a permission**
3. Selecione **Microsoft Graph**
4. Escolha **Application permissions** (não Delegated)
5. Adicione as seguintes permissões:
   - `Calendars.Read` - Ler eventos do calendário
   - `Calendars.ReadWrite` - Criar e atualizar eventos
   - `Mail.Send` - Enviar emails (para notificações)
   - `User.Read.All` - Ler informações de usuários (opcional, se necessário)
6. Clique em **Add permissions**

## 🔐 Passo 3: Criar Client Secret

1. Na página da aplicação, vá para **Certificates & secrets**
2. Clique em **New client secret**
3. Preencha:
   - **Description**: `Spark Bloom Secret`
   - **Expires**: Escolha uma data (recomendado: 24 meses)
4. Clique em **Add**
5. **IMPORTANTE**: Copie o **Value** do secret imediatamente (ele só aparece uma vez!)

## ✅ Passo 4: Conceder Admin Consent

1. Na página **API permissions**, clique em **Grant admin consent for [seu tenant]**
2. Confirme a ação
3. Verifique que todas as permissões mostram **Granted for [tenant]**

## 📝 Passo 5: Obter IDs Necessários

Você precisará de 3 valores:

1. **Client ID (Application ID)**:
   - Na página **Overview** da aplicação
   - Copie o valor de **Application (client) ID**

2. **Tenant ID (Directory ID)**:
   - Na página **Overview** da aplicação
   - Copie o valor de **Directory (tenant) ID**

3. **Client Secret**:
   - O valor que você copiou no Passo 3

## ⚙️ Passo 6: Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Microsoft Graph / Outlook
AZURE_CLIENT_ID=seu-client-id-aqui
AZURE_CLIENT_SECRET=seu-client-secret-aqui
AZURE_TENANT_ID=seu-tenant-id-aqui
GRAPH_API_ENDPOINT=https://graph.microsoft.com/v1.0

# IDs dos calendários para sincronizar (emails dos usuários)
OUTLOOK_CALENDAR_IDS=terapeuta1@exemplo.com,terapeuta2@exemplo.com
```

**Nota**: `OUTLOOK_CALENDAR_IDS` deve conter os emails dos usuários cujos calendários você quer sincronizar, separados por vírgula.

## 🔄 Passo 7: Iniciar Sincronização Automática

### Opção 1: Executar Jobs em Processo Separado

Em um terminal separado, execute:

```bash
npm run start:jobs
```

Isso iniciará os cron jobs que:
- Sincronizam calendários a cada 5 minutos
- Enviam emails de confirmação quando necessário

**Nota**: Este processo precisa estar rodando continuamente para a sincronização automática funcionar.

### Opção 2: Sincronização Manual via API

Você pode sincronizar manualmente a qualquer momento via API (veja abaixo).

## 🔄 Passo 8: Como Funciona a Sincronização

### Sincronização Automática (Outlook → Sistema)

Quando os cron jobs estão ativos, a sincronização ocorre automaticamente a cada 5 minutos. O sistema:

1. Busca eventos no calendário do Outlook
2. Tenta associar cada evento a um utente usando uma das estratégias:
   - **Subject (Assunto)**: Evento com assunto `UTENTE:12345` será associado ao utente com código numérico `12345`
   - **Attendee (Participante)**: Evento com email do utente/pai/mãe como participante
   - **Category (Categoria)**: Evento com categoria `Utente:12345` (código numérico)
   - **Extension (Extensão)**: Evento com propriedade personalizada `patientId` (a implementar)

3. Cria uma sessão no sistema com:
   - Estado: `PENDENTE`
   - Valores calculados da condição comercial vigente
   - Link com o evento do Outlook (`outlookEventId`)

### Como Criar Eventos no Outlook para Sincronização

**Opção 1: Usar código numérico do utente no assunto**
```
Assunto: Sessão - UTENTE:12345
```
Onde `12345` é o código numérico do utente (não o ID).

**Opção 2: Adicionar email do utente como participante**
- Adicione o email do utente (ou pai/mãe) como participante do evento

**Opção 3: Usar categoria**
- Crie uma categoria no Outlook chamada `Utente:12345` (onde `12345` é o código numérico) e atribua ao evento

### Sincronização Manual via API

Você também pode sincronizar manualmente via API (requer autenticação):

```bash
POST /api/graph/sync
Content-Type: application/json
Authorization: Bearer <token>

{
  "calendarIds": ["terapeuta1@exemplo.com"],
  "from": "2026-01-22T00:00:00Z",
  "to": "2026-02-22T00:00:00Z",
  "matchingStrategy": "subject"
}
```

## 🎯 Passo 9: Testar a Integração

1. **Verifique as credenciais**:
   ```bash
   # Teste se consegue obter token
   # (o sistema tentará ao fazer a primeira sincronização)
   ```

2. **Crie um evento de teste no Outlook**:
   - Assunto: `Sessão - UTENTE:1` (substitua `1` pelo código numérico de um utente existente)
   - Data: Hoje ou futuro
   - Duração: 1 hora

3. **Execute sincronização manual** ou aguarde o cron job (5 minutos)

4. **Verifique no sistema**:
   - Vá para a página de Sessões
   - Deve aparecer a sessão criada com estado `PENDENTE`

## 🔔 Passo 10: Confirmação/Rejeição no Outlook

Quando uma sessão é criada, o sistema pode enviar um email com links para:
- **Confirmar sessão**: `/api/webhooks/sessao/[id]/confirm?token=...`
- **Rejeitar sessão**: `/api/webhooks/sessao/[id]/reject?token=...`

Esses links podem ser acessados diretamente ou integrados como botões no Outlook (requer desenvolvimento adicional).

## 🚨 Troubleshooting

### Erro: "Falha ao obter token de acesso"
- Verifique se `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` e `AZURE_TENANT_ID` estão corretos
- Confirme que o Client Secret não expirou
- Verifique se o Admin Consent foi concedido

### Erro: "Insufficient privileges"
- Verifique se todas as permissões foram concedidas com Admin Consent
- Confirme que está usando **Application permissions** (não Delegated)

### Eventos não aparecem no sistema
- Verifique se `OUTLOOK_CALENDAR_IDS` contém os emails corretos
- Confirme que os eventos no Outlook seguem uma das estratégias de matching
- Verifique os logs do servidor para erros específicos

### Sincronização não acontece automaticamente
- Verifique se os cron jobs estão rodando (`npm run start:jobs` em terminal separado)
- Verifique os logs do processo de jobs (deve aparecer "Iniciando sincronização de calendários..." a cada 5 minutos)
- Confirme que `OUTLOOK_CALENDAR_IDS` está configurado

## 📚 Recursos Adicionais

- [Documentação Microsoft Graph](https://docs.microsoft.com/en-us/graph/overview)
- [API de Calendários](https://docs.microsoft.com/en-us/graph/api/resources/calendar)
- [Autenticação com Client Credentials](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow)

## 🔮 Funcionalidades Futuras

- [ ] Criar eventos no Outlook a partir do sistema
- [ ] Webhooks do Microsoft Graph para sincronização em tempo real
- [ ] Integração com botões de ação no Outlook
- [ ] Sincronização de mudanças (atualizações/cancelamentos)
