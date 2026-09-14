import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Starter dishes templates according to establishment type
const STARTER_TEMPLATES: Record<string, { category: string; icon: string; products: { name: string; price: number; description: string; image: string; calories?: number }[] }[]> = {
  gastronomique: [
    {
      category: 'Entrées Fraîcheur',
      icon: '🥗',
      products: [
        { name: 'Carpaccio de Saint-Jacques & Mangue', price: 3500, description: 'Tranches fines de noix de Saint-Jacques, coulis de mangue épicée et baies roses.', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop', calories: 210 },
        { name: 'Salade Gourmande Avocat & Crevettes', price: 3000, description: 'Avocats mûrs à point, crevettes sautées à l\'ail et agrumes.', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop', calories: 260 }
      ]
    },
    {
      category: 'Plats d\'Exception',
      icon: '🍽️',
      products: [
        { name: 'Poulet Braisé Sauvage & Sauce Grand-Veneur', price: 6500, description: 'Poulet fermier mariné 24h, rôti au feu de bois avec purée de patates douces truffée.', image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop', calories: 620 },
        { name: 'Capitaine Grillé aux Épices Royales', price: 7500, description: 'Filet de capitaine croustillant, sauce vierge africaine et attiéké parfumé.', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop', calories: 510 }
      ]
    },
    {
      category: 'Boissons & Vins',
      icon: '🍷',
      products: [
        { name: 'Cocktail Signature Hibiscus Royal', price: 2500, description: 'Infusion de bissap rouge bio, menthe fraîche et touche de gingembre.', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop', calories: 130 },
        { name: 'Nectar de Baobab Glacé', price: 2000, description: 'Fruit de baobab sauvage pressé à froid, riche en antioxydants.', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop', calories: 95 }
      ]
    }
  ],
  grillades: [
    {
      category: 'Grillades au Feu de Bois',
      icon: '🔥',
      products: [
        { name: 'Brochettes Suya Bœuf Extra Tendres', price: 4000, description: 'Bœuf de premier choix assaisonné au kankankan traditionnel.', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop', calories: 420 },
        { name: 'Côtes d\'Agneau Marinées', price: 6500, description: 'Côtes d\'agneau persillées, grillées aux herbes aromatiques.', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop', calories: 580 },
        { name: 'Demi-Poulet Braisé Kankan', price: 4500, description: 'Poulet fermier doré au charbon avec oignons et piments marinés.', image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop', calories: 540 }
      ]
    },
    {
      category: 'Accompagnements',
      icon: '🍚',
      products: [
        { name: 'Alloco Croustillant (Plantains frits)', price: 1500, description: 'Bananes plantains mûres frites à l\'huile dorée.', image: 'https://images.unsplash.com/photo-1600335895229-6e75511892c8?w=400&h=300&fit=crop', calories: 310 },
        { name: 'Attiéké Frais Garba', price: 1000, description: 'Semoule de manioc fine cuite à la vapeur.', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop', calories: 190 }
      ]
    },
    {
      category: 'Boissons Fraîches',
      icon: '🍹',
      products: [
        { name: 'Jus de Bissap Maison', price: 1000, description: 'Hibiscus naturel préparé quotidiennement.', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop', calories: 110 },
        { name: 'Jus de Gingembre Citronné', price: 1000, description: 'Gingembre frais relevé d\'un zeste de citron vert.', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop', calories: 85 }
      ]
    }
  ],
  default: [
    {
      category: 'Nos Entrées',
      icon: '🥗',
      products: [
        { name: 'Salade Tropicale Avocat & Mangue', price: 2500, description: 'Salade fraîcheur avec vinaigrette maison.', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop', calories: 190 },
        { name: 'Beignets Salés Croustillants', price: 1500, description: 'Beignets dorés servis avec sauce piquante.', image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop', calories: 250 }
      ]
    },
    {
      category: 'Plats Principaux',
      icon: '🍽️',
      products: [
        { name: 'Plat Signature Maison', price: 5500, description: 'Notre recette incontournable préparée avec des ingrédients frais du marché.', image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop', calories: 590 },
        { name: 'Grillade du Chef & Garniture', price: 4800, description: 'Viande marinée et grillée à la perfection.', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop', calories: 480 }
      ]
    },
    {
      category: 'Boissons & Desserts',
      icon: '🍹',
      products: [
        { name: 'Jus de Bissap Artisanal', price: 1000, description: 'Boisson rafraîchissante aux fleurs d\'hibiscus.', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop', calories: 120 },
        { name: 'Dessert Gourmand du Jour', price: 2500, description: 'Gâteau moelleux et coulis de fruits tropicaux.', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop', calories: 340 }
      ]
    }
  ]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      restaurantName,
      cuisineType = 'gastronomique',
      serviceType = 'both', // 'physical' | 'online' | 'both'
      orderModes,
      city,
      country,
      phone,
      email,
      ownerName,
      currency = 'XOF',
      tableCount = 8,
      billingCycle = 'monthly', // 'monthly' | 'annual'
      paymentMethod = 'mobile_money',
      paymentProvider = 'Wave / MTN / Moov',
      paymentPhone
    } = body

    if (!restaurantName || !ownerName || !email) {
      return NextResponse.json({ error: 'Champs obligatoires manquants (nom, propriétaire, email).' }, { status: 400 })
    }

    // Default order modes according to serviceType
    const resolvedOrderModes = orderModes || (
      serviceType === 'online' ? 'takeaway,delivery' : 'dine_in,takeaway,delivery'
    )

    // Generate unique slug
    let baseSlug = restaurantName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

    if (!baseSlug) baseSlug = 'restaurant'

    let slug = baseSlug
    let counter = 1
    while (await db.restaurant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Determine plan and pricing
    const planPrice = billingCycle === 'annual' ? 54000 : 5500
    const fullAddress = city && country ? `${city}, ${country}` : city || country || 'Afrique'

    // Create Restaurant in DB
    const restaurant = await db.restaurant.create({
      data: {
        name: restaurantName,
        slug,
        description: `Restaurant ${restaurantName} à ${fullAddress}. Menu digital interactif et commandes instantanées.`,
        address: fullAddress,
        phone: phone || null,
        email,
        currency,
        taxRate: 0.18,
        plan: 'pro',
        serviceType,
        orderModes: resolvedOrderModes,
        logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop',
        banner: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop',
      }
    })

    // Create Owner User
    await db.user.create({
      data: {
        email,
        name: ownerName,
        role: 'restaurant_owner',
        restaurantId: restaurant.id
      }
    })

    // Create Tables only if physical or both
    if (serviceType !== 'online') {
      const totalTables = Math.min(Math.max(Number(tableCount) || 8, 1), 50)
      for (let i = 1; i <= totalTables; i++) {
        await db.table.create({
          data: {
            number: `T${i}`,
            capacity: i <= 4 ? 2 : i <= 10 ? 4 : 6,
            restaurantId: restaurant.id
          }
        })
      }
    }

    // Create Categories & Starter Dishes
    const template = STARTER_TEMPLATES[cuisineType] || STARTER_TEMPLATES.default
    let catOrder = 0
    for (const cat of template) {
      const createdCategory = await db.category.create({
        data: {
          name: cat.category,
          icon: cat.icon,
          restaurantId: restaurant.id,
          sortOrder: catOrder++
        }
      })

      let prodOrder = 0
      for (const prod of cat.products) {
        await db.product.create({
          data: {
            name: prod.name,
            description: prod.description,
            price: prod.price,
            image: prod.image,
            calories: prod.calories || 250,
            preparationTime: 20,
            isFeatured: prodOrder === 0,
            categoryId: createdCategory.id,
            restaurantId: restaurant.id,
            sortOrder: prodOrder++
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        address: restaurant.address,
        currency: restaurant.currency,
        plan: restaurant.plan,
        planPrice,
        billingCycle
      },
      message: 'Restaurant créé et activé avec succès !'
    })
  } catch (error) {
    console.error('Erreur création restaurant onboarding:', error)
    return NextResponse.json({ error: 'Échec lors de la création du restaurant.' }, { status: 500 })
  }
}
