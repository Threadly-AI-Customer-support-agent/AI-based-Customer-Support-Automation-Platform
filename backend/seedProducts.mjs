import 'dotenv/config'
import prisma from './src/lib/prisma.js'

async function main() {
    const email = 'adarsh.kumar23b@iiitg.ac.in'

    console.log(`Searching for user: ${email}...`)
    const user = await prisma.user.findUnique({
        where: { email },
    })

    if (!user) {
        console.log(`[Error] User with email ${email} not found. Ensure the user is registered first!`)
        process.exit(1)
    }

    console.log(`User found! ID: ${user.id}`)

    // Seed 3 products
    const products = [
        {
            userId: user.id,
            productName: 'Wireless Noise-Cancelling Headphones',
            status: 'DELIVERED',
            trackingNo: 'TRK-WH1000XM5'
        },
        {
            userId: user.id,
            productName: 'Mechanical Gaming Keyboard',
            status: 'PROCESSING',
            trackingNo: 'TRK-K70RGB'
        },
        {
            userId: user.id,
            productName: 'Ergonomic Office Chair',
            status: 'SHIPPED',
            trackingNo: 'TRK-HM-AERON'
        }
    ]

    console.log('Inserting products...')

    await prisma.order.createMany({
        data: products
    })

    console.log('Successfully added 3 products to the account!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
