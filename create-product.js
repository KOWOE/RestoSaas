const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const restaurant = await prisma.restaurant.findFirst({
    include: { categories: true }
  })
  
  if (!restaurant) {
    console.log("No restaurant found. Cannot create product.")
    return
  }

  let category = restaurant.categories[0]
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: "Général",
        restaurantId: restaurant.id
      }
    })
  }

  const product = await prisma.product.create({
    data: {
      name: "Produit de Test",
      description: "Un produit pour tester le paiement",
      price: 25,
      categoryId: category.id,
      restaurantId: restaurant.id,
      isAvailable: true,
    }
  })

  console.log("Produit créé avec succès:", product)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
