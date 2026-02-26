import { getAuthToken } from "./auth";
import type { Sale } from "../types";

const API_BASE_URL = "http://localhost:3000";

export interface SyncResponse {
  success: boolean;
  message?: string;
  data?: any;
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

    const response = await fetch(`${API_BASE_URL}/sync/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(syncData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Sync failed" }));
      console.error("[SYNC] Erro na sincronização:", error);
      return {
        success: false,
        message: error.message || "Erro ao sincronizar venda",
      };
    }

    const data = await response.json();
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

