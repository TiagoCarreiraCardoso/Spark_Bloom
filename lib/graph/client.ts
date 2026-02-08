import { Client } from '@microsoft/microsoft-graph-client'
import { ConfidentialClientApplication } from '@azure/msal-node'

let graphClient: Client | null = null
let msalClient: ConfidentialClientApplication | null = null

/**
 * Inicializa o cliente MSAL
 */
export function initMsalClient() {
  if (msalClient) return msalClient

  const config = {
    auth: {
      clientId: process.env.AZURE_CLIENT_ID!,
      clientSecret: process.env.AZURE_CLIENT_SECRET!,
      authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    },
  }

  msalClient = new ConfidentialClientApplication(config)
  return msalClient
}

/**
 * Obtém um token de acesso para Microsoft Graph
 */
export async function getAccessToken(): Promise<string> {
  const msal = initMsalClient()

  const result = await msal.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default'],
  })

  if (!result?.accessToken) {
    throw new Error('Falha ao obter token de acesso')
  }

  return result.accessToken
}

/**
 * Obtém o cliente Graph autenticado
 */
export async function getGraphClient(): Promise<Client> {
  if (graphClient) return graphClient

  const token = await getAccessToken()

  graphClient = Client.init({
    authProvider: (done) => {
      done(null, token)
    },
  })

  return graphClient
}
