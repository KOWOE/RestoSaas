import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Seed demo data
export async function GET() {
  try {
    // Check if we already have data
    const existingRestaurants = await db.restaurant.count()
    if (existingRestaurants > 0) {
      return NextResponse.json({ message: 'Database already seeded', alreadySeeded: true })
    }

    // Create demo restaurant
    const restaurant = await db.restaurant.create({
      data: {
        name: 'Le Jardin Savoureux',
        slug: 'le-jardin-savoureux',
        description: 'Restaurant gastronomique proposant une cuisine africaine moderne avec des saveurs authentiques et des ingrédients locaux.',
        address: 'Cotonou, Bénin',
        phone: '+229 97 12 34 56',
        email: 'contact@le-jardin-savoureux.bj',
        currency: 'XOF',
        taxRate: 0.18,
        plan: 'premium',
        logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop',
        banner: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop',
      },
    })

    // Create categories with products
    const categories = [
      {
        name: 'Entrées',
        icon: '🥗',
        description: 'Commencez votre repas en douceur',
        products: [
          { name: 'Salade de Mangue', description: 'Mangue fraîche, avocat, oignons rouges et vinaigrette au citron vert', price: 2500, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop', calories: 180 },
          { name: 'Brochettes de Crevettes', description: 'Crevettes marinées aux épices, grillées et servies avec sauce pimentée', price: 3500, image: 'https://images.unsplash.com/photo-1565680018093-ebb6b9ab5460?w=400&h=300&fit=crop', calories: 220 },
          { name: 'Acarajé', description: 'Beignets de haricots noirs traditionnels, garnis de pâte de crevettes et sauce piment', price: 1500, image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop', calories: 280 },
          { name: 'Samoussas aux Légumes', description: 'Feuilles croustillantes farcies aux légumes épicés', price: 2000, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop', calories: 200 },
        ],
      },
      {
        name: 'Plats Principaux',
        icon: '🍽️',
        description: 'Les spécialités de la maison',
        products: [
          { name: 'Poulet Moambé', description: 'Poulet fermier braisé dans la sauce moambé, accompagné de riz et plantains', price: 5500, image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop', calories: 650, preparationTime: 25, isFeatured: true },
          { name: 'Thiéboudienne', description: 'Riz rouge au poisson, légumes et sauce tomate épicée - Spécialité sénégalaise', price: 4500, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop', calories: 580, preparationTime: 30, isFeatured: true },
          { name: 'Poulet DG', description: 'Poulet rôti aux plantains, haricots verts et sauce aux arachides', price: 6000, image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&h=300&fit=crop', calories: 720, preparationTime: 20 },
          { name: 'Poisson Braisé', description: 'Poisson entier grillé, mariné aux épices locales, servi avec attiéké', price: 5000, image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop', calories: 450, preparationTime: 25 },
          { name: 'Mafé', description: 'Ragoût de bœuf à la sauce d\'arachide, riz et légumes', price: 4800, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', calories: 680, preparationTime: 30 },
        ],
      },
      {
        name: 'Grillades',
        icon: '🔥',
        description: 'Viandes et poissons grillés',
        products: [
          { name: 'Brochettes de Bœuf', description: 'Bœuf mariné aux épices, grillé sur feu de bois', price: 4000, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop', calories: 380, preparationTime: 15 },
          { name: 'Côtes d\'Agneau', description: 'Côtes d\'agneau grillées, sauce moutarde et herbes', price: 7000, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop', calories: 520, preparationTime: 20, isFeatured: true },
          { name: 'Poulet Yassa', description: 'Poulet grillé mariné au citron et oignons caramélisés', price: 4500, image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=300&fit=crop', calories: 420, preparationTime: 20 },
        ],
      },
      {
        name: 'Accompagnements',
        icon: '🍚',
        description: 'Pour compléter votre plat',
        products: [
          { name: 'Riz Blanc', description: 'Riz parfumé cuit à la vapeur', price: 800, image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&h=300&fit=crop', calories: 200 },
          { name: 'Plantains Frits', description: 'Bananes plantains dorées et croustillantes', price: 1200, image: 'https://images.unsplash.com/photo-1600335895229-6e75511892c8?w=400&h=300&fit=crop', calories: 280 },
          { name: 'Attiéké', description: 'Semoule de manioc fermentée', price: 1000, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop', calories: 180 },
          { name: 'Frites Maison', description: 'Pommes de terre frites maison', price: 1500, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop', calories: 320 },
        ],
      },
      {
        name: 'Boissons',
        icon: '🍹',
        description: 'Rafraîchissements et jus naturels',
        products: [
          { name: 'Jus de Bissap', description: 'Jus d\'hibiscus frais et naturel', price: 1000, image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop', calories: 120 },
          { name: 'Jus de Gingembre', description: 'Jus de gingembre frais avec citron', price: 1000, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop', calories: 80 },
          { name: 'Jus de Baobab', description: 'Jus de fruit de baobab, riche en vitamines', price: 1200, image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop', calories: 100 },
          { name: 'Eau Minérale', description: 'Eau minérale naturelle', price: 500, image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop', calories: 0 },
          { name: 'Coca-Cola', description: 'Boisson gazeuse rafraîchissante', price: 800, image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop', calories: 140 },
        ],
      },
      {
        name: 'Desserts',
        icon: '🍰',
        description: 'Finitions sucrées',
        products: [
          { name: 'Banane Flambée', description: 'Banane caramélisée flambée au rhum', price: 2500, image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop', calories: 280 },
          { name: 'Glace Maison', description: 'Glace artisanale à la vanille ou chocolat', price: 2000, image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=300&fit=crop', calories: 220 },
          { name: 'Fruits de Saison', description: 'Assortiment de fruits frais locaux', price: 1800, image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=300&fit=crop', calories: 150 },
          { name: 'Moelleux au Chocolat', description: 'Gâteau au chocolat coulant, glace vanille', price: 3000, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop', calories: 420, isFeatured: true },
        ],
      },
    ]

    let sortOrder = 0
    for (const catData of categories) {
      const category = await db.category.create({
        data: {
          name: catData.name,
          icon: catData.icon,
          description: catData.description,
          restaurantId: restaurant.id,
          sortOrder: sortOrder++,
        },
      })

      let productSortOrder = 0
      for (const prodData of catData.products) {
        await db.product.create({
          data: {
            name: prodData.name,
            description: prodData.description,
            price: prodData.price,
            image: prodData.image,
            calories: prodData.calories,
            preparationTime: prodData.preparationTime,
            isFeatured: prodData.isFeatured || false,
            categoryId: category.id,
            restaurantId: restaurant.id,
            sortOrder: productSortOrder++,
          },
        })
      }
    }

    // Create tables
    for (let i = 1; i <= 10; i++) {
      await db.table.create({
        data: {
          number: `T${i}`,
          capacity: i <= 4 ? 2 : i <= 7 ? 4 : 6,
          restaurantId: restaurant.id,
        },
      })
    }

    // Create demo user
    await db.user.create({
      data: {
        email: 'admin@le-jardin-savoureux.bj',
        name: 'Admin Restaurant',
        role: 'restaurant_owner',
        restaurantId: restaurant.id,
      },
    })

    // Create some demo orders
    const products = await db.product.findMany({
      where: { restaurantId: restaurant.id },
      take: 5,
    })

    const orderStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']
    const paymentMethods = ['mobile_money', 'card', 'cash']

    for (let i = 0; i < 15; i++) {
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)]
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
      const isPaid = status !== 'pending'

      const randomProducts = products.slice(0, Math.floor(Math.random() * 3) + 1)
      let subtotal = 0
      const items = randomProducts.map(p => {
        const qty = Math.floor(Math.random() * 3) + 1
        subtotal += p.price * qty
        return { productId: p.id, quantity: qty, price: p.price }
      })

      const tax = subtotal * restaurant.taxRate
      const total = subtotal + tax

      const order = await db.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          restaurantId: restaurant.id,
          customerName: `Client ${i + 1}`,
          customerPhone: `+229 97 ${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
          tableNumber: i < 5 ? `T${Math.floor(Math.random() * 10) + 1}` : null,
          type: i < 8 ? 'dine_in' : 'takeaway',
          subtotal,
          tax,
          total,
          status,
          paymentStatus: isPaid ? 'paid' : 'pending',
          paymentMethod: isPaid ? paymentMethod : null,
          items: { create: items },
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      })

      if (isPaid) {
        await db.payment.create({
          data: {
            orderId: order.id,
            restaurantId: restaurant.id,
            amount: total,
            status: 'success',
            method: paymentMethod,
            transactionId: `TXN-${Date.now()}-${i}`,
          },
        })
      }
    }

    function generateOrderNumber(): string {
      const timestamp = Date.now().toString(36).toUpperCase()
      const random = Math.random().toString(36).substring(2, 6).toUpperCase()
      return `ORD-${timestamp}-${random}`
    }

    return NextResponse.json({
      message: 'Database seeded successfully!',
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
      },
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 })
  }
}
