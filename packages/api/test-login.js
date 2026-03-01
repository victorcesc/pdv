const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('Testando conexão com banco...');
    
    // Verificar se há usuários
    const users = await prisma.user.findMany({
      select: {
        id: true,
        login: true,
        email: true,
        name: true,
      },
      take: 5,
    });
    
    console.log('Usuários encontrados:', users.length);
    users.forEach(u => {
      console.log(`- ID: ${u.id}, Login: ${u.login}, Email: ${u.email || 'null'}, Nome: ${u.name}`);
    });
    
    // Testar busca por login
    if (users.length > 0 && users[0].login) {
      console.log(`\nTestando busca por login: "${users[0].login}"`);
      const found = await prisma.user.findUnique({
        where: { login: users[0].login },
      });
      console.log('Usuário encontrado:', found ? `ID ${found.id}` : 'não encontrado');
    }
    
  } catch (error) {
    console.error('Erro:', error);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
