import { getAuthToken } from "./auth";
import type { Sale, Product, Customer } from "../types";
import { invoke } from "@tauri-apps/api/tauri";
import { getPendingInvoices, updateInvoiceStatus, listProducts, listCustomers } from "./api";

const API_BASE_URL = "http://localhost:8000";

/**
 * Timeout para requisições de sincronização (5 segundos)
 * Evita esperas longas quando não há internet
 */
const SYNC_TIMEOUT = 5000;

/**
 * Fetch com timeout para evitar esperas longas sem internet
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = SYNC_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Timeout: Sem resposta do servidor. Verifique sua conexão.");
    }
    throw error;
  }
}

export interface SyncResponse {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * Sincroniza um produto individual com o servidor
 */
export async function syncProduct(product: Product): Promise<SyncResponse> {
  try {
    console.log("[SYNC-PRODUCT] Iniciando sincronização do produto:", product.code);
    console.log("[SYNC-PRODUCT] Chamando getAuthToken()...");
    const token = await getAuthToken();
    console.log("[SYNC-PRODUCT] getAuthToken() retornou:", token ? "token encontrado" : "null/undefined");
    
    if (!token) {
      console.warn("[SYNC-PRODUCT] ❌ Token não encontrado, sincronização ignorada");
      console.warn("[SYNC-PRODUCT] Verificando se usuário está autenticado...");
      return {
        success: false,
        message: "Usuário não autenticado",
      };
    }

    console.log("[SYNC-PRODUCT] Token recuperado (primeiros 30 chars):", token.substring(0, 30) + "...");
    console.log("[SYNC-PRODUCT] Token completo (para debug):", token);
    console.log("[SYNC-PRODUCT] Tipo do token:", typeof token);
    console.log("[SYNC-PRODUCT] Tamanho do token:", token.length);

    const uploadData = {
      products: [{
        code: product.code,
        name: product.name,
        price: parseFloat(product.price.toString()),
        description: product.description || null,
        active: product.active !== false,
      }],
      customers: [],
    };

    console.log("[SYNC-PRODUCT] Enviando dados para:", `${API_BASE_URL}/sync/upload`);
    console.log("[SYNC-PRODUCT] Dados do produto:", { code: product.code, name: product.name });
    console.log("[SYNC-PRODUCT] Token completo:", token);
    console.log("[SYNC-PRODUCT] Authorization header completo:", `Bearer ${token}`);

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    console.log("[SYNC-PRODUCT] Headers sendo enviados:", headers);

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/sync/upload`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(uploadData),
      },
      SYNC_TIMEOUT
    );

    console.log("[SYNC-PRODUCT] Resposta recebida - Status:", response.status, response.statusText);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Erro ao sincronizar produto" }));
      console.error("[SYNC-PRODUCT] ❌ Erro na resposta:", error);
      console.error("[SYNC-PRODUCT] Status:", response.status);
      console.error("[SYNC-PRODUCT] Headers:", Object.fromEntries(response.headers.entries()));
      return {
        success: false,
        message: error.message || error.error || "Erro ao sincronizar produto",
      };
    }

    const result = await response.json();
    console.log("[SYNC-PRODUCT] ✅ Produto sincronizado com sucesso:", product.code, result);
    return { success: true, data: result };
  } catch (error) {
    console.error("[SYNC-PRODUCT] ❌ Erro ao sincronizar produto:", error);
    console.error("[SYNC-PRODUCT] Stack:", error instanceof Error ? error.stack : "N/A");
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Sincroniza um cliente individual com o servidor
 */
export async function syncCustomer(customer: Customer): Promise<SyncResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      console.warn("[SYNC] Usuário não autenticado, sincronização ignorada");
      return {
        success: false,
        message: "Usuário não autenticado",
      };
    }

    const uploadData = {
      products: [],
      customers: [{
        name: customer.name,
        document: customer.document || null,
        phone: customer.phone || null,
        email: customer.email || null,
        address: customer.address || null,
        active: customer.active !== false,
      }],
    };

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/sync/upload`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(uploadData),
      },
      SYNC_TIMEOUT
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Erro ao sincronizar cliente" }));
      console.error("[SYNC] Erro ao sincronizar cliente:", error);
      return {
        success: false,
        message: error.message || "Erro ao sincronizar cliente",
      };
    }

    console.log("[SYNC] ✅ Cliente sincronizado:", customer.name);
    return { success: true };
  } catch (error) {
    console.error("[SYNC] Erro ao sincronizar cliente:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Envia dados locais para o servidor (upload)
 * Busca produtos, clientes e vendas locais e envia para o servidor
 * @deprecated Use syncProduct ou syncCustomer para sincronização individual
 */
async function uploadLocalData(): Promise<void> {
  const token = await getAuthToken();
  
  if (!token) {
    console.warn("[SYNC-UPLOAD] Usuário não autenticado, upload ignorado");
    return;
  }

  // Buscar dados locais
  const localProducts = await listProducts();
  const localCustomers = await listCustomers();
  // Vendas serão sincronizadas individualmente quando criadas

  console.log("[SYNC-UPLOAD] Dados locais encontrados:", {
    products: localProducts.length,
    customers: localCustomers.length,
  });

  // Preparar dados para envio
  const uploadData = {
    products: localProducts.map((p: any) => ({
      code: p.code,
      name: p.name,
      price: parseFloat(p.price.toString()),
      description: p.description || null,
      active: p.active !== false,
    })),
    customers: localCustomers.map((c: any) => ({
      name: c.name,
      document: c.document || null,
      phone: c.phone || null,
      email: c.email || null,
      address: c.address || null,
      active: c.active !== false,
    })),
  };

  // Enviar para o servidor
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/sync/upload`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(uploadData),
    },
    SYNC_TIMEOUT
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao enviar dados" }));
    throw new Error(error.message || "Erro ao enviar dados locais para o servidor");
  }

  const result = await response.json();
  console.log("[SYNC-UPLOAD] ✅ Dados enviados:", result);
}

/**
 * Sincroniza uma venda com a API cloud
 * Esta função é não-bloqueante e não lança erros para não interromper o fluxo da venda
 */
export async function syncSale(sale: Sale): Promise<SyncResponse> {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      console.warn("[SYNC] Usuário não autenticado, sincronização ignorada");
      return {
        success: false,
        message: "Usuário não autenticado",
      };
    }

    // Prepara os dados da venda para sincronização
    const syncData = {
      sale: {
        id: sale.id,
        customer_id: sale.customer_id,
        sale_date: sale.sale_date,
        total: sale.total,
        payment_method: sale.payment_method,
        is_credit: sale.is_credit,
        generate_invoice: sale.generate_invoice,
        status: sale.status,
        items: sale.items?.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
        })),
      },
    };

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/sync/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(syncData),
      },
      SYNC_TIMEOUT
    );

    const data = await response.json();
    
    // Sempre mostra no console o retorno da API
    console.log("[SYNC] Resposta da API:", data);

    if (!response.ok) {
      console.error("[SYNC] Erro na sincronização:", data);
      return {
        success: false,
        message: data.message || "Erro ao sincronizar venda",
      };
    }

    console.log("[SYNC] Venda sincronizada com sucesso:", sale.id);
    return {
      success: true,
      data,
    };
  } catch (error) {
    // Não lança erro para não interromper o fluxo da venda
    console.error("[SYNC] Erro ao sincronizar venda:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Sincroniza múltiplas vendas pendentes
 */
export async function syncPendingSales(sales: Sale[]): Promise<SyncResponse[]> {
  const results = await Promise.allSettled(
    sales.map((sale) => syncSale(sale))
  );

  return results.map((result) =>
    result.status === "fulfilled"
      ? result.value
      : { success: false, message: "Erro ao processar sincronização" }
  );
}

/**
 * Sincronização inicial: busca dados do servidor e atualiza SQLite local
 * Deve ser chamada após login bem-sucedido
 */
export async function syncInitialData(): Promise<SyncResponse> {
  try {
    console.log("[SYNC] Iniciando sincronização inicial...");
    const token = await getAuthToken();
    
    if (!token) {
      console.warn("[SYNC] Usuário não autenticado, sincronização ignorada");
      return {
        success: false,
        message: "Usuário não autenticado",
      };
    }

    console.log("[SYNC] Token recuperado:", token.substring(0, 20) + "...");

    // Nota: Não fazemos upload no login porque o banco local foi limpo
    // Dados criados localmente devem ser sincronizados imediatamente quando criados
    // O servidor é a fonte de verdade e filtra por empresaId
    
    // Buscar dados do servidor (download)
    // Os dados já vêm filtrados por empresaId do servidor
    console.log("[SYNC] Buscando dados do servidor...");
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/sync/initial`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
      SYNC_TIMEOUT
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Erro ao buscar dados" }));
      console.error("[SYNC] Erro ao buscar dados:", error);
      // Em modo incremental, não limpamos dados, então retorna erro
      return {
        success: false,
        message: error.message || "Erro ao buscar dados do servidor",
      };
    }

    const data = await response.json();
    console.log("[SYNC] Dados recebidos:", {
      products: data.products?.length || 0,
      customers: data.customers?.length || 0,
      sales: data.sales?.length || 0,
    });

    // Converter dados da API para o formato esperado pelo Rust
    const products = (data.products || []).map((p: any) => ({
      id: null,
      code: p.code,
      name: p.name,
      price: p.price,
      description: p.description || null,
      active: p.active !== false,
      created_at: null,
      updated_at: null,
    }));

    const customers = (data.customers || []).map((c: any) => ({
      id: null,
      name: c.name,
      document: c.document || null,
      phone: c.phone || null,
      email: c.email || null,
      address: c.address || null,
      active: c.active !== false,
      created_at: null,
      updated_at: null,
    }));

    // Processar vendas e pagamentos
    const sales: any[] = [];
    const payments: any[] = [];
    
    (data.sales || []).forEach((s: any) => {
      const remoteSaleId = s.id; // ID remoto da venda
      
      sales.push({
        id: null,
        customer_id: s.customerId || null,
        customer_name: null,
        sale_date: new Date(s.saleDate).toISOString(),
        total: s.total,
        payment_method: s.paymentMethod,
        is_credit: s.isCredit || false,
        generate_invoice: s.generateInvoice !== false,
        status: s.status || "completed",
        notes: s.notes || null,
        created_at: null,
        updated_at: null,
        items: (s.items || []).map((item: any) => ({
          id: null,
          sale_id: null,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          subtotal: item.subtotal,
        })),
      });
      
      // Processar pagamentos da venda
      (s.payments || []).forEach((p: any) => {
        payments.push({
          id: null,
          sale_id: remoteSaleId, // Será ajustado após inserir vendas
          amount: p.amount,
          payment_date: new Date(p.paymentDate).toISOString(),
          payment_method: p.paymentMethod,
          notes: p.notes || null,
          created_at: null,
        });
      });
    });

    // Chamar comando Tauri para sincronizar
    console.log("[SYNC] Chamando comando Tauri para sincronizar...");
    await invoke("sync_initial_data", {
      products,
      customers,
      sales,
      payments: [], // Por enquanto, pagamentos não serão sincronizados (requer mapeamento de IDs)
    });

    console.log("[SYNC] ✅ Sincronização inicial concluída com sucesso");
    
    // Processar notas fiscais pendentes em background (não bloqueia)
    processPendingInvoices().catch((error) => {
      console.error("[SYNC] ⚠️ Erro ao processar notas fiscais pendentes:", error);
    });
    
    // Disparar evento customizado para notificar que a sincronização foi concluída
    // Isso permite que as páginas recarreguem seus dados
    window.dispatchEvent(new CustomEvent("syncCompleted"));
    
    return {
      success: true,
      message: "Dados sincronizados com sucesso",
      data: {
        products: products.length,
        customers: customers.length,
        sales: sales.length,
      },
    };
  } catch (error) {
    console.error("[SYNC] ❌ Erro na sincronização inicial:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido na sincronização",
    };
  }
}

/**
 * Processa notas fiscais pendentes (status "pending")
 * Tenta gerar as notas fiscais reais via API quando houver internet
 * Esta função é chamada automaticamente após sincronização inicial
 */
export async function processPendingInvoices(): Promise<void> {
  try {
    console.log("[INVOICE] Processando notas fiscais pendentes...");
    
    const pendingInvoices = await getPendingInvoices();
    
    if (pendingInvoices.length === 0) {
      console.log("[INVOICE] Nenhuma nota fiscal pendente");
      return;
    }
    
    console.log(`[INVOICE] Encontradas ${pendingInvoices.length} notas fiscais pendentes`);
    
    const token = await getAuthToken();
    if (!token) {
      console.warn("[INVOICE] Usuário não autenticado, não é possível processar notas fiscais");
      return;
    }
    
    // Processar cada nota fiscal pendente
    for (const invoice of pendingInvoices) {
      try {
        console.log(`[INVOICE] Processando nota fiscal ID: ${invoice.id}, Venda ID: ${invoice.sale_id}`);
        
        // Buscar dados da venda para enviar à API
        const sale = await invoke<Sale>("get_sale", { id: invoice.sale_id });
        
        // Preparar dados para envio à API
        const invoiceData = {
          sale_id: invoice.sale_id,
          sale: {
            id: sale.id,
            customer_id: sale.customer_id,
            sale_date: sale.sale_date,
            total: sale.total,
            payment_method: sale.payment_method,
            items: sale.items?.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              subtotal: item.subtotal,
            })),
          },
          provisional_number: invoice.invoice_number, // Número provisório local
        };
        
        // Tentar processar nota fiscal via API
        const response = await fetchWithTimeout(
          `${API_BASE_URL}/invoices/process`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(invoiceData),
          },
          SYNC_TIMEOUT
        );
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: "Erro ao processar nota fiscal" }));
          console.error(`[INVOICE] Erro ao processar nota fiscal ${invoice.id}:`, error);
          
          // Atualizar status para "error" se houver erro
          if (invoice.id) {
            await updateInvoiceStatus(invoice.id, "error");
          }
          continue;
        }
        
        const result = await response.json();
        console.log(`[INVOICE] ✅ Nota fiscal ${invoice.id} processada com sucesso:`, result);
        
        // Atualizar nota fiscal local com dados reais da SEFAZ
        if (invoice.id && result.invoice_number && result.access_key) {
          await invoke("update_invoice_data", {
            id: invoice.id,
            invoice_number: result.invoice_number,
            access_key: result.access_key,
            xml_content: result.xml_content || null,
            status: "issued",
          });
          console.log(`[INVOICE] Nota fiscal ${invoice.id} atualizada com dados da SEFAZ`);
        } else {
          // Se não retornou dados completos, apenas atualiza status
          await updateInvoiceStatus(invoice.id!, "issued");
          console.log(`[INVOICE] Nota fiscal ${invoice.id} atualizada para status "issued"`);
        }
      } catch (error) {
        console.error(`[INVOICE] Erro ao processar nota fiscal ${invoice.id}:`, error);
        // Continuar com próxima nota mesmo se houver erro
        if (invoice.id) {
          try {
            await updateInvoiceStatus(invoice.id, "error");
          } catch (updateError) {
            console.error(`[INVOICE] Erro ao atualizar status da nota ${invoice.id}:`, updateError);
          }
        }
      }
    }
    
    console.log("[INVOICE] ✅ Processamento de notas fiscais concluído");
  } catch (error) {
    console.error("[INVOICE] ❌ Erro ao processar notas fiscais pendentes:", error);
    // Não lança erro para não interromper outros processos
  }
}

