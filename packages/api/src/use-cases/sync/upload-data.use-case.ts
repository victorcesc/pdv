import { db } from "../../db/client.js";
import { AppError } from "../../middleware/error.js";
import type { Prisma } from "@prisma/client";

export interface UploadDataInput {
  products?: Array<{
    code: string;
    name: string;
    price: number;
    description?: string | null;
    active?: boolean;
  }>;
  customers?: Array<{
    name: string;
    document?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    active?: boolean;
  }>;
  sales?: Array<{
    customerId?: number | null;
    saleDate: string | Date;
    total: number;
    paymentMethod: string;
    isCredit?: boolean;
    generateInvoice?: boolean;
    status?: string;
    notes?: string | null;
    items: Array<{
      productId: number;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>;
    payments?: Array<{
      amount: number;
      paymentDate: string | Date;
      paymentMethod: string;
      notes?: string | null;
    }>;
  }>;
}

export interface UploadDataOutput {
  products: {
    created: number;
    updated: number;
    skipped: number;
  };
  customers: {
    created: number;
    updated: number;
    skipped: number;
  };
  sales: {
    created: number;
    skipped: number;
  };
}

export class UploadDataUseCase {
  async execute(userId: number, input: UploadDataInput): Promise<UploadDataOutput> {
    console.log("[USE-CASE] Iniciando upload de dados para usuário ID:", userId);
    console.log("[USE-CASE] Dados recebidos:", {
      products: input.products?.length || 0,
      customers: input.customers?.length || 0,
      sales: input.sales?.length || 0,
    });

    // Verificar se o usuário existe
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.log("[USE-CASE] ❌ Usuário não encontrado");
      throw new AppError("Usuário não encontrado", 404, "USER_NOT_FOUND");
    }

    const result: UploadDataOutput = {
      products: { created: 0, updated: 0, skipped: 0 },
      customers: { created: 0, updated: 0, skipped: 0 },
      sales: { created: 0, skipped: 0 },
    };

    // Processar produtos
    if (input.products && input.products.length > 0) {
      console.log("[USE-CASE] Processando produtos...");
      for (const productData of input.products) {
        try {
          // Verificar se produto já existe pelo código
          const existing = await db.product.findFirst({
            where: {
              userId,
              code: productData.code,
            },
          });

          if (existing) {
            // Atualizar produto existente
            await db.product.update({
              where: { id: existing.id },
              data: {
                name: productData.name,
                price: productData.price,
                description: productData.description || null,
                active: productData.active !== false,
              },
            });
            result.products.updated++;
          } else {
            // Criar novo produto
            await db.product.create({
              data: {
                userId,
                code: productData.code,
                name: productData.name,
                price: productData.price,
                description: productData.description || null,
                active: productData.active !== false,
              },
            });
            result.products.created++;
          }
        } catch (error) {
          console.error(`[USE-CASE] Erro ao processar produto ${productData.code}:`, error);
          result.products.skipped++;
        }
      }
      console.log("[USE-CASE] ✅ Produtos processados:", result.products);
    }

    // Processar clientes
    if (input.customers && input.customers.length > 0) {
      console.log("[USE-CASE] Processando clientes...");
      for (const customerData of input.customers) {
        try {
          // Se tiver documento, verificar se já existe
          let existing = null;
          if (customerData.document) {
            existing = await db.customer.findFirst({
              where: {
                userId,
                document: customerData.document,
              },
            });
          } else {
            // Se não tiver documento, verificar por nome (menos confiável)
            existing = await db.customer.findFirst({
              where: {
                userId,
                name: customerData.name,
                document: null,
              },
            });
          }

          if (existing) {
            // Atualizar cliente existente
            await db.customer.update({
              where: { id: existing.id },
              data: {
                name: customerData.name,
                document: customerData.document || null,
                phone: customerData.phone || null,
                email: customerData.email || null,
                address: customerData.address || null,
                active: customerData.active !== false,
              },
            });
            result.customers.updated++;
          } else {
            // Criar novo cliente
            await db.customer.create({
              data: {
                userId,
                name: customerData.name,
                document: customerData.document || null,
                phone: customerData.phone || null,
                email: customerData.email || null,
                address: customerData.address || null,
                active: customerData.active !== false,
              },
            });
            result.customers.created++;
          }
        } catch (error) {
          console.error(`[USE-CASE] Erro ao processar cliente ${customerData.name}:`, error);
          result.customers.skipped++;
        }
      }
      console.log("[USE-CASE] ✅ Clientes processados:", result.customers);
    }

    // Processar vendas
    if (input.sales && input.sales.length > 0) {
      console.log("[USE-CASE] Processando vendas...");
      
      // Nota: Assumimos que os IDs de produtos e clientes já estão corretos
      // (vindos do servidor ou já mapeados pelo desktop)
      // Se necessário no futuro, podemos adicionar mapeamento por código/documento aqui

      for (const saleData of input.sales) {
        try {
          // Converter IDs de produtos e clientes se necessário
          // Por enquanto, assumimos que os IDs já estão corretos (vindos do servidor)
          // Se vierem códigos, precisaríamos mapear

          // Criar venda com itens e pagamentos em uma transação
          await db.$transaction(async (tx: Prisma.TransactionClient) => {
            const sale = await tx.sale.create({
              data: {
                userId,
                customerId: saleData.customerId || null,
                saleDate: new Date(saleData.saleDate),
                total: saleData.total,
                paymentMethod: saleData.paymentMethod,
                isCredit: saleData.isCredit || false,
                generateInvoice: saleData.generateInvoice !== false,
                status: saleData.status || "completed",
                notes: saleData.notes || null,
                items: {
                  create: saleData.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    subtotal: item.subtotal,
                  })),
                },
              },
            });

            // Criar pagamentos se houver
            if (saleData.payments && saleData.payments.length > 0) {
              await tx.payment.createMany({
                data: saleData.payments.map(p => ({
                  saleId: sale.id,
                  amount: p.amount,
                  paymentDate: new Date(p.paymentDate),
                  paymentMethod: p.paymentMethod,
                  notes: p.notes || null,
                })),
              });
            }
          });

          result.sales.created++;
        } catch (error) {
          console.error(`[USE-CASE] Erro ao processar venda:`, error);
          result.sales.skipped++;
        }
      }
      console.log("[USE-CASE] ✅ Vendas processadas:", result.sales);
    }

    console.log("[USE-CASE] ✅ Upload concluído:", result);
    return result;
  }
}

