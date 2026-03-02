import { db } from "../../db/client.js";
import { AppError } from "../../middleware/error.js";

export interface InitialDataOutput {
  products: Array<{
    id: number;
    code: string;
    name: string;
    price: number;
    description: string | null;
    active: boolean;
  }>;
  customers: Array<{
    id: number;
    name: string;
    document: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    active: boolean;
  }>;
  sales: Array<{
    id: number;
    customerId: number | null;
    saleDate: Date;
    total: number;
    paymentMethod: string;
    isCredit: boolean;
    generateInvoice: boolean;
    status: string;
    notes: string | null;
    items: Array<{
      productId: number;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>;
    payments: Array<{
      amount: number;
      paymentDate: Date;
      paymentMethod: string;
      notes: string | null;
    }>;
  }>;
}

export class GetInitialDataUseCase {
  async execute(userId: number): Promise<InitialDataOutput> {
    console.log("[USE-CASE] Buscando dados iniciais para usuário ID:", userId);

    // Verificar se o usuário existe
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.log("[USE-CASE] ❌ Usuário não encontrado");
      throw new AppError("Usuário não encontrado", 404, "USER_NOT_FOUND");
    }

    // Buscar produtos
    console.log("[USE-CASE] Buscando produtos...");
    const products = await db.product.findMany({
      where: { userId, active: true },
      orderBy: { name: "asc" },
    });

    // Buscar clientes
    console.log("[USE-CASE] Buscando clientes...");
    const customers = await db.customer.findMany({
      where: { userId, active: true },
      orderBy: { name: "asc" },
    });

    // Buscar vendas com itens e pagamentos
    console.log("[USE-CASE] Buscando vendas...");
    const sales = await db.sale.findMany({
      where: { userId },
      include: {
        items: true,
        payments: true,
      },
      orderBy: { saleDate: "desc" },
      take: 1000, // Limitar a 1000 vendas mais recentes
    });

    console.log("[USE-CASE] ✅ Dados encontrados:", {
      products: products.length,
      customers: customers.length,
      sales: sales.length,
    });

    return {
      products: products.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        price: Number(p.price),
        description: p.description,
        active: p.active,
      })),
      customers: customers.map((c) => ({
        id: c.id,
        name: c.name,
        document: c.document,
        phone: c.phone,
        email: c.email,
        address: c.address,
        active: c.active,
      })),
      sales: sales.map((s) => ({
        id: s.id,
        customerId: s.customerId,
        saleDate: s.saleDate,
        total: Number(s.total),
        paymentMethod: s.paymentMethod,
        isCredit: s.isCredit,
        generateInvoice: s.generateInvoice,
        status: s.status,
        notes: s.notes,
        items: s.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
        })),
        payments: s.payments.map((p) => ({
          amount: Number(p.amount),
          paymentDate: p.paymentDate,
          paymentMethod: p.paymentMethod,
          notes: p.notes,
        })),
      })),
    };
  }
}

